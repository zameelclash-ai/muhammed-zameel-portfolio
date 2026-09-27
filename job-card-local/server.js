// Optimex Job Cards: runs on the shop computer.
// The computer opens http://localhost:3000; phones on the shop Wi-Fi open the /phone link shown there.
import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { exec } from "node:child_process";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import { readJobCard, ReadError, MODEL } from "./reader.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const DATA = process.env.DATA_DIR || path.join(HERE, "data");
const PHOTOS = path.join(DATA, "photos");
const BACKUPS = path.join(DATA, "backups");
const JOBS_FILE = path.join(DATA, "jobcards.json");
const CONFIG_FILE = path.join(DATA, "config.json");
const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// ---------------- storage ----------------

fs.mkdirSync(PHOTOS, { recursive: true });
fs.mkdirSync(BACKUPS, { recursive: true });

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}
// Write to a temp file then rename, so a power cut never leaves a half-written file.
function writeJson(file, value) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}

const config = readJson(CONFIG_FILE, {});
if (!config.shopKey) { config.shopKey = crypto.randomBytes(16).toString("hex"); writeJson(CONFIG_FILE, config); }
const apiKey = () => process.env.ANTHROPIC_API_KEY || config.apiKey || "";

let jobs = readJson(JOBS_FILE, []);
const saveJobs = () => writeJson(JOBS_FILE, jobs);

// One backup per day, keeping the last 30.
(function dailyBackup() {
  if (!jobs.length) return;
  const file = path.join(BACKUPS, `jobcards-${localDate()}.json`);
  if (!fs.existsSync(file)) fs.copyFileSync(JOBS_FILE, file);
  const old = fs.readdirSync(BACKUPS).filter((f) => f.startsWith("jobcards-")).sort().slice(0, -30);
  old.forEach((f) => fs.rmSync(path.join(BACKUPS, f)));
})();

function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function nextOrderNo() {
  const n = jobs.map((j) => parseInt(j.orderNo, 10)).filter((x) => !isNaN(x));
  return n.length ? String(Math.max(...n) + 1) : "";
}
function emptyRx() {
  const row = () => ({ sph: "", cyl: "", axis: "" });
  return { re: { dv: row(), nv: row() }, le: { dv: row(), nv: row() } };
}

const EDITABLE = ["orderNo", "date", "dueDate", "name", "address", "phone", "call", "doctor", "clinic", "lab", "lens", "frame", "total", "advance", "balance", "notes", "status"];
function applyFields(job, body) {
  for (const k of EDITABLE) if (typeof body[k] === "string") job[k] = body[k].slice(0, 2000);
  if (body.rx && typeof body.rx === "object") {
    for (const e of ["re", "le"]) for (const r of ["dv", "nv"]) for (const c of ["sph", "cyl", "axis"]) {
      const v = body.rx?.[e]?.[r]?.[c];
      if (typeof v === "string") job.rx[e][r][c] = v.slice(0, 20);
    }
  }
  if (!["pending", "ready", "delivered"].includes(job.status)) job.status = "pending";
}
function newJob(source) {
  const now = new Date().toISOString();
  return {
    id: "jc" + Date.now().toString(36) + crypto.randomBytes(3).toString("hex"),
    orderNo: nextOrderNo(), date: localDate(), dueDate: "", name: "", address: "", phone: "",
    call: "", doctor: "", clinic: "", lab: "", rx: emptyRx(), lens: "", frame: "",
    total: "", advance: "", balance: "", notes: "", status: "pending",
    photo: null, scan: { state: "none", message: "", unsure: [] }, review: false,
    source, createdAt: now, updatedAt: now,
  };
}

// ---------------- live updates (Server-Sent Events) ----------------

const listeners = new Set();
function broadcast(event) {
  const line = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of listeners) res.write(line);
}
setInterval(() => { for (const res of listeners) res.write(": ping\n\n"); }, 25000);

// ---------------- reading a scan ----------------

