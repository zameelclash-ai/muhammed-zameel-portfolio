// POST /api/upload  -> staff upload a photo (already resized in the browser); returns its public URL.
import * as realBlob from "@vercel/blob";
import { send, readBody, authorised } from "./_lib.js";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function makeHandler(blob) {
  return async function handler(req, res) {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
    let body;
    try { body = await readBody(req); } catch { return send(res, 400, { error: "Bad request" }); }
    if (!authorised(body.user, body.password)) return send(res, 401, { error: "Not allowed" });
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.dataUrl || ""));
    if (!m) return send(res, 400, { error: "That is not a picture." });
    const bytes = Buffer.from(m[2], "base64");
    if (bytes.length > 3000000) return send(res, 413, { error: "Photo is too large." });
    try {
      const saved = await blob.put("site/photos/photo." + TYPES[m[1]], bytes, { access: "public", contentType: m[1], addRandomSuffix: true });
      return send(res, 200, { url: saved.url });
    } catch (e) {
      return send(res, 500, { error: "Upload failed: " + (e && e.message ? e.message : "unknown") });
    }
  };
}

export default makeHandler(realBlob);
