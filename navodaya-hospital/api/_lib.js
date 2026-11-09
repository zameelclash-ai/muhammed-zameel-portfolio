// Shared helpers for the Vercel functions. Files starting with "_" are not turned into URLs by Vercel.
export function send(res, status, obj, cache) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", cache || "no-store");
  res.end(JSON.stringify(obj));
}

export async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString("utf8") || "{}");
    return req.body;
  }
  let data = "";
  for await (const chunk of req) data += chunk;
  return data ? JSON.parse(data) : {};
}

export { authorised } from "../lib/auth.js";