async function readScan(job) {
  if (!apiKey()) {
    job.scan = { state: "none", message: "Handwriting reading is off. Add an API key in Settings, then press Read again.", unsure: [] };
    job.updatedAt = new Date().toISOString();
    saveJobs(); broadcast({ type: "job", job });
    return;
  }
  job.scan = { state: "reading", message: "", unsure: [] };
  saveJobs(); broadcast({ type: "job", job });
  try {
    const image = await fsp.readFile(path.join(PHOTOS, job.photo));
    const mediaType = Object.keys(IMAGE_TYPES).find((t) => job.photo.endsWith("." + IMAGE_TYPES[t]));
    const { fields, unsure } = await readJobCard({ apiKey: apiKey(), image, mediaType });
    const current = jobs.find((j) => j.id === job.id);
    if (!current) return; // deleted while reading
    const keepOrder = current.orderNo;
    applyFields(current, { ...fields, status: current.status });
    if (!current.orderNo) current.orderNo = keepOrder || nextOrderNo();
    if (!current.date) current.date = localDate();
    const t = parseFloat(current.total), a = parseFloat(current.advance) || 0;
    if (!current.balance && !isNaN(t)) current.balance = String(t - a);
    current.scan = { state: "done", message: "", unsure };
    current.review = true;
    current.updatedAt = new Date().toISOString();
    saveJobs(); broadcast({ type: "job", job: current });
  } catch (err) {
    const current = jobs.find((j) => j.id === job.id);
    if (!current) return;
    if (err instanceof ReadError) console.log(`Could not read a card: ${err.message}`);
    else console.error("Reading failed:", err);
    current.scan = { state: "error", message: err instanceof ReadError ? err.message : "Something went wrong while reading. Press Read again.", unsure: [] };
    current.updatedAt = new Date().toISOString();
    saveJobs(); broadcast({ type: "job", job: current });
  }
}

// ---------------- HTTP ----------------

function lanUrls() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) if (a.family === "IPv4" && !a.internal) out.push(`http://${a.address}:${PORT}`);
  }
  // Home/shop Wi-Fi addresses first.
  return out.sort((x, y) => Number(/\/\/(192\.168|10\.|172\.)/.test(y)) - Number(/\/\/(192\.168|10\.|172\.)/.test(x)));
}

