// Reads a photo of a handwritten Optimex job card on this computer, with no internet and no AI service.
// 1. Find the card's printed boxes in the photo and straighten them (OpenCV).
// 2. Cut out each field at its known place on the printed form (layout.json).
// 3. Read each piece with the PaddleOCR text model (engine.js).
// 4. Clean up and cross-check: the customer slip repeats the shop copy, total − advance = balance,
//    phone numbers have 10 digits, powers come in 0.25 steps, axis is 0–180. Anything doubtful is flagged.
import fs from "node:fs";
import sharp from "sharp";
import cvModule from "@techstark/opencv-js";
import { recognize, readLines } from "./engine.js";

const LAYOUT = JSON.parse(fs.readFileSync(new URL("./layout.json", import.meta.url), "utf8"));
const BOTTOM = LAYOUT.bottom, TOP = LAYOUT.top;

export class ReadError extends Error {}

let cvReady;
function getCv() {
  cvReady ||= (async () => {
    let cv = cvModule;
    if (cv instanceof Promise) cv = await cv;
    else if (!cv.Mat) await new Promise((resolve) => { cv.onRuntimeInitialized = resolve; });
    return cv;
  })();
  return cvReady;
}

// ---------------- geometry ----------------

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function orderCorners(pts) { // → [top-left, top-right, bottom-right, bottom-left]
  const s = pts.map((p) => p[0] + p[1]), d = pts.map((p) => p[1] - p[0]);
  return [pts[s.indexOf(Math.min(...s))], pts[d.indexOf(Math.min(...d))], pts[s.indexOf(Math.max(...s))], pts[d.indexOf(Math.max(...d))]];
}
const rotations = (q) => [q, [q[3], q[0], q[1], q[2]], [q[2], q[3], q[0], q[1]], [q[1], q[2], q[3], q[0]]];
const aspectOf = (q) => (dist(q[0], q[1]) + dist(q[3], q[2])) / (dist(q[0], q[3]) + dist(q[1], q[2]));

function findQuads(cv, src) {
  const scale = Math.min(1, 1200 / Math.max(src.cols, src.rows));
  const small = new cv.Mat(), gray = new cv.Mat(), th = new cv.Mat();
  cv.resize(src, small, new cv.Size(Math.round(src.cols * scale), Math.round(src.rows * scale)), 0, 0, cv.INTER_AREA);
  cv.cvtColor(small, gray, cv.COLOR_RGBA2GRAY);
  cv.adaptiveThreshold(gray, th, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY_INV, 25, 15);
  const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
  cv.morphologyEx(th, th, cv.MORPH_CLOSE, kernel);
  const contours = new cv.MatVector(), hierarchy = new cv.Mat();
  cv.findContours(th, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
  const total = small.cols * small.rows, quads = [];
  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i), area = cv.contourArea(c);
    if (area > 0.03 * total) {
      const approx = new cv.Mat();
      cv.approxPolyDP(c, approx, 0.02 * cv.arcLength(c, true), true);
      if (approx.rows === 4 && cv.isContourConvex(approx)) {
        const pts = [0, 1, 2, 3].map((j) => [approx.data32S[j * 2] / scale, approx.data32S[j * 2 + 1] / scale]);
        quads.push({ corners: orderCorners(pts), area: area / scale / scale });
      }
      approx.delete();
    }
    c.delete();
  }
  [small, gray, th, kernel, contours, hierarchy].forEach((m) => m.delete());
  return quads.sort((a, b) => b.area - a.area);
}

function warp(cv, src, corners, [W, H]) {
  const from = cv.matFromArray(4, 1, cv.CV_32FC2, corners.flat());
  const to = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, W, 0, W, H, 0, H]);
  const M = cv.getPerspectiveTransform(from, to), out = new cv.Mat();
  cv.warpPerspective(src, out, M, new cv.Size(W, H), cv.INTER_LINEAR, cv.BORDER_REPLICATE, new cv.Scalar());
  [from, to, M].forEach((m) => m.delete());
  return out;
}

// Cut a box out of a straightened image. (Done in JavaScript: OpenCV.js region copies can come back with the wrong row spacing.)
function crop(cv, mat, [x1, y1, x2, y2]) {
  const W = mat.cols, w = x2 - x1, h = y2 - y1, data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) data.set(mat.data.subarray(((y1 + y) * W + x1) * 4, ((y1 + y) * W + x2) * 4), y * w * 4);
  return { data, width: w, height: h };
}

