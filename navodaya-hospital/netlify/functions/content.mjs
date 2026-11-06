// Stores and serves the published site content, and checks the staff login.
// Needs these Netlify environment variables: ADMIN_USER, ADMIN_PASSWORD.
import { getStore } from "@netlify/blobs";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

const same = (a, b) => {
  a = String(a || ""); b = String(b || "");
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};
export const authorised = (user, password, env = process.env) =>
  !!env.ADMIN_PASSWORD && same(String(user || "").toLowerCase(), String(env.ADMIN_USER || "navodaya").toLowerCase()) && same(password, env.ADMIN_PASSWORD);

export const handle = async (req, store) => {
  if (req.method === "GET") {
    const data = await store.get("content", { type: "json" });
    return json(data || {});
  }
  if (req.method === "POST") {
    let body; try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
    if (!authorised(body.user, body.password)) return json({ error: "Wrong user name or password" }, 401);
    if (body.check) return json({ ok: true });
    const c = body.content;
    if (!c || typeof c !== "object" || Array.isArray(c)) return json({ error: "No content" }, 400);
    const text = JSON.stringify(c);
    if (text.length > 6_000_000) return json({ error: "Content is too large. Use smaller photos." }, 413);
    await store.setJSON("content", c);
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405);
};

export default async (req) => handle(req, getStore("nhrc-site"));
export const config = { path: "/api/content" };