const isLocal = (req) => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress);
function authorized(req, url) {
  if (isLocal(req)) return true;
  const given = req.headers["x-shop-key"] || url.searchParams.get("key") || "";
  const a = Buffer.from(String(given)), b = Buffer.from(config.shopKey);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error("too large"), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
async function readJsonBody(req) {
  try { return JSON.parse((await readBody(req, 1e6)).toString("utf8") || "{}"); }
  catch (e) { if (e.status) throw e; throw Object.assign(new Error("bad json"), { status: 400 }); }
}

async function handle(req, res) {
  const url = new URL(req.url, "http://x");
  const p = url.pathname;

  // Pages (no data in them, so no key needed to load)
  if (req.method === "GET" && (p === "/" || p === "/phone")) {
    const file = p === "/" ? "desk.html" : "phone.html";
    return send(res, 200, await fsp.readFile(path.join(HERE, "public", file)), "text/html; charset=utf-8");
  }

  if (!authorized(req, url)) return send(res, 401, { error: "This device is not connected. Scan the QR code on the shop computer." });

  if (req.method === "GET" && p === "/api/info") {
    const urls = lanUrls();
    const phoneLink = urls[0] ? `${urls[0]}/phone?key=${config.shopKey}` : "";
    return send(res, 200, {
      hasApiKey: !!apiKey(), apiKeyFromEnv: !!process.env.ANTHROPIC_API_KEY, model: MODEL,
      isLocal: isLocal(req), urls, phoneLink,
      phoneLinks: urls.map((u) => `${u}/phone?key=${config.shopKey}`),
      qr: phoneLink ? await QRCode.toString(phoneLink, { type: "svg", margin: 1 }) : "",
    });
  }

  if (req.method === "POST" && p === "/api/settings") {
    if (!isLocal(req)) return send(res, 403, { error: "Settings can only be changed on the shop computer." });
    const body = await readJsonBody(req);
    const key = String(body.apiKey || "").trim();
    if (key && !/^sk-ant-[\w-]{20,}$/.test(key)) return send(res, 400, { error: "That doesn't look like an Anthropic API key. It starts with sk-ant-." });
    config.apiKey = key; writeJson(CONFIG_FILE, config);
    return send(res, 200, { hasApiKey: !!apiKey() });
  }

  if (req.method === "GET" && p === "/api/events") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive" });
    res.write(": connected\n\n");
    listeners.add(res);
    req.on("close", () => listeners.delete(res));
    return;
  }

  if (req.method === "GET" && p === "/api/jobs") return send(res, 200, jobs);

  if (req.method === "POST" && p === "/api/jobs") {
    const job = newJob("desk");
    applyFields(job, await readJsonBody(req));
    jobs.unshift(job); saveJobs(); broadcast({ type: "job", job });
    return send(res, 201, job);
  }

  // Phone upload: the raw image is the request body.
  if (req.method === "POST" && p === "/api/scan") {
    const type = String(req.headers["content-type"] || "").split(";")[0];
    if (!IMAGE_TYPES[type]) return send(res, 415, { error: "Send a JPG, PNG or WebP photo." });
    const image = await readBody(req, 15e6);
    if (image.length < 1000) return send(res, 400, { error: "The photo was empty. Take it again." });
    const job = newJob("phone");
    job.photo = `${job.id}.${IMAGE_TYPES[type]}`;
    await fsp.writeFile(path.join(PHOTOS, job.photo), image);
    jobs.unshift(job); saveJobs(); broadcast({ type: "job", job });
    readScan(job);
    return send(res, 201, job);
  }

  const m = p.match(/^\/api\/jobs\/([\w-]+)(\/read)?$/);
  if (m) {
    const job = jobs.find((j) => j.id === m[1]);
    if (!job) return send(res, 404, { error: "That job card no longer exists." });
    if (req.method === "POST" && m[2]) {
      if (!job.photo) return send(res, 400, { error: "This card has no photo to read." });
      if (job.scan?.state === "reading") return send(res, 409, { error: "Already reading this card." });
      readScan(job);
      return send(res, 202, job);
    }
    if (req.method === "PUT" && !m[2]) {
      applyFields(job, await readJsonBody(req));
      job.review = false;
      job.updatedAt = new Date().toISOString();
      saveJobs(); broadcast({ type: "job", job });
      return send(res, 200, job);
    }
    if (req.method === "DELETE" && !m[2]) {
      jobs = jobs.filter((j) => j !== job); saveJobs();
      if (job.photo) await fsp.rm(path.join(PHOTOS, job.photo), { force: true });
      broadcast({ type: "delete", id: job.id });
      return send(res, 200, { ok: true });
    }
  }

  const photo = p.match(/^\/photos\/([\w-]+\.(?:jpg|png|webp))$/);
  if (req.method === "GET" && photo) {
    const file = path.join(PHOTOS, photo[1]);
    if (!fs.existsSync(file)) return send(res, 404, { error: "Photo not found." });
    const ext = photo[1].split(".").pop();
    res.writeHead(200, { "Content-Type": Object.keys(IMAGE_TYPES).find((t) => IMAGE_TYPES[t] === ext), "Cache-Control": "private, max-age=86400" });
    return fs.createReadStream(file).pipe(res);
  }

  send(res, 404, { error: "Not found" });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((err) => {
    if (!res.headersSent) send(res, err.status || 500, { error: err.status === 413 ? "The photo is too large." : "Something went wrong on the shop computer." });
    if (!err.status) console.error(err);
  });
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") console.error(`\nPort ${PORT} is already in use. Optimex Job Cards may already be running: open http://localhost:${PORT}\n`);
  else console.error(err);
  process.exit(1);
});

server.listen(PORT, "0.0.0.0", () => {
  const urls = lanUrls();
  console.log(`\n  Optimex Job Cards is running.\n`);
  console.log(`  On this computer:  http://localhost:${PORT}`);
  if (urls.length) console.log(`  Phones: open the job card page and press "Connect a phone" to see the QR code.`);
  else console.log(`  This computer is not on a network, so phones cannot connect yet.`);
  console.log(apiKey() ? `  Handwriting reading: on (${MODEL})` : `  Handwriting reading: off. Add an API key in Settings.`);
  console.log(`\n  Keep this window open while the shop is using it.\n`);
  if (process.env.OPEN_BROWSER !== "0") {
    const open = process.platform === "win32" ? `start "" "http://localhost:${PORT}"` : process.platform === "darwin" ? `open http://localhost:${PORT}` : `xdg-open http://localhost:${PORT}`;
    exec(open, () => {});
  }
});
