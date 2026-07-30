export const DEV_FULL_ACCESS_EMAILS = new Set(
  (process.env.NEXT_PUBLIC_DEV_FULL_ACCESS_EMAILS ?? "anshika.sswal@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

export function isDevFullAccess(email: string | undefined | null): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (!email) return false;
  return DEV_FULL_ACCESS_EMAILS.has(email.toLowerCase());
}

export function allowsDashboardRole(
  email: string | undefined | null,
  required: "admin" | "reviewer" | "student",
  accountType: string | undefined | null,
): boolean {
  if (isDevFullAccess(email)) return true;
  return accountType === required;
}
