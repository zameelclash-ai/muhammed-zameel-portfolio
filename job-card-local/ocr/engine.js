// Offline text recognition with the PaddleOCR PP-OCRv4 recognition model (bundled in @gutenye/ocr-models),
// run by onnxruntime-web (WebAssembly), so nothing needs downloading at install time and nothing leaves the computer.
import fs from "node:fs";
import * as ort from "onnxruntime-web";
import models from "@gutenye/ocr-models/node";

ort.env.wasm.numThreads = 1;
ort.env.logLevel = "error";

let session, dictionary;
async function load() {
  if (session) return;
  session = await ort.InferenceSession.create(fs.readFileSync(models.recognitionPath));
  // Index 0 is the CTC blank; the model's last class is a space.
  dictionary = ["", ...fs.readFileSync(models.dictionaryPath, "utf8").split(/\r?\n/).filter((l, i, a) => i < a.length - 1 || l), " "];
}

const HEIGHT = 48;

// rgba: {data, width, height} of one text line. Returns {text, score} (score 0..1, mean of character probabilities).
export async function recognize(rgba) {
  await load();
  const w = Math.max(16, Math.min(1600, Math.round((rgba.width * HEIGHT) / rgba.height)));
  const input = new Float32Array(3 * HEIGHT * w);
  const plane = HEIGHT * w;
  // Bilinear resize to 48 px high, scale to [0, 1], in B, G, R planes (what this exported model expects).
  const sx = rgba.width / w, sy = rgba.height / HEIGHT, src = rgba.data, sw = rgba.width;
  for (let y = 0; y < HEIGHT; y++) {
    const fy = Math.min(rgba.height - 1, (y + 0.5) * sy - 0.5), y0 = Math.max(0, Math.floor(fy)), y1 = Math.min(rgba.height - 1, y0 + 1), wy = Math.max(0, fy - y0);
    for (let x = 0; x < w; x++) {
      const fx = Math.min(sw - 1, (x + 0.5) * sx - 0.5), x0 = Math.max(0, Math.floor(fx)), x1 = Math.min(sw - 1, x0 + 1), wx = Math.max(0, fx - x0);
      for (let c = 0; c < 3; c++) {
        const p00 = src[(y0 * sw + x0) * 4 + c], p01 = src[(y0 * sw + x1) * 4 + c];
        const p10 = src[(y1 * sw + x0) * 4 + c], p11 = src[(y1 * sw + x1) * 4 + c];
        const v = (p00 * (1 - wx) + p01 * wx) * (1 - wy) + (p10 * (1 - wx) + p11 * wx) * wy;
        input[(2 - c) * plane + y * w + x] = v / 255;
      }
    }
  }
  const feeds = { [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, HEIGHT, w]) };
  const out = (await session.run(feeds))[session.outputNames[0]];
  const [, steps, classes] = out.dims;
  let text = "", sum = 0, n = 0, prev = 0;
  for (let t = 0; t < steps; t++) {
    let best = 0, bestP = -Infinity;
    for (let k = 0; k < classes; k++) { const p = out.data[t * classes + k]; if (p > bestP) { bestP = p; best = k; } }
    if (best !== 0 && best !== prev) { text += dictionary[best] ?? ""; sum += bestP; n++; }
    prev = best;
  }
  return { text, score: n ? sum / n : 0 };
}

// ---------------- text-line finding (PaddleOCR detection model) ----------------
// Used for rows with a printed label and dotted line: it finds where the writing is before reading it.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";
import { registerBackend, FileUtilsBase, ImageRawBase } from "@gutenye/ocr-common";
import { splitIntoLineImages } from "@gutenye/ocr-common/splitIntoLineImages";

class FileUtils extends FileUtilsBase { static async read(p) { return fs.promises.readFile(p, "utf8"); } }
const toRaw = async (s) => { const r = await s.raw().toBuffer({ resolveWithObject: true }); return { data: r.data, width: r.info.width, height: r.info.height }; };
class ImageRaw extends ImageRawBase {
  #sharp;
  static async open(input) { return new ImageRaw(await toRaw(sharp(input).ensureAlpha(1))); }
  constructor(d) { super(d); this.#sharp = sharp(d.data, { raw: { width: d.width, height: d.height, channels: 4 } }); }
  async write(p) { return this.#sharp.toFile(p); }
  async resize(size) { return this.#apply(this.#sharp.resize({ width: size.width, height: size.height, fit: "contain" })); }
  async drawBox() { return this; }
  async #apply(s) { this.#sharp = s; const r = await toRaw(s); this.data = r.data; this.width = r.width; this.height = r.height; return this; }
}
registerBackend({
  FileUtils, ImageRaw, splitIntoLineImages, defaultModels: models,
  InferenceSession: { create: async (p, o) => ort.InferenceSession.create(await fs.promises.readFile(p), o) },
});

let detection;
async function loadDetection() {
  if (detection) return detection;
  const build = path.dirname(fileURLToPath(import.meta.resolve("@gutenye/ocr-common")));
  const { Detection } = await import(pathToFileURL(path.join(build, "models", "Detection.js")).href);
  detection = await Detection.create({});
  return detection;
}

// Reads every text line found in the box, left to right. Returns {text, score}.
export async function readLines(rgba) {
  const det = await loadDetection();
  const { lineImages } = await det.run({ data: rgba.data, width: rgba.width, height: rgba.height });
  if (!lineImages.length) return { text: "", score: 0 };
  lineImages.sort((a, b) => Math.min(...a.box.map((p) => p[0])) - Math.min(...b.box.map((p) => p[0])));
  const parts = [];
  for (const li of lineImages) parts.push(await recognize(li.image));
  const read = parts.filter((p) => p.text);
  return { text: read.map((p) => p.text).join(" "), score: read.length ? read.reduce((s, p) => s + p.score, 0) / read.length : 0 };
}
