// AI helper for the staff editor. Needs ANTHROPIC_API_KEY, ADMIN_USER, ADMIN_PASSWORD.
// Optional: AI_MODEL (default below).
import { authorised } from "./content.mjs";

const MODEL = process.env.AI_MODEL || "claude-sonnet-5-5";
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

const SYSTEM = "You help staff of Navodaya Hospital and Research Centre, Pazhayannur, Kerala, write clear, kind, accurate website text. " +
  "Never invent facts, numbers, doctors, awards or services. Keep a calm, professional tone. Reply with only what was asked.";

const TASKS = {
  improve: (t) => `Improve this website text. Keep the meaning and facts, make it clear and natural. Return only the new text.\n\n${t}`,
  short: (t) => `Make this website text shorter and clearer. Keep every important fact. Return only the new text.\n\n${t}`,
  ml: (t) => `Translate this text into natural, simple Malayalam for patients. Return only the Malayalam text.\n\n${t}`,
  en: (t) => `Translate this text into simple, natural English for patients. Return only the English text.\n\n${t}`,
};

const callClaude = async (prompt, max = 800) => {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: max, system: SYSTEM, messages: [{ role: "user", content: prompt }] }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || "AI service error");
  return (j.content || []).map((b) => b.text || "").join("").trim();
};

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  if (!authorised(b.user, b.password)) return json({ error: "Not allowed" }, 401);
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: "AI key is not set on the server" }, 503);
  try {
    if (TASKS[b.task]) {
      const text = String(b.text || "").slice(0, 4000);
      return json({ text: await callClaude(TASKS[b.task](text)) });
    }
    if (b.task === "write_news") {
      const out = await callClaude(
        `Write a short hospital website update from this note. Reply as JSON only: {"title":"max 10 words","text":"1-2 short sentences"}. Use only facts in the note.\n\nNote: ${String(b.text || "").slice(0, 1000)}`, 400);
      const m = out.match(/\{[\s\S]*\}/); const o = m ? JSON.parse(m[0]) : {};
      return json({ title: String(o.title || ""), text: String(o.text || "") });
    }
    if (b.task === "edit_site") {
      const content = JSON.stringify(b.content || {}).slice(0, 60000);
      const out = await callClaude(
        `Here is the website content as JSON (photos are shown as "[photo]"):\n${content}\n\nStaff request: ${String(b.instruction || "").slice(0, 1000)}\n\n` +
        `Reply with ONLY a JSON object containing the top-level keys that should change, each with its complete new value. ` +
        `Allowed keys: hero, about, vision, mission, faqs, why, services, news, reviews, hours, tagline, departments. ` +
        `Do not touch phone numbers, email, WhatsApp number, address, images or photos. Do not invent facts. If nothing should change reply {}.`, 3000);
      const m = out.match(/\{[\s\S]*\}/); const patch = m ? JSON.parse(m[0]) : {};
      const ok = new Set(["hero", "about", "vision", "mission", "faqs", "why", "services", "news", "reviews", "hours", "tagline", "departments"]);
      return json({ patch: Object.fromEntries(Object.entries(patch).filter(([k]) => ok.has(k))) });
    }
    return json({ error: "Unknown task" }, 400);
  } catch (e) {
    return json({ error: e.message || "AI failed" }, 502);
  }
};
export const config = { path: "/api/ai" };
