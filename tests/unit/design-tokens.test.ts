import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(__dirname, "../..");
const sourceRoot = join(projectRoot, "src");
const globalsPath = join(sourceRoot, "app", "globals.css");
const sourceExtensions = new Set([".css", ".ts", ".tsx"]);

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) return collectSourceFiles(path);

    const extension = entry.slice(entry.lastIndexOf("."));
    return sourceExtensions.has(extension) ? [path] : [];
  });
}

function customPropertiesDefinedIn(css: string) {
  return new Set(
    Array.from(css.matchAll(/(^|[;{\s])(--[\w-]+)\s*:/gm), (match) => match[2]),
  );
}

function customPropertiesReferencedIn(source: string) {
  return new Set(
    Array.from(source.matchAll(/var\(\s*(--[\w-]+)/g), (match) => match[1]),
  );
}

describe("global design tokens", () => {
  it("defines every custom property referenced by the application UI", () => {
    const globals = readFileSync(globalsPath, "utf8");
    const defined = customPropertiesDefinedIn(globals);
    const referenced = new Set<string>();

    for (const file of collectSourceFiles(sourceRoot)) {
      for (const property of customPropertiesReferencedIn(
        readFileSync(file, "utf8"),
      )) {
        referenced.add(property);
      }
    }

    const undefinedProperties = [...referenced]
      .filter((property) => !defined.has(property))
      .sort();

    expect(undefinedProperties).toEqual([]);
  });

  it("keeps action colors mapped to concrete brand colors", () => {
    const globals = readFileSync(globalsPath, "utf8");

    expect(globals).toMatch(/--color-primary:\s*var\(--brand-950\)/);
    expect(globals).toMatch(/--color-primary-hover:\s*var\(--brand-700\)/);
    expect(globals).toMatch(/--color-accent:\s*var\(--accent-warm\)/);
    expect(globals).toMatch(/--text-primary:\s*var\(--text-strong\)/);
    expect(globals).toMatch(/--text-secondary:\s*var\(--text-muted\)/);
  });
});
