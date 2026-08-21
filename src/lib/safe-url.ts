/**
 * Link protocol allowlist for rendered model output.
 *
 * Extracted from markdown.tsx so it can be exercised by a self-check without a
 * JSX runtime. This is a security boundary — a model emitting
 * `[click](javascript:...)` must produce a dead href, not a live one.
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/** Returns the url when its protocol is allowlisted, otherwise an empty href. */
export function safeUrl(url: string): string {
  try {
    // Relative urls resolve against the base and land on https: — allowed.
    const parsed = new URL(url, "https://lume.invalid/");
    return ALLOWED_PROTOCOLS.has(parsed.protocol) ? url : "";
  } catch {
    return "";
  }
}
