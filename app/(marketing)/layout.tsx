import { ReactNode } from 'react';
import LegacyChrome from '@/components/LegacyChrome';

/**
 * Redesigned marketing pages bind themselves into <DocFrame>, which carries its
 * own index rail and colophon — each document has a different contents list, so
 * the shell cannot live here. LegacyChrome keeps the original Navbar/Footer on
 * the pages that have not been redesigned yet.
 *
 * CookieBanner is deliberately absent: the root layout already mounts it, and
 * rendering it here too put two banners on every marketing page.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <LegacyChrome>{children}</LegacyChrome>;
}
