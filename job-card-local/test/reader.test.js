// Runs readJobCard against a local stand-in for the Anthropic API.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

let server, next, last;

before(async () => {
  server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      last = { url: req.url, headers: req.headers, body: JSON.parse(body) };
      const { status, json } = next();
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(json));
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const { readJobCard, ReadError, MODEL } = await import("../reader.js");

const row = (sph, cyl, axis) => ({ sph, cyl, axis });
const CARD = {
  orderNo: "1482", date: "2026-09-21", dueDate: "24/09/2026", name: "Fathima K", address: "Kavassery, Alathur", phone: "9847012345",
  call: "", doctor: "Dr. Ramesh", clinic: "", lab: "Zeiss", lens: "Blue cut", frame: "Titan 2231",
  total: "3200", advance: "1000", balance: "2200", notes: "",
  rx: { re: { dv: row("-1.25", "-0.50", "180"), nv: row("", "", "") }, le: { dv: row("-1.00", "", ""), nv: row("", "", "") } },
  unsure: ["rx.re.dv.axis"],
};
const message = (text, stop_reason = "end_turn") => ({
  status: 200,
  json: { id: "msg_1", type: "message", role: "assistant", model: MODEL, content: [{ type: "text", text }], stop_reason, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 } },
});
const image = Buffer.from("fake-jpeg-bytes");

test("sends the photo with the schema and fallback settings, and returns the fields", async () => {
  next = () => message(JSON.stringify(CARD));
  const r = await readJobCard({ apiKey: "sk-ant-test", image, mediaType: "image/jpeg" });

  assert.equal(last.url, "/v1/messages?beta=true");
  assert.equal(last.headers["x-api-key"], "sk-ant-test");
  assert.match(last.headers["anthropic-beta"], /server-side-fallback-2026-07-01/);
  assert.equal(last.body.model, "claude-opus-5");
  assert.equal(last.body.fallbacks, "default");
  assert.equal(last.body.output_config.format.type, "json_schema");
  assert.equal(last.body.output_config.format.schema.additionalProperties, false);
  assert.ok(last.body.output_config.format.schema.required.includes("rx"));
  const [img, txt] = last.body.messages[0].content;
  assert.deepEqual(img.source, { type: "base64", media_type: "image/jpeg", data: image.toString("base64") });
  assert.match(txt.text, /Optimex Opticals/);

  assert.equal(r.fields.name, "Fathima K");
  assert.equal(r.fields.date, "2026-09-21");
  assert.equal(r.fields.dueDate, "", "a date not in YYYY-MM-DD form is dropped");
  assert.equal(r.fields.rx.re.dv.cyl, "-0.50");
  assert.deepEqual(r.unsure, ["rx.re.dv.axis"]);
});

test("a rejected API key becomes a message staff can act on", async () => {
  next = () => ({ status: 401, json: { type: "error", error: { type: "authentication_error", message: "invalid x-api-key" } } });
  await assert.rejects(readJobCard({ apiKey: "sk-ant-bad", image, mediaType: "image/jpeg" }), (e) => e instanceof ReadError && /API key was not accepted/.test(e.message));
});

test("a refusal is reported instead of parsed", async () => {
  next = () => message("", "refusal");
  await assert.rejects(readJobCard({ apiKey: "sk-ant-test", image, mediaType: "image/jpeg" }), (e) => e instanceof ReadError && /could not read this photo/.test(e.message));
});
