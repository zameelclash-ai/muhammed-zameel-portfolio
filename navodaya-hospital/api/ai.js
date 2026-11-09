// POST /api/ai -> AI writing help for staff. Needs ANTHROPIC_API_KEY in Vercel (optional feature).
import { send, readBody, authorised } from "./_lib.js";
import { runAiTask } from "../lib/ai-core.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  let b;
  try { b = await readBody(req); } catch { return send(res, 400, { error: "Bad request" }); }
  if (!authorised(b.user, b.password)) return send(res, 401, { error: "Not allowed" });
  const r = await runAiTask(b, { apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.AI_MODEL });
  return send(res, r.status, r.body);
}
