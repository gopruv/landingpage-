import type { Metadata } from "next";

/**
 * This page exists only to review the badge and certificate before they ship.
 * A Vercel preview URL is unguessable but not access-controlled, so at minimum
 * keep it out of search engines and out of any crawler's index.
 */
export const metadata: Metadata = {
  title: "Artifact review — Orcred",
  robots: { index: false, follow: false, nocache: true },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
