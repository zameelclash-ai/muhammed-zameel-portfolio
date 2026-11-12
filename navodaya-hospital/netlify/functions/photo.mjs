// GET /api/photo/:key: serves a photo uploaded in the staff editor.
import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const entry = await getStore("nhrc-photos").getWithMetadata(context.params.key, { type: "arrayBuffer" });
  if (entry === null) return new Response("Not found", { status: 404 });
  return new Response(entry.data, { headers: { "content-type": (entry.metadata && entry.metadata.type) || "image/jpeg", "cache-control": "public, max-age=31536000, immutable" } });
};
export const config = { path: "/api/photo/:key" };
