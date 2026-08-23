"use client";

/**
 * Frame — the shell every marketing page sits in.
 *
 * A quiet sticky bar that only gains a hairline and a blur once you leave the
 * top, so the header never competes with the page. Below `lg` the nav opens as
 * a soft white sheet with large, comfortable tap targets rather than a
 * full-bleed colour field.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { Btn, EASE, L, MARK, SHELL, T } from "./kit";

const NAV = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Scoring", href: "/#standard" },
  { label: "Process", href: "/#procedure" },
  { label: "Reviewers", href: "/become-a-reviewer" },
  { label: "Contact", href: "/contact" },
];

const FOOT = [
  {
    head: "Verification",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Scoring standard", href: "/#standard" },
      { label: "Process", href: "/#procedure" },
      { label: "Questions", href: "/#questions" },
    ],
  },
  {
    head: "Take part",
    links: [
      { label: "Join the waitlist", href: "/join-waitlist" },
      { label: "Become a reviewer", href: "/become-a-reviewer" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    head: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

/**
 * The mark.
 *
 * With `collapse`, the word retracts into the dot as the page scrolls: its grid
 * track closes to zero while the text drifts left and blurs, so the two read as
 * one object merging rather than a label being hidden. Scrolling back up
 * reverses it, because the whole thing is driven by scroll position rather than
 * by a one-way trigger.
 *
 * The track is animated in `fr` through a motion template — that avoids
 * measuring the text, so it stays correct at any font size or after a reflow.
 */
function Wordmark({ size = 27, collapse = false }: { size?: number; collapse?: boolean }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const on = collapse && !reduce;

  const RANGE = [0, 120];
  const fr = useTransform(scrollY, RANGE, [1, 0]);
  const cols = useMotionTemplate`${fr}fr`;
  const opacity = useTransform(scrollY, RANGE, [1, 0]);
  const x = useTransform(scrollY, RANGE, [0, -14]);
  const b = useTransform(scrollY, RANGE, [0, 3.5]);
  const filter = useMotionTemplate`blur(${b}px)`;
  const gap = useTransform(scrollY, RANGE, [size * MARK.gap, 0]);

  return (
    <Link href="/" className="flex items-center" aria-label="Orcred — home">
      <svg
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden
        style={{ width: size * MARK.dot, height: size * MARK.dot, flexShrink: 0, display: "block" }}
      >
        <circle cx="20" cy="20" r="20" fill="#eb4511" />
      </svg>

      <motion.span
        style={{
          display: "grid",
          gridTemplateColumns: on ? cols : "1fr",
          marginLeft: on ? gap : size * MARK.gap,
          overflow: "hidden",
        }}
      >
        <motion.span
          style={{
            minWidth: 0,
            fontFamily: "'Inter Tight', sans-serif",
            fontWeight: 600,
            fontSize: size,
            letterSpacing: `${MARK.track}em`,
            color: "var(--ink)",
            lineHeight: 1,
            whiteSpace: "nowrap",
            opacity: on ? opacity : 1,
            x: on ? x : 0,
            filter: on ? filter : "none",
          }}
        >
          Orcred
        </motion.span>
      </motion.span>
    </Link>
  );
}

