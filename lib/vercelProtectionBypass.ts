/**
 * Bypass Vercel Deployment Protection on the backend (preview/testing).
 * Set NEXT_PUBLIC_VERCEL_PROTECTION_BYPASS to the secret from the **backend**
 * project → Settings → Deployment Protection → Protection Bypass for Automation.
 *
 * Preview only — the value is visible in the browser bundle.
 */
export function vercelProtectionBypassHeaders(): Record<string, string> {
  const secret = process.env.NEXT_PUBLIC_VERCEL_PROTECTION_BYPASS?.trim();
  if (!secret) return {};
  return { 'x-vercel-protection-bypass': secret };
}
