import { env } from "@/env";

/**
 * Bearer auth for the commerce boundary.
 *
 * Agents have no Kinde session, so /api/commerce/* bypasses the auth middleware
 * and authenticates here instead. Phase 1 uses a single platform key; per-merchant
 * keys and delegated agent credentials are a follow-up.
 *
 * Fails closed: with no key configured the surface is unavailable rather than open.
 */
export function authorizeCommerceRequest(req: Request):
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string } {
  const configured = env.COMMERCE_API_KEY;

  if (!configured) {
    return {
      ok: false,
      status: 503,
      error: "Commerce API is not enabled for this deployment.",
    };
  }

  const header = req.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!presented || !timingSafeEqual(presented, configured)) {
    return { ok: false, status: 401, error: "Invalid or missing bearer token." };
  }

  return { ok: true };
}

/** Constant-time compare so the key can't be recovered by timing the endpoint. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
