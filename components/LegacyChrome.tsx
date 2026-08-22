"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * The redesigned marketing pages carry their own shell (DocFrame). Pages that
 * have not been redesigned yet — currently only /how-it-works — still expect
 * the original Navbar and Footer from the group layout, so they keep getting
 * them here rather than rendering with no navigation at all.
 *
 * Delete this once /how-it-works is moved onto DocFrame.
 */
const REDESIGNED = new Set([
  "/",
  "/contact",
  "/terms",
  "/privacy",
  "/become-a-reviewer",
  "/join-waitlist",
]);

export default function LegacyChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (REDESIGNED.has(pathname)) return <>{children}</>;

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
