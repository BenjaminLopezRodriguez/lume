/**
 * Resolution shim so bare Node can run application code (pnpm eval:agent).
 *
 * Covers the two things bundlers do implicitly and Node ESM does not:
 *   1. the "@/..." tsconfig path alias
 *   2. extensionless imports, both aliased and relative ("./policy")
 *
 * Cheaper than rewriting imports across the codebase or adding a TS runner.
 */
import { existsSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = resolvePath(process.cwd(), "src");
const EXTS = ["", ".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.js"];

function probe(basePath) {
  for (const ext of EXTS) {
    if (existsSync(basePath + ext)) return pathToFileURL(basePath + ext).href;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  // "server-only" throws by design outside a Next server bundle. This script IS
  // server-side, so the guard is satisfied in substance; stub it out.
  if (specifier === "server-only") {
    return { url: "data:text/javascript,export{}", shortCircuit: true };
  }

  if (specifier.startsWith("@/")) {
    const hit = probe(resolvePath(SRC, specifier.slice(2)));
    if (hit) return nextResolve(hit, context);
  }

  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    // Relative specifier missing its extension — probe before giving up.
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const hit = probe(
        resolvePath(dirname(fileURLToPath(context.parentURL)), specifier),
      );
      if (hit) return nextResolve(hit, context);
    }
    throw err;
  }
}
