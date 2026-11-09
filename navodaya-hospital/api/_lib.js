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

function same(a, b) {
  a = String(a || ""); b = String(b || "");
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Staff login is checked here, on the server. ADMIN_PASSWORD must be set in Vercel, or nobody can log in.
export function authorised(user, password, env = process.env) {
  return !!env.ADMIN_PASSWORD &&
    same(String(user || "").toLowerCase(), String(env.ADMIN_USER || "navodaya").toLowerCase()) &&
    same(password, env.ADMIN_PASSWORD);
}
