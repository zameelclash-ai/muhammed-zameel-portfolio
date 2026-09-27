// Reads a photo of a handwritten Optimex job card with Claude and returns the job card fields.
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-5";

const TEXT_FIELDS = [
  "orderNo", "date", "dueDate", "name", "address", "phone",
  "call", "doctor", "clinic", "lab", "lens", "frame",
  "total", "advance", "balance", "notes",
];

const str = { type: "string" };
const obj = (props) => ({
  type: "object",
  properties: props,
  required: Object.keys(props),
  additionalProperties: false,
});
const rxRow = obj({ sph: str, cyl: str, axis: str });
const eye = obj({ dv: rxRow, nv: rxRow });

// Structured output: the reply always matches this shape.
const JOB_CARD_SCHEMA = obj({
  ...Object.fromEntries(TEXT_FIELDS.map((f) => [f, str])),
  rx: obj({ re: eye, le: eye }),
  unsure: { type: "array", items: str },
});

function prompt() {
  return `This photo shows a handwritten job card from Optimex Opticals, an optical shop in Alathur, Kerala, India. Read the handwriting into the job card fields.

The printed card has two parts.
- Top slip: Order No, Date, Due Date, Total, Name, Advance, Address, Balance.
- Bottom (shop copy): a row of boxes "Call | (blank) | Doctor | Clinic | Lab" with handwriting underneath; Date, Due Date, No., Name, Address, Tel; a prescription table with columns Re (right eye) Sph, Cyl, Axi and Le (left eye) Sph, Cyl, Axi, and rows DV (distance vision) and NV (near vision); then Lens, Frame, Total, Advance, Balance. Small G/C boxes near the totals may be ticked.

Rules:
- Read only the handwriting. Ignore printed labels, the printed shop phone number and the printed shop address (Swathy Jn, Court Road, Alathur).
- The same detail may be written in both parts. Use whichever is legible. If the two disagree, use the bottom part and add the field to "unsure".
- Dates: handwritten dates are day/month/year. Output YYYY-MM-DD. If the year is missing, use ${new Date().getFullYear()}.
- Prescription: keep signs and decimals as written ("-1.25", "+2.00"). Write "PL" or "plano" as "0.00". Axis is a whole number from 0 to 180 with no degree sign.
- Money: digits only, no ₹ or "/-". Phone: digits only (keep +91 if written).
- Put ticked G/C boxes and anything else written that has no field into "notes".
- Use "" for a blank or unreadable field. Never guess a value that is not written.
- "unsure" lists the fields you could not read confidently, using these names: ${TEXT_FIELDS.join(", ")}, and rx.re.dv.sph style names for prescription cells (eye re/le, row dv/nv, column sph/cyl/axis).`;
}

export class ReadError extends Error {}

// Returns { fields, unsure } or throws ReadError with a message staff can act on.
export async function readJobCard({ apiKey, image, mediaType }) {
  const client = new Anthropic({ apiKey });
  let response;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // If a safety classifier declines, the API retries on its recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { format: { type: "json_schema", schema: JOB_CARD_SCHEMA } },
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: image.toString("base64") } },
          { type: "text", text: prompt() },
        ],
      }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new ReadError("The API key was not accepted. Check it in Settings on the shop computer.");
    if (err instanceof Anthropic.PermissionDeniedError) throw new ReadError("This API key is not allowed to use Claude. Check the key in your Anthropic Console.");
    if (err instanceof Anthropic.RateLimitError) throw new ReadError("Too many scans at once, or the API usage limit was reached. Wait a minute and try again.");
    if (err instanceof Anthropic.BadRequestError) throw new ReadError(`Claude could not take this request: ${err.message}`);
    if (err instanceof Anthropic.APIConnectionError) throw new ReadError("The shop computer could not reach the internet. Check the connection and try again.");
    if (err instanceof Anthropic.APIError) throw new ReadError(`Claude had a problem (error ${err.status}). Try again in a moment.`);
    throw err;
  }

  if (response.stop_reason === "refusal") throw new ReadError("Claude could not read this photo. Retake it with the whole card in view.");
  if (response.stop_reason === "max_tokens") throw new ReadError("The reading was cut short. Try again.");
  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) throw new ReadError("No details came back. Try again with a clearer photo.");

  let data;
  try { data = JSON.parse(text); } catch { throw new ReadError("The reading came back incomplete. Try again."); }

  const fields = {};
  for (const f of TEXT_FIELDS) fields[f] = String(data[f] ?? "").trim();
  fields.rx = {};
  for (const e of ["re", "le"]) {
    fields.rx[e] = {};
    for (const r of ["dv", "nv"]) {
      fields.rx[e][r] = {};
      for (const c of ["sph", "cyl", "axis"]) fields.rx[e][r][c] = String(data.rx?.[e]?.[r]?.[c] ?? "").trim();
    }
  }
  for (const d of ["date", "dueDate"]) if (!/^\d{4}-\d{2}-\d{2}$/.test(fields[d])) fields[d] = "";
  const unsure = Array.isArray(data.unsure) ? data.unsure.map(String) : [];
  return { fields, unsure };
}
