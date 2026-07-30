"use client";

import Link from "next/link";

const primaryLinks = [
  { label: "Contact Us",        href: "/contact"           },
  { label: "Become a Reviewer", href: "/become-a-reviewer" },
];

const legalLinks = [
  { label: "Terms",   href: "/terms"   },
  { label: "Privacy", href: "/privacy" },
];

export default function Footer() {
  return (
    <footer
      className="px-6 sm:px-10 lg:px-16 py-8"
      style={{
        backgroundColor: "var(--bg-page)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

        {/* Left — primary nav links */}
        <div className="flex flex-wrap items-center gap-6">
          {primaryLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition-colors duration-200"
              style={{ fontSize: "12px", fontWeight: 400, letterSpacing: "0.01em", color: "var(--fg-muted)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--fg)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--fg-muted)")}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right — legal + copyright */}
        <div className="flex flex-wrap items-center gap-6">
          {legalLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition-colors duration-200"
              style={{ fontSize: "12px", fontWeight: 400, letterSpacing: "0.01em", color: "var(--fg-muted)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--fg)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--fg-muted)")}
            >
              {item.label}
            </Link>
          ))}
          <span style={{ fontSize: "12px", fontWeight: 400, letterSpacing: "0.01em", color: "var(--fg-faint)" }}>
            © 2026 Orcred
          </span>
        </div>

      </div>
    </footer>
  );
}
