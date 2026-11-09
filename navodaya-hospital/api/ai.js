// POST /api/ai -> AI writing help for staff. Needs ANTHROPIC_API_KEY in Vercel (optional feature).
import Anthropic from "@anthropic-ai/sdk";
import { send, readBody, authorised } from "./_lib.js";

const MODEL = process.env.AI_MODEL || "claude-opus-5-5";
const SYSTEM = "You help staff of Navodaya Hospital and Research Centre, Pazhayannur, Kerala, write clear, kind, accurate website text. " +
  "Never invent facts, numbers, doctors, awards or services. Keep a calm, professional tone. Reply with only what was asked.";
const TASKS = {
  improve: (t) => `Improve this website text. Keep the meaning and facts, make it clear and natural. Return only the new text.\n\n${t}`,
  short: (t) => `Make this website text shorter and clearer. Keep every important fact. Return only the new text.\n\n${t}`,
  ml: (t) => `Translate this text into natural, simple Malayalam for patients. Return only the Malayalam text.\n\n${t}`,
  en: (t) => `Translate this text into simple, natural English for patients. Return only the English text.\n\n${t}`,
};
const EDITABLE = ["hero", "about", "vision", "mission", "faqs", "why", "services", "news", "reviews", "hours", "tagline", "departments"];

let client = null;
async function ask(prompt) {
  client = client || new Anthropic();
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") throw new Error("The AI could not help with this text.");
  return response.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
}
const firstJson = (s) => { const m = String(s).match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : {}; };

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  let b;
  try { b = await readBody(req); } catch { return send(res, 400, { error: "Bad request" }); }
  if (!authorised(b.user, b.password)) return send(res, 401, { error: "Not allowed" });
  if (!process.env.ANTHROPIC_API_KEY) return send(res, 503, { error: "AI is not switched on. Add ANTHROPIC_API_KEY in Vercel settings." });
  try {
    if (TASKS[b.task]) return send(res, 200, { text: await ask(TASKS[b.task](String(b.text || "").slice(0, 4000))) });
    if (b.task === "write_news") {
      const o = firstJson(await ask(`Write a short hospital website update from this note. Reply as JSON only: {"title":"max 10 words","text":"1-2 short sentences"}. Use only facts in the note.\n\nNote: ${String(b.text || "").slice(0, 1000)}`));
      return send(res, 200, { title: String(o.title || ""), text: String(o.text || "") });
    }
    if (b.task === "edit_site") {
      const content = JSON.stringify(b.content || {}).slice(0, 60000);
      const patch = firstJson(await ask(
        `Here is the website content as JSON (photos are shown as "[photo]"):\n${content}\n\nStaff request: ${String(b.instruction || "").slice(0, 1000)}\n\n` +
        `Reply with ONLY a JSON object containing the top-level keys that should change, each with its complete new value. Allowed keys: ${EDITABLE.join(", ")}. ` +
        `Do not touch phone numbers, email, WhatsApp number, address, images or photos. Do not invent facts. If nothing should change reply {}.`));
      return send(res, 200, { patch: Object.fromEntries(Object.entries(patch).filter(([k]) => EDITABLE.includes(k))) });
    }
    return send(res, 400, { error: "Unknown task" });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return send(res, 502, { error: "The AI key is not valid." });
    if (e instanceof Anthropic.RateLimitError) return send(res, 429, { error: "AI is busy. Try again in a minute." });
    if (e instanceof Anthropic.APIError) return send(res, 502, { error: "AI service error." });
    return send(res, 502, { error: e && e.message ? e.message : "AI failed" });
  }
}