export default function Frame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const [lifted, setLifted] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => setLifted(v > 12));

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isOn = (href: string) => !href.startsWith("/#") && pathname === href;

  return (
    <div className="orx" style={{ minHeight: "100vh" }}>
      {/* ── Bar ── */}
      <header
        className="sticky top-0 z-50"
        style={{
          height: "var(--bar)",
          backgroundColor: lifted ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0)",
          backdropFilter: lifted ? "saturate(180%) blur(16px)" : "none",
          WebkitBackdropFilter: lifted ? "saturate(180%) blur(16px)" : "none",
          borderBottom: `1px solid ${lifted ? "var(--line)" : "transparent"}`,
          transition: "background-color .4s ease, border-color .4s ease, backdrop-filter .4s ease",
        }}
      >
        <div className={`${SHELL} h-full flex items-center gap-6`}>
          <Wordmark collapse />

          <nav className="hidden lg:flex items-center gap-1 ml-auto">
            {NAV.map((l) => (
              <Link key={l.href} href={l.href} className="orx-nav" data-on={isOn(l.href)}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden sm:block lg:ml-4 ml-auto">
            <Btn href="/join-waitlist" className="!py-2.5 !px-5 !text-[14px]">
              Join the waitlist
            </Btn>
          </div>

          {/* Mobile trigger */}
          <button
            type="button"
            className="orx-reset lg:hidden flex items-center justify-center ml-auto sm:ml-3"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="orx-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            style={{
              width: 42,
              height: 42,
              borderRadius: "var(--r-sm)",
              border: "1px solid var(--line-2)",
              backgroundColor: "var(--surface)",
            }}
          >
            <span style={{ display: "block", width: 16, height: 10, position: "relative" }} aria-hidden>
              <motion.span
                style={{ position: "absolute", left: 0, width: 16, height: 1.6, borderRadius: 2, backgroundColor: "var(--ink)", display: "block" }}
                animate={open ? { top: 4.2, rotate: 45 } : { top: 0, rotate: 0 }}
                transition={{ duration: 0.34, ease: EASE }}
              />
              <motion.span
                style={{ position: "absolute", left: 0, width: 16, height: 1.6, borderRadius: 2, backgroundColor: "var(--ink)", display: "block" }}
                animate={open ? { top: 4.2, rotate: -45 } : { top: 8.4, rotate: 0 }}
                transition={{ duration: 0.34, ease: EASE }}
              />
            </span>
          </button>
        </div>
      </header>

      {/* ── Mobile sheet ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="orx-menu"
            className="lg:hidden fixed inset-0 z-40 flex flex-col"
            style={{ backgroundColor: "var(--bg)", paddingTop: "var(--bar)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-10">
              <nav className="flex flex-col gap-1">
                {NAV.map((l, i) => (
                  <motion.div
                    key={l.href}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 + i * 0.05, ease: EASE }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between"
                      style={{
                        fontFamily: "'Inter Tight', sans-serif",
                        fontSize: 22,
                        fontWeight: 500,
                        letterSpacing: "-0.028em",
                        color: "var(--ink)",
                        textDecoration: "none",
                        padding: "16px 14px",
                        borderRadius: "var(--r)",
                      }}
                    >
                      {l.label}
                      <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden style={{ color: "var(--ink-4)" }}>
                        <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.32, ease: EASE }}
              >
                <Btn href="/join-waitlist" className="w-full" onClick={() => setOpen(false)}>
                  Join the waitlist
                </Btn>

                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                  {[
                    { l: "Terms", h: "/terms" },
                    { l: "Privacy", h: "/privacy" },
                    { l: "team@orcred.com", h: "mailto:team@orcred.com" },
                  ].map((x) => (
                    <Link key={x.h} href={x.h} onClick={() => setOpen(false)} style={{ ...T.fine, textDecoration: "none" }}>
                      {x.l}
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>{children}</main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--line)", backgroundColor: "var(--bg-soft)" }}>
        <div className={`${SHELL} pt-16 pb-10`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-12 lg:gap-x-10">
            <div className="lg:col-span-5">
              <Wordmark />
              <p style={{ ...T.body, marginTop: 16, maxWidth: 320 }}>
                The verification standard for AI/ML engineers in India.
              </p>
              <a
                href="mailto:team@orcred.com"
                className="orx-link"
                style={{ marginTop: 20, display: "inline-flex" }}
              >
                <span>team@orcred.com</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-y-10 gap-x-6">
              {FOOT.map((col) => (
                <div key={col.head}>
                  <L style={{ display: "block", marginBottom: 16 }}>{col.head}</L>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }} className="flex flex-col gap-3">
                    {col.links.map((l) => (
                      <li key={l.href + l.label}>
                        <Link
                          href={l.href}
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 15,
                            fontWeight: 400,
                            color: "var(--ink-2)",
                            textDecoration: "none",
                            transition: "color .2s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--or)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-2)")}
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mt-14 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{ borderTop: "1px solid var(--line)" }}
          >
            <span style={{ ...T.fine }}>© 2026 Orcred</span>
            <span style={{ ...T.fine }}>Bengaluru, India</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
