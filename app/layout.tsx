import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import AuthSessionBootstrap from "@/components/AuthSessionBootstrap";
import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: "Orcred | The Standard for AI/ML Intelligence",
  description: "Get your AI/ML project reviewed by a senior engineer in a live 45-minute session. Walk away with a verified credential scored out of 100. 40–60% pass rate by design.",
  metadataBase: new URL("https://orcred.com"),
  openGraph: {
    title: "Orcred | The Standard for AI/ML Intelligence",
    description: "Get your AI/ML project reviewed by a senior engineer in a live 45-minute session. Walk away with a verified credential scored out of 100.",
    url: "https://orcred.com",
    siteName: "Orcred",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Orcred | The Standard for AI/ML Intelligence",
    description: "Live technical verification for AI/ML engineers. One session. One score. A credential that holds.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico",        sizes: "any" },
      { url: "/icon-32.png",        type: "image/png", sizes: "32x32" },
      { url: "/icon-96.png",        type: "image/png", sizes: "96x96" },
      { url: "/icon-192.png",       type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple:    [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      { rel: "android-chrome", url: "/android-chrome-192.png", sizes: "192x192" },
      { rel: "android-chrome", url: "/android-chrome-512.png", sizes: "512x512" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="selection:bg-accent-orange selection:text-white">
        <AuthSessionBootstrap />
        {children}
        <Analytics />
        <CookieBanner />
      </body>
    </html>
  );
}
