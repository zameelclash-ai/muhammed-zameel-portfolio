// GET  /api/content  -> the published site content (everyone)
// POST /api/content  -> staff login check, or publish new content (staff only)
// Content is stored in Vercel Blob as versioned JSON files; the newest 10 are kept as backups.
import * as realBlob from "@vercel/blob";
import { send, readBody, authorised } from "./_lib.js";

const PREFIX = "site/content-";
const KEEP = 10;
const PUBLIC_CACHE = "public, s-maxage=15, stale-while-revalidate=300";
const newestFirst = (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt);

export function makeHandler(blob) {
  return async function handler(req, res) {
    try {
      if (req.method === "GET") {
        const { blobs } = await blob.list({ prefix: PREFIX, limit: 100 });
        if (!blobs.length) return send(res, 200, {}, PUBLIC_CACHE);
        blobs.sort(newestFirst);
        const r = await fetch(blobs[0].url, { cache: "no-store" });
        if (!r.ok) throw new Error("Could not read saved content");
        return send(res, 200, await r.json(), PUBLIC_CACHE);
      }
      if (req.method === "POST") {
        let body;
        try { body = await readBody(req); } catch { return send(res, 400, { error: "Bad request" }); }
        if (!authorised(body.user, body.password)) return send(res, 401, { error: "Wrong user name or password" });
        if (body.check) return send(res, 200, { ok: true });
        const c = body.content;
        if (!c || typeof c !== "object" || Array.isArray(c)) return send(res, 400, { error: "No content" });
        const text = JSON.stringify(c);
        if (text.length > 4000000) return send(res, 413, { error: "Content is too large. Use smaller photos." });
        await blob.put(PREFIX + Date.now() + ".json", text, { access: "public", contentType: "application/json", addRandomSuffix: true });
        const { blobs } = await blob.list({ prefix: PREFIX, limit: 100 });
        const old = blobs.sort(newestFirst).slice(KEEP).map((b) => b.url);
        if (old.length) await blob.del(old);
        return send(res, 200, { ok: true });
      }
      return send(res, 405, { error: "Method not allowed" });
    } catch (e) {
      return send(res, 500, { error: "Server error: " + (e && e.message ? e.message : "unknown") });
    }
  };
}

export default makeHandler(realBlob);
