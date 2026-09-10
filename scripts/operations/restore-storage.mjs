import { readFile, readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";

const backupRoot = resolve(process.argv[2] ?? "");
const confirmedRef = process.argv[3];
const targetUrl = process.env.RESTORE_TARGET_SUPABASE_URL?.replace(/\/$/, "");
const targetSecret = process.env.RESTORE_TARGET_SUPABASE_SECRET_KEY;
const targetRef = process.env.RESTORE_TARGET_PROJECT_REF;
if (!process.argv[2] || !confirmedRef)
  throw new Error(
    "Usage: node restore-storage.mjs <backup-directory> <confirmed-target-ref>",
  );
if (!targetUrl || !targetSecret || !targetRef)
  throw new Error("Restore target environment is incomplete.");
if (targetRef === "iqufqtjotgpmhhtvlxwf")
  throw new Error("Storage restore drills are forbidden against production.");
if (confirmedRef !== targetRef)
  throw new Error(
    "Target confirmation does not match RESTORE_TARGET_PROJECT_REF.",
  );

const storageRoot = resolve(backupRoot, "storage");
const headers = {
  apikey: targetSecret,
  Authorization: `Bearer ${targetSecret}`,
};
const buckets = await readdir(storageRoot, { withFileTypes: true });

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesBelow(target)));
    else files.push(target);
  }
  return files;
}

for (const bucket of buckets.filter((entry) => entry.isDirectory())) {
  const files = await filesBelow(resolve(storageRoot, bucket.name));
  for (const file of files) {
    const objectName = relative(
      resolve(storageRoot, bucket.name),
      file,
    ).replaceAll("\\", "/");
    const response = await fetch(
      `${targetUrl}/storage/v1/object/${encodeURIComponent(bucket.name)}/${objectName.split("/").map(encodeURIComponent).join("/")}`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/octet-stream",
          "x-upsert": "true",
        },
        body: await readFile(file),
      },
    );
    if (!response.ok)
      throw new Error(
        `Could not restore ${bucket.name}/${objectName} (${response.status}).`,
      );
  }
}
console.log(
  `Storage restore drill completed for non-production project ${targetRef}.`,
);
