// Reads photos of a filled test job card and checks every field against what is written on it.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { readJobCardOffline, ReadError } from "../ocr/reader.js";

const expected = JSON.parse(fs.readFileSync(new URL("./expected-1042.json", import.meta.url)));
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v, p + k + ".") : [[p + k, v]]));
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9.+-]/g, "");

for (const name of ["card-1042.jpg", "card-1042-tilted.jpg", "card-1042-upside-down.jpg", "card-1042-blurry.jpg"]) {
  test(`reads every field of ${name}`, { timeout: 120000 }, async () => {
    const { fields, unsure } = await readJobCardOffline(fs.readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));
    const got = Object.fromEntries(flat(fields));
    const wrong = flat(expected).filter(([k, v]) => norm(got[k] ?? "") !== norm(v)).map(([k, v]) => `${k}: got ${JSON.stringify(got[k])}, want ${JSON.stringify(v)}${unsure.includes(k) ? " (flagged)" : ""}`);
    assert.deepEqual(wrong, []);
    assert.ok(unsure.length <= 3, `too many fields flagged: ${unsure.join(", ")}`);
  });
}

test("a photo without the job card gives a clear message", { timeout: 60000 }, async () => {
  const sharp = (await import("sharp")).default;
  const blank = await sharp({ create: { width: 800, height: 1000, channels: 3, background: "#d8c8a8" } }).jpeg().toBuffer();
  await assert.rejects(readJobCardOffline(blank), (e) => e instanceof ReadError && /Couldn't find the job card/.test(e.message));
});
