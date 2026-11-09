// GET /api/content: published site content. POST: staff login check or publish (staff only).
// Stored in Netlify Blobs; the newest 10 versions are kept as backups.
import { getStore } from "@netlify/blobs";
import { authorised } from "../../lib/auth.js";

const json = (obj, status = 200, cache = "no-store") =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": cache } });
const env = () => ({ ADMIN_USER: Netlify.env.get("ADMIN_USER"), ADMIN_PASSWORD: Netlify.env.get("ADMIN_PASSWORD") });

export const handle = async (req, store, envVars) => {
  if (req.method === "GET") {
    const data = await store.get("content", { type: "json" });
    return json(data || {});
  }
  if (req.method === "POST") {
    let body; try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
    if (!authorised(body.user, body.password, envVars)) return json({ error: "Wrong user name or password" }, 401);
    if (body.check) return json({ ok: true });
    const c = body.content;
    if (!c || typeof c !== "object" || Array.isArray(c)) return json({ error: "No content" }, 400);
    if (JSON.stringify(c).length > 4000000) return json({ error: "Content is too large. Use smaller photos." }, 413);
    const previous = await store.get("content", { type: "json" });
    if (previous) await store.setJSON("backup/" + Date.now(), previous);
    await store.setJSON("content", c);
    const { blobs } = await store.list({ prefix: "backup/" });
    const old = blobs.map((b) => b.key).sort().reverse().slice(10);
    for (const k of old) await store.delete(k);
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405);
};

export default async (req) => handle(req, getStore({ name: "nhrc-site", consistency: "strong" }), env());
export const config = { path: "/api/content" };
