"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* Targets follow the clause ids on the redesigned home document. */
const navLinks = [
  { label: "The Gap",  href: "#gap"        },
  { label: "Scoring",  href: "#standard"   },
  { label: "Process",  href: "#procedure"  },
  { label: "Compare",  href: "#comparison" },
];

function scrollTo(href: string) {
  if (href.startsWith("#")) {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }
}

export default function Navbar() {
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const isHome = pathname === "/";

  /* Wordmark dissolves into the orange mark as you scroll */
  const wordmarkOpacity        = useTransform(scrollY, [0, 60], [1, 0]);
  const wordmarkX              = useTransform(scrollY, [0, 60], [0, -20]);
  const wordmarkContainerWidth = useTransform(scrollY, [0, 60], [72, 0]);

  return (
    <motion.header
      className="sticky top-0 z-50"
      style={{
        backgroundColor: "var(--bg-page)",
        borderBottom: "none",
      }}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-[1400px] mx-auto flex items-center h-[60px] px-6 sm:px-10 lg:px-16">

        {/* Brand */}
        <Link
          href="/"
          className="flex items-center overflow-hidden"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <svg width="28" height="28" viewBox="0 0 42 42" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="21" cy="21" r="20" fill="#eb4511"/>
          </svg>

          {/* Wordmark — collapses into mark on scroll */}
          <motion.div style={{ width: wordmarkContainerWidth, overflow: "hidden", flexShrink: 0 }}>
            <motion.span
              style={{
                opacity:       wordmarkOpacity,
                x:             wordmarkX,
                display:       "block",
                whiteSpace:    "nowrap",
                paddingLeft:   "7px",
                fontFamily:    "Inter, system-ui, sans-serif",
                fontWeight:    700,
                fontSize:      "18px",
                letterSpacing: "-0.02em",
                color:         "#0f0d0c",
              }}
            >
              Orcred
            </motion.span>
          </motion.div>
        </Link>

        {/* Nav links + CTA — all on the right */}
        <nav className="hidden md:flex items-center gap-8 ml-auto">
          {navLinks.map((link) =>
            isHome ? (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="transition-colors duration-200"
                style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, fontSize: "14px", letterSpacing: "-0.01em", color: "#4a4440", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#0f0d0c")}
                onMouseLeave={e => (e.currentTarget.style.color = "#4a4440")}
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.href}
                href={{ pathname: "/", hash: link.href.replace("#", "") }}
                className="transition-colors duration-200"
                style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, fontSize: "14px", letterSpacing: "-0.01em", color: "#4a4440" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#0f0d0c")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#4a4440")}
              >
                {link.label}
              </Link>
            )
          )}

          {/* Apply Now — primary CTA */}
          <Link
            href="/join-waitlist"
            className="font-label-sm uppercase tracking-[0.15em] text-[11px] px-5 py-2.5"
            style={{
              backgroundColor: "#eb4511",
              color:            "#ffffff",
              borderRadius:     "100px",
              transition:       "opacity 0.15s ease",
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "0.8")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            Join the Waitlist
          </Link>
        </nav>

      </div>
    </motion.header>
  );
}
