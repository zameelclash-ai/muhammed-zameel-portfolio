// POST /api/ai: AI writing help for staff. Needs ANTHROPIC_API_KEY (optional feature).
import { authorised } from "../../lib/auth.js";
import { runAiTask } from "../../lib/ai-core.js";

const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  if (!authorised(b.user, b.password, { ADMIN_USER: Netlify.env.get("ADMIN_USER"), ADMIN_PASSWORD: Netlify.env.get("ADMIN_PASSWORD") })) return json({ error: "Not allowed" }, 401);
  const r = await runAiTask(b, { apiKey: Netlify.env.get("ANTHROPIC_API_KEY"), model: Netlify.env.get("AI_MODEL") });
  return json(r.body, r.status);
};
export const config = { path: "/api/ai" };