// Share of pixels clearly darker than the paper, ignoring a margin (printed borders).
function ink(img, margin = 6) {
  const lum = [];
  for (let y = margin; y < img.height - margin; y++) for (let x = margin; x < img.width - margin; x++) {
    const i = (y * img.width + x) * 4;
    lum.push(0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2]);
  }
  if (!lum.length) return 0;
  const paper = [...lum].sort((a, b) => a - b)[Math.floor(lum.length * 0.9)];
  return lum.filter((v) => v < paper * 0.6).length / lum.length;
}

// ---------------- text clean-up ----------------

const CJK = /[⺀-鿿豈-﫿가-힯]/g;
function clean(s) {
  return s.replace(/，/g, ",").replace(/（/g, "(").replace(/）/g, ")").replace(/[·。．•]/g, ".").replace(/：/g, ":")
    .replace(/[—–－_]/g, "-").replace(/／/g, "/").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(CJK, "")
    .replace(/\s+/g, " ").trim();
}
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
// Removes the printed label ("Name", "Tel", "Order No") and its dotted leader from the start of a reading.
function stripLabel(s, label) {
  const want = label.toLowerCase().replace(/\s/g, "");
  const tol = Math.max(1, Math.floor(want.length / 4));
  const m = s.match(/^\s*([A-Za-z][A-Za-z ]{0,12}?)\s*[.:;,'`~-]+\s*/);
  if (m && editDistance(m[1].toLowerCase().replace(/\s/g, ""), want) <= tol) return s.slice(m[0].length);
  // Label run straight into the writing ("Total3,500", "FrameMatte"): cut where the label matches best,
  // preferring the exact label length so the first handwritten letter is kept.
  let best = null;
  for (let n = Math.max(1, want.length - tol); n <= want.length + tol; n++) {
    const head = s.slice(0, n);
    if (!/^[A-Za-z ]+$/.test(head)) continue;
    const d = editDistance(head.toLowerCase().replace(/\s/g, ""), want);
    if (d <= tol && (!best || d < best.d || (d === best.d && Math.abs(n - want.length) < Math.abs(best.n - want.length)))) best = { n, d };
  }
  return best ? s.slice(best.n).replace(/^[\s.:;,'`~-]+/, "") : s;
}
const trimDots = (s) => s.replace(/^[\s.:;,'`~-]+|[\s.:;,'`~]+$/g, "").replace(/\.{2,}/g, " ").replace(/\s+/g, " ").trim();
// Letters misread inside numbers: O→0, l/I/|→1, S→5, B→8, Z→2, g→9.
const DIGITISH = { O: "0", o: "0", D: "0", Q: "0", l: "1", I: "1", "|": "1", i: "1", L: "1", "!": "1", S: "5", s: "5", B: "8", Z: "2", z: "2", g: "9", q: "9", G: "6", b: "6", T: "7" };
const toDigits = (s) => s.replace(/[OoDQlI|iL!SsBZzgqGbT]/g, (c) => DIGITISH[c]);
// Local place names and address words: a reading one letter away from one of these is corrected ("Alathuy" → "Alathur").
const KNOWN_WORDS = ["Alathur", "Palakkad", "Kavassery", "Vadakkencherry", "Erimayur", "Kuzhalmannam", "Tarur", "Kizhakkencherry",
  "Pazhambalacode", "Kerala", "Court", "Road", "Nagar", "Street", "House", "Junction", "Colony", "Temple", "Market", "Station"];
const fixKnown = (s) => s.replace(/[A-Za-z]{5,}/g, (w) => {
  const hit = KNOWN_WORDS.find((k) => k[0].toLowerCase() === w[0].toLowerCase() && Math.abs(k.length - w.length) <= 1 && editDistance(k.toLowerCase(), w.toLowerCase()) === 1);
  return hit || w;
});
const words = (s) => s.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/,(?=\S)/g, ", ").replace(/([A-Za-z])\(/g, "$1 (").replace(/\s+/g, " ").trim();

function parseDates(s) {
  const t = s.replace(/[oOlI|]/g, (c, i) => (/[\d/]/.test(s[i - 1] || "") || /[\d/]/.test(s[i + 1] || "") ? DIGITISH[c] : c));
  const out = [];
  const year = new Date().getFullYear();
  // A slash is sometimes read as a space, so accept either between day, month and year.
  for (const m of t.matchAll(/(\d{1,2})\s*[/\-., ]\s*(\d{1,2})\s*[/\-., ]\s*(\d{4}|\d{2})(?!\d)/g)) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = "20" + y;
    const dt = new Date(Date.UTC(+y, +mo - 1, +d));
    // Job cards are dated around now; anything else is a misreading (often a cut-off year).
    if (+mo >= 1 && +mo <= 12 && dt.getUTCDate() === +d && Math.abs(+y - year) <= 1) out.push(`${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return out;
}

// Money: returns possible readings, because a handwritten ₹ is often read as 7, 2, Z or ?.
function moneyCandidates(s) {
  const v = toDigits(s.replace(/\s/g, "")).replace(/[^\d,.]/g, (c, i) => (i === 0 ? "" : c)).replace(/[^\d,.]/g, "");
  const m = v.match(/\d[\d,]*(\.\d{1,2})?/);
  if (!m) return [];
  const n = m[0].replace(/,/g, "").replace(/\.\d+$/, "");
  const out = [{ value: n, dropped: 0 }];
  if (/^[27]\d{2,}/.test(n)) out.push({ value: n.slice(1), dropped: 1 });
  return out;
}

function rxPower(s) {
  const t = clean(s).replace(/\s/g, "");
  if (!t || /^[-.~=]*$/.test(t)) return { value: "" };
  if (/^(pl|plano)$/i.test(t)) return { value: "0.00" };
  const u = toDigits(t.replace(/^t/, "+")).replace(/,/g, ".");
  const m = u.match(/^([+-])?(\d{1,2})[.\-:]?(\d{2})$/);
  if (!m) return { value: t, bad: true };
  const value = `${m[1] || ""}${+m[2]}.${m[3]}`;
  return { value, bad: Math.abs(+value) > 30 || Math.round(+value * 100) % 25 !== 0 };
}
function rxAxis(s) {
  const t = clean(s).replace(/\s/g, "");
  if (!t || /^[-.~=]*$/.test(t)) return { value: "" };
  let d = toDigits(t.replace(/[°ºoO]+$/, "")).replace(/\D/g, "");
  if (+d > 180 && d.length === 3 && d.endsWith("0")) d = d.slice(0, 2);
  return { value: d, bad: d === "" || +d > 180 };
}

const sameText = (a, b) => a.toLowerCase().replace(/[^a-z0-9]/g, "") === b.toLowerCase().replace(/[^a-z0-9]/g, "");

// ---------------- main ----------------

// image: Buffer of a JPEG/PNG/WebP photo. Returns { fields, unsure }.
export async function readJobCardOffline(image) {
  const cv = await getCv();
  const { data, info } = await sharp(image).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const src = cv.matFromImageData({ data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height });
  const mats = [src];
  try {
    const quads = findQuads(cv, src);
    const read = async (mat, box) => {
      const r = await recognize(crop(cv, mat, box));
      return { text: clean(r.text), score: r.score };
    };
    // Find the writing first; if nothing is found (a blurry photo), read the whole row as one strip.
    const readRow = async (mat, box) => {
      const img = crop(cv, mat, box);
      let r = await readLines(img);
      if (!r.text.trim()) r = await recognize(img);
      return { text: clean(r.text), score: r.score };
    };

    // Find the shop copy (the tall box), in whichever way up the photo was taken:
    // the printed "Lens" and "Frame" labels must read correctly.
    let bottom = null;
    for (const q of quads.slice(0, 6)) {
      for (const corners of rotations(q.corners)) {
        const a = aspectOf(corners);
        if (a < 0.6 || a > 0.92) continue;
        const mat = warp(cv, src, corners, BOTTOM.size);
        const lens = await read(mat, [14, 746, 180, 804]), frame = await read(mat, [14, 811, 200, 880]);
        if (/^l.?e.?n/i.test(lens.text) || /^f.?r.?a/i.test(frame.text)) { bottom = { mat, corners }; break; }
        mat.delete();
      }
      if (bottom) break;
    }
    if (!bottom) throw new ReadError("Couldn't find the job card in the photo. Take it again with the whole card inside the picture, flat and in good light.");
    mats.push(bottom.mat);

    // The customer slip is the wide box above the shop copy (optional: used to cross-check).
    let top = null;
    const upVec = [bottom.corners[0][0] - bottom.corners[3][0], bottom.corners[0][1] - bottom.corners[3][1]];
    for (const q of quads) {
      for (const corners of rotations(q.corners)) {
        const a = aspectOf(corners);
        if (a < 1.5 || a > 2.3) continue;
        // must sit on the "up" side of the shop copy and share its orientation
        const c = corners.reduce((p, v) => [p[0] + v[0] / 4, p[1] + v[1] / 4], [0, 0]);
        const rel = [c[0] - bottom.corners[0][0], c[1] - bottom.corners[0][1]];
        const edge = [corners[1][0] - corners[0][0], corners[1][1] - corners[0][1]], bEdge = [bottom.corners[1][0] - bottom.corners[0][0], bottom.corners[1][1] - bottom.corners[0][1]];
        if (rel[0] * upVec[0] + rel[1] * upVec[1] <= 0 || edge[0] * bEdge[0] + edge[1] * bEdge[1] <= 0) continue;
        top = { mat: warp(cv, src, corners, TOP.size) };
        break;
      }
      if (top) break;
    }
    if (top) mats.push(top.mat);

    const f = {}, unsure = new Set(), notes = [];
    const flag = (k, r) => { if (r && r.score < 0.8) unsure.add(k); };

    // Referral row
    for (const k of ["call", "call2", "doctor", "clinic", "lab"]) {
      const img = crop(cv, bottom.mat, BOTTOM.fields[k]);
      if (ink(img) < 0.01) { f[k] = ""; continue; }
      const r = await read(bottom.mat, BOTTOM.fields[k]);
      const letters = (r.text.match(/[A-Za-z]/g) || []).length;
      if (letters < 2 || r.score < 0.5) { f[k] = ""; if (k === "call" || k === "call2") notes.push(`${k === "call" ? "Call" : "Column after Call"} box has a mark`); else unsure.add(k); continue; }
      f[k] = fixKnown(words(trimDots(r.text))).replace(/\bDr\.?\s*/i, "Dr. ");
      flag(k, r);
    }

    // Labelled lines
    const line = async (mat, layout, k, label) => {
      const r = await readRow(mat, layout.fields[k]);
      return { text: trimDots(stripLabel(r.text, label)), score: r.score };
    };
    const bName = await line(bottom.mat, BOTTOM, "name", "Name");
    const bAddr = await line(bottom.mat, BOTTOM, "address", "Address");
    const bTel = await line(bottom.mat, BOTTOM, "phone", "Tel");
    const bNo = await line(bottom.mat, BOTTOM, "orderNo", "No");
    const bDates = await readRow(bottom.mat, BOTTOM.fields.dates);
    // Lens and Frame have no dotted line; reading the row as one strip keeps punctuation like "/" and ")".
    const plain = async (k, label) => { const r = await read(bottom.mat, BOTTOM.fields[k]); return { text: trimDots(stripLabel(r.text, label)), score: r.score }; };
    const bLens = await plain("lens", "Lens");
    const bFrame = await plain("frame", "Frame");
    const bMoney = {};
    for (const k of ["total", "advance", "balance"]) bMoney[k] = await line(bottom.mat, BOTTOM, k, k);

    let tName, tNo, tDates, tMoney = {};
    if (top) {
      tName = await line(top.mat, TOP, "name", "Name");
      tNo = await line(top.mat, TOP, "orderNo", "Order No");
      tDates = await readRow(top.mat, TOP.fields.dates);
      for (const k of ["total", "advance", "balance"]) tMoney[k] = await line(top.mat, TOP, k, k);
    }

    // Name and address: letters only, words split where the reader ran them together.
    const person = (s) => words(s.replace(/[^A-Za-z .'-]/g, " "));
    f.name = person(bName.text); flag("name", bName);
    if (tName && tName.text && !sameText(person(tName.text), f.name)) {
      if (!f.name || tName.score > bName.score + 0.1) f.name = person(tName.text);
      unsure.add("name");
    }
    f.address = fixKnown(words(bAddr.text.replace(/[^A-Za-z0-9 ,./()'-]/g, " "))); flag("address", bAddr);

    // Phone: digits only, 10 digits expected (12 with 91).
    f.phone = toDigits(bTel.text).replace(/[^\d+]/g, "");
    if (!/^(\+?91)?\d{10}$/.test(f.phone)) unsure.add("phone");
    flag("phone", bTel);

    // Order number: both copies should agree.
    const no = (r) => toDigits(r.text).replace(/\D/g, "");
    f.orderNo = no(bNo);
    if (tNo && no(tNo) && no(tNo) !== f.orderNo) { if (!f.orderNo) f.orderNo = no(tNo); unsure.add("orderNo"); }
    flag("orderNo", bNo);

    // Dates: "Date ... Due Date ..." on one line in each copy.
    const bd = parseDates(bDates.text), td = tDates ? parseDates(tDates.text) : [];
    // Use whichever copy is readable; flag only when both are readable and disagree, or neither is.
    ["date", "dueDate"].forEach((k, i) => {
      f[k] = bd[i] || td[i] || "";
      if (!f[k] || (bd[i] && td[i] && bd[i] !== td[i])) unsure.add(k);
    });
    if (f.date && f.dueDate && f.dueDate < f.date) { unsure.add("date"); unsure.add("dueDate"); }

    // Money: pick the readings that make total − advance = balance, preferring the two copies agreeing.
    const cands = {};
    for (const k of ["total", "advance", "balance"]) {
      const list = [...moneyCandidates(bMoney[k].text), ...(tMoney[k] ? moneyCandidates(tMoney[k].text).map((c) => ({ ...c, dropped: c.dropped + 0.5 })) : [])];
      const seen = new Map();
      for (const c of list) if (!seen.has(c.value) || seen.get(c.value).dropped > c.dropped) seen.set(c.value, c);
      cands[k] = [...seen.values()];
      if (!cands[k].length) cands[k] = [{ value: "", dropped: 3 }];
    }
    let best = null;
    for (const t of cands.total) for (const a of cands.advance) for (const b of cands.balance) {
      const ok = t.value !== "" && b.value !== "" && +t.value - (+a.value || 0) === +b.value;
      const cost = (ok ? 0 : 10) + t.dropped + a.dropped + b.dropped;
      if (!best || cost < best.cost) best = { cost, ok, t, a, b };
    }
    f.total = best.t.value; f.advance = best.a.value; f.balance = best.b.value;
    if (!best.ok) ["total", "advance", "balance"].forEach((k) => unsure.add(k));

    // Prescription grid
    f.rx = { re: { dv: {}, nv: {} }, le: { dv: {}, nv: {} } };
    for (const [row, [y1, y2]] of Object.entries(BOTTOM.rx.rows)) {
      for (const [col, [x1, x2]] of Object.entries(BOTTOM.rx.cols)) {
        const [eye, kind] = col.split("."), box = [x1, y1, x2, y2], key = `rx.${eye}.${row}.${kind}`;
        if (ink(crop(cv, bottom.mat, box), 8) < 0.004) { f.rx[eye][row][kind] = ""; continue; }
        const r = await read(bottom.mat, box);
        const v = kind === "axis" ? rxAxis(r.text) : rxPower(r.text);
        f.rx[eye][row][kind] = v.value;
        if (v.bad) unsure.add(key);
        if (v.value) flag(key, r);
      }
      for (const eye of ["re", "le"]) { // cylinder and axis go together
        const { cyl, axis } = f.rx[eye][row];
        if (!!cyl !== !!axis && !(cyl && +cyl === 0)) { unsure.add(`rx.${eye}.${row}.cyl`); unsure.add(`rx.${eye}.${row}.axis`); }
      }
    }

    f.lens = words(bLens.text); flag("lens", bLens);
    f.frame = words(bFrame.text); flag("frame", bFrame);

    // G / C tick boxes beside Advance and Balance: an X counts, a dash doesn't.
    f.gc = { adv: { g: "", c: "" }, bal: { g: "", c: "" } };
    for (const grp of ["adv", "bal"]) {
      const g = ink(crop(cv, bottom.mat, BOTTOM.gc[`${grp}.g`]), 5), c = ink(crop(cv, bottom.mat, BOTTOM.gc[`${grp}.c`]), 5);
      if (Math.max(g, c) >= 0.06 && Math.abs(g - c) > 0.03) f.gc[grp][g > c ? "g" : "c"] = "X";
    }

    f.notes = notes.join(". ");
    return { fields: f, unsure: [...unsure] };
  } finally {
    mats.forEach((m) => m.delete());
  }
}
