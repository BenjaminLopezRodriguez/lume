/**
 * Self-check for the rendered-link protocol allowlist.
 * Run: pnpm check:markdown
 *
 * Model output is untrusted presentation. A model emitting
 * `[click](javascript:alert(1))` must yield a dead href.
 */

import assert from "node:assert/strict";
import { safeUrl } from "./safe-url.ts";

// ── blocked protocols ────────────────────────────────────────────────────────
for (const hostile of [
  "javascript:alert(1)",
  "JaVaScRiPt:alert(1)",       // case must not evade
  "  javascript:alert(1)",     // leading space must not evade
  "java\tscript:alert(1)",     // embedded control char
  "data:text/html,<script>alert(1)</script>",
  "vbscript:msgbox(1)",
  "file:///etc/passwd",
  "blob:https://x/y",
]) {
  assert.equal(safeUrl(hostile), "", `must block: ${JSON.stringify(hostile)}`);
}

// ── allowed protocols ────────────────────────────────────────────────────────
for (const ok of [
  "https://example.com/menu",
  "http://example.com",
  "mailto:owner@example.com",
  "/m/orders",                 // relative resolves to https:
  "./product",
]) {
  assert.equal(safeUrl(ok), ok, `must allow: ${ok}`);
}

// ── malformed input returns a dead href rather than throwing ────────────────
for (const junk of ["", "   ", "::::", "http://[", "%%%"]) {
  assert.doesNotThrow(() => safeUrl(junk));
  assert.equal(typeof safeUrl(junk), "string");
}

console.log("link protocol allowlist self-check: all assertions passed");
