import { ReactNode } from 'react';

/**
 * Every marketing page now binds itself into <Frame>, which carries the header
 * and footer. There is nothing left for this layout to add.
 *
 * CookieBanner is deliberately absent: the root layout already mounts it, and
 * rendering it here too put two banners on every marketing page.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
