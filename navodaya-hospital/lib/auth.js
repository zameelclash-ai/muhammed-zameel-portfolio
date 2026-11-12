// Staff login check, shared by the Vercel and Netlify backends. The password lives only in the host's settings.
function same(a, b) {
  a = String(a || ""); b = String(b || "");
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
export function authorised(user, password, env = process.env) {
  return !!env.ADMIN_PASSWORD &&
    same(String(user || "").toLowerCase(), String(env.ADMIN_USER || "navodaya").toLowerCase()) &&
    same(password, env.ADMIN_PASSWORD);
}
