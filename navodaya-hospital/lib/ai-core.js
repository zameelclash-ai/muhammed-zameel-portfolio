// AI writing help for the staff editor (shared by Vercel and Netlify). Returns { status, body }.
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM = "You help staff of Navodaya Hospital and Research Centre, Pazhayannur, Kerala, write clear, kind, accurate website text. " +
  "Never invent facts, numbers, doctors, awards or services. Keep a calm, professional tone. Reply with only what was asked.";
const TASKS = {
  improve: (t) => `Improve this website text. Keep the meaning and facts, make it clear and natural. Return only the new text.\n\n${t}`,
  short: (t) => `Make this website text shorter and clearer. Keep every important fact. Return only the new text.\n\n${t}`,
  ml: (t) => `Translate this text into natural, simple Malayalam for patients. Return only the Malayalam text.\n\n${t}`,
  en: (t) => `Translate this text into simple, natural English for patients. Return only the English text.\n\n${t}`,
};
const EDITABLE = ["hero", "about", "vision", "mission", "faqs", "why", "services", "news", "reviews", "hours", "tagline", "departments"];
const firstJson = (s) => { const m = String(s).match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : {}; };

export async function runAiTask(b, { apiKey, model }) {
  if (!apiKey) return { status: 503, body: { error: "AI is not switched on. Add ANTHROPIC_API_KEY in the hosting settings." } };
  const client = new Anthropic({ apiKey });
  const ask = async (prompt) => {
    const response = await client.beta.messages.create({
      model: model || "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    if (response.stop_reason === "refusal") throw new Error("The AI could not help with this text.");
    return response.content.filter((x) => x.type === "text").map((x) => x.text).join("").trim();
  };
  try {
    if (TASKS[b.task]) return { status: 200, body: { text: await ask(TASKS[b.task](String(b.text || "").slice(0, 4000))) } };
    if (b.task === "write_news") {
      const o = firstJson(await ask(`Write a short hospital website update from this note. Reply as JSON only: {"title":"max 10 words","text":"1-2 short sentences"}. Use only facts in the note.\n\nNote: ${String(b.text || "").slice(0, 1000)}`));
      return { status: 200, body: { title: String(o.title || ""), text: String(o.text || "") } };
    }
    if (b.task === "edit_site") {
      const content = JSON.stringify(b.content || {}).slice(0, 60000);
      const patch = firstJson(await ask(
        `Here is the website content as JSON (photos are shown as "[photo]"):\n${content}\n\nStaff request: ${String(b.instruction || "").slice(0, 1000)}\n\n` +
        `Reply with ONLY a JSON object containing the top-level keys that should change, each with its complete new value. Allowed keys: ${EDITABLE.join(", ")}. ` +
        `Do not touch phone numbers, email, WhatsApp number, address, images or photos. Do not invent facts. If nothing should change reply {}.`));
      return { status: 200, body: { patch: Object.fromEntries(Object.entries(patch).filter(([k]) => EDITABLE.includes(k))) } };
    }
    return { status: 400, body: { error: "Unknown task" } };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { status: 502, body: { error: "The AI key is not valid." } };
    if (e instanceof Anthropic.RateLimitError) return { status: 429, body: { error: "AI is busy. Try again in a minute." } };
    if (e instanceof Anthropic.APIError) return { status: 502, body: { error: "AI service error." } };
    return { status: 502, body: { error: e && e.message ? e.message : "AI failed" } };
  }
}
