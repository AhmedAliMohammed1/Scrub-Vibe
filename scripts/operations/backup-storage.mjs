import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

const backupDirectory = process.argv[2];
const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const secret =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!backupDirectory || !baseUrl || !secret)
  throw new Error("Storage backup configuration is incomplete.");
const root = resolve(backupDirectory, "storage");
const headers = { apikey: secret, Authorization: `Bearer ${secret}` };

const bucketsResponse = await fetch(`${baseUrl}/storage/v1/bucket`, {
  headers,
});
if (!bucketsResponse.ok)
  throw new Error(
    `Could not list storage buckets (${bucketsResponse.status}).`,
  );
const buckets = await bucketsResponse.json();

function safeTarget(bucket, name) {
  const target = resolve(root, bucket, ...name.split("/"));
  if (!target.startsWith(`${resolve(root)}${sep}`))
    throw new Error("Unsafe storage object path.");
  return target;
}

async function listObjects(bucket, prefix = "") {
  const collected = [];
  let offset = 0;
  while (true) {
    const response = await fetch(
      `${baseUrl}/storage/v1/object/list/${encodeURIComponent(bucket)}`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix,
          limit: 1000,
          offset,
          sortBy: { column: "name", order: "asc" },
        }),
      },
    );
    if (!response.ok)
      throw new Error(`Could not list bucket ${bucket} (${response.status}).`);
    const page = await response.json();
    for (const entry of page) {
      if (entry.id)
        collected.push({ ...entry, name: `${prefix}${entry.name}` });
      else
        collected.push(
          ...(await listObjects(bucket, `${prefix}${entry.name}/`)),
        );
    }
    if (page.length < 1000) break;
    offset += page.length;
  }
  return collected;
}

for (const bucket of buckets) {
  const objects = await listObjects(bucket.id);
  for (const object of objects) {
    if (!object.id || !object.name) continue;
    const response = await fetch(
      `${baseUrl}/storage/v1/object/authenticated/${encodeURIComponent(bucket.id)}/${object.name.split("/").map(encodeURIComponent).join("/")}`,
      { headers },
    );
    if (!response.ok)
      throw new Error(
        `Could not download ${bucket.id}/${object.name} (${response.status}).`,
      );
    const target = safeTarget(bucket.id, object.name);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await response.arrayBuffer()));
  }
}
