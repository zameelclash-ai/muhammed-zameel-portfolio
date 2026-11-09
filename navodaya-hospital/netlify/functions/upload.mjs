// POST /api/upload: staff upload a photo (already resized in the browser). Returns a link under /api/photo/.
import { getStore } from "@netlify/blobs";
import { authorised } from "../../lib/auth.js";

const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  if (!authorised(b.user, b.password, { ADMIN_USER: Netlify.env.get("ADMIN_USER"), ADMIN_PASSWORD: Netlify.env.get("ADMIN_PASSWORD") })) return json({ error: "Not allowed" }, 401);
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(b.dataUrl || ""));
  if (!m) return json({ error: "That is not a picture." }, 400);
  const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
  if (bytes.length > 3000000) return json({ error: "Photo is too large." }, 413);
  const key = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  await getStore("nhrc-photos").set(key, bytes, { metadata: { type: m[1] } });
  return json({ url: "/api/photo/" + key });
};
export const config = { path: "/api/upload" };
