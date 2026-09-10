import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";

const root = resolve(process.argv[2] ?? "");
if (!process.argv[2])
  throw new Error("Usage: node verify-backup.mjs <backup-directory>");
const manifest = JSON.parse(
  (await readFile(resolve(root, "manifest.json"), "utf8")).replace(
    /^\uFEFF/,
    "",
  ),
);
for (const required of ["roles.sql", "schema.sql", "data.sql"]) {
  if (!manifest.files.some((file) => file.path === required))
    throw new Error(`Backup is missing ${required}.`);
}
for (const file of manifest.files) {
  const target = resolve(root, ...file.path.split("/"));
  if (!target.startsWith(`${root}${sep}`))
    throw new Error("Unsafe manifest path.");
  const contents = await readFile(target);
  const details = await stat(target);
  const digest = createHash("sha256").update(contents).digest("hex");
  if (details.size !== file.bytes || digest !== file.sha256)
    throw new Error(`Integrity check failed for ${file.path}.`);
}
console.log(
  `Verified ${manifest.files.length} backup files for project ${manifest.projectRef}.`,
);
