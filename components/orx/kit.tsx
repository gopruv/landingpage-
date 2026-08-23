"use client";

/**
 * ORX kit — the shared vocabulary of the Orcred marketing surface.
 *
 * Register: modern and quiet. Mixed-case Inter Tight for statements, real grey
 * values rather than black-at-opacity, hairline borders, generous radii and
 * layered shadows. Orange is an accent — a button, a small mark, a thin fill —
 * and never a flat field.
 *
 * Motion is long and soft: nothing snaps, nothing wipes.
 */

import Link from "next/link";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export const EASE = [0.22, 1, 0.36, 1] as const;

const DISPLAY = "'Inter Tight', 'Inter', system-ui, sans-serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

/* ── Type ────────────────────────────────────────────────────────────────── */

export const T = {
  /** Page statement. Once per page. */
  hero: {
    fontFamily: DISPLAY,
    fontSize: "clamp(40px, 5.2vw, 72px)",
    fontWeight: 500,
    letterSpacing: "-0.038em",
    lineHeight: 1.04,
    color: "var(--ink)",
  } as CSSProperties,
  /** Section statement. */
  head: {
    fontFamily: DISPLAY,
    fontSize: "clamp(30px, 3.2vw, 46px)",
    fontWeight: 500,
    letterSpacing: "-0.034em",
    lineHeight: 1.1,
    color: "var(--ink)",
  } as CSSProperties,
  /** Card / row title. */
  title: {
    fontFamily: DISPLAY,
    fontSize: "clamp(19px, 1.6vw, 22px)",
    fontWeight: 500,
    letterSpacing: "-0.022em",
    lineHeight: 1.3,
    color: "var(--ink)",
  } as CSSProperties,
  /** Standfirst. */
  lede: {
    fontFamily: SANS,
    fontSize: "clamp(17px, 1.3vw, 20px)",
    fontWeight: 400,
    letterSpacing: "-0.011em",
    lineHeight: 1.6,
    color: "var(--ink-2)",
  } as CSSProperties,
  /** Running body. */
  body: {
    fontFamily: SANS,
    fontSize: "16.5px",
    fontWeight: 400,
    letterSpacing: "-0.008em",
    lineHeight: 1.72,
    color: "var(--ink-2)",
  } as CSSProperties,
  fine: {
    fontFamily: SANS,
    fontSize: "14.5px",
    fontWeight: 400,
    letterSpacing: "-0.005em",
    lineHeight: 1.6,
    color: "var(--ink-3)",
  } as CSSProperties,
  /** Figure. Tabular, tight, but not a mono slab. */
  fig: {
    fontFamily: DISPLAY,
    fontWeight: 500,
    letterSpacing: "-0.045em",
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
    color: "var(--ink)",
  } as CSSProperties,
};

export const PAD = "px-6 sm:px-8 lg:px-10";
export const SHELL = `mx-auto w-full max-w-[1240px] ${PAD}`;

/* ── Label ───────────────────────────────────────────────────────────────── */

export function L({
  children,
  c = "var(--ink-3)",
  className = "",
  style,
}: {
  children: ReactNode;
  c?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`orx-label ${className}`} style={{ color: c, ...style }}>
      {children}
    </span>
  );
}

/** A small orange dot used to mark an eyebrow. */
export function Dot({ c = "var(--or)" }: { c?: string }) {
  return (
    <span
      aria-hidden
      style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: c, flexShrink: 0, display: "block" }}
    />
  );
}

/**
 * The Orcred mark.
 *
 * One lockup, used at every size — site chrome, badge, certificate. The dot
 * and the gap are derived from the wordmark's size through fixed ratios, so the
 * proportions hold wherever it lands and cannot drift apart between surfaces
 * again. The dot is drawn edge-to-edge in its viewBox, so `dot: 1` means the
 * orange circle is exactly as tall as the type is large.
 *
 * `u` converts a design-unit number into whatever unit the surface measures in:
 * pixels in the page chrome, container-relative lengths inside the badge, a
 * scaled value on the certificate. Being an SVG circle, it is resolution-free —
 * it cannot pixelate at any size.
 *
 * `track` is deliberately looser than the display headings use: tight negative
 * tracking that reads well at 19px turns cramped once the wordmark is set at
 * 27px, where the letters start colliding rather than just closing up.
 */
export const MARK = { dot: 1, gap: 0.3, track: -0.018 } as const;

export function Mark({
  size = 23,
  u = (n: number) => n,
  color = "var(--ink)",
}: {
  size?: number;
  u?: (n: number) => number | string;
  color?: string;
}) {
  const d = u(size * MARK.dot);
  return (
    <span className="inline-flex items-center" style={{ gap: u(size * MARK.gap) }}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden
        style={{ width: d, height: d, flexShrink: 0, display: "block" }}
      >
        <circle cx="20" cy="20" r="20" fill="#eb4511" />
      </svg>
      <span
        style={{
          fontFamily: "'Inter Tight', sans-serif",
          fontWeight: 600,
          fontSize: u(size),
          letterSpacing: `${MARK.track}em`,
          lineHeight: 1,
          color,
        }}
      >
        Orcred
      </span>
    </span>
  );
}

export function Eyebrow({ children, c = "var(--or)" }: { children: ReactNode; c?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Dot c={c} />
      <L c={c}>{children}</L>
    </span>
  );
}

/* ── Rise: the default entrance ──────────────────────────────────────────── */

export function Rise({
  children,
  delay = 0,
  y = 16,
  now = false,
  amount = 0.2,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  now?: boolean;
  amount?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  const from = reduce ? { opacity: 0 } : { opacity: 0, y };
  const to = reduce ? { opacity: 1 } : { opacity: 1, y: 0 };
  return (
    <motion.div
      className={className}
      style={style}
      initial={from}
      {...(now ? { animate: to } : { whileInView: to, viewport: { once: true, amount } })}
      transition={{ duration: reduce ? 0.35 : 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ── Lines: a statement resolving line by line ───────────────────────────── */

/**
 * Soft variant of a mask reveal — the lines settle up and fade rather than
 * snapping out of a hard clip, which is what made the previous pass feel
 * mechanical.
 */
export function Lines({
  lines,
  delay = 0,
  stagger = 0.09,
  now = false,
  style,
  className,
}: {
  lines: ReactNode[];
  delay?: number;
  stagger?: number;
  now?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const parent: Variants = {
    hide: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
  const child: Variants = reduce
    ? { hide: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.35 } } }
    : {
        hide: { y: "36%", opacity: 0 },
        show: { y: "0%", opacity: 1, transition: { duration: 1.05, ease: EASE } },
      };

  return (
    <motion.span
      className={className}
      style={{ display: "block", ...style }}
      variants={parent}
      initial="hide"
      {...(now ? { animate: "show" } : { whileInView: "show", viewport: { once: true, amount: 0.3 } })}
    >
      {lines.map((line, i) => (
        <span key={i} style={{ display: "block", overflow: "hidden", paddingBottom: "0.06em", marginBottom: "-0.06em" }}>
          <motion.span variants={child} style={{ display: "block", willChange: "transform, opacity" }}>
            {line}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/* ── Rule: a hairline that fades in ──────────────────────────────────────── */

export function Rule({
  delay = 0,
  className = "",
  style,
}: {
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={{ height: 1, width: "100%", backgroundColor: "var(--line)", transformOrigin: "left center", ...style }}
      initial={reduce ? { opacity: 0 } : { scaleX: 0, opacity: 0 }}
      whileInView={reduce ? { opacity: 1 } : { scaleX: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: reduce ? 0.3 : 1, delay, ease: EASE }}
    />
  );
}

/* ── Tally ───────────────────────────────────────────────────────────────── */

export function Tally({
  to,
  dur = 1.6,
  delay = 0,
  suffix = "",
}: {
  to: number;
  dur?: number;
  delay?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!seen) return;
    if (reduce) {
      setV(to);
      return;
    }
    let raf = 0;
    const start = performance.now() + delay * 1000;
    const tick = (now: number) => {
      const p = Math.min(Math.max((now - start) / (dur * 1000), 0), 1);
      setV(Math.round(to * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, dur, delay, reduce]);

  return (
    <span ref={ref} className="orx-num">
      {v}
      {suffix}
    </span>
  );
}

/* ── Meter: a thin rounded fill ──────────────────────────────────────────── */

export function Meter({
  value,
  max = 100,
  delay = 0,
  accent = true,
  height = 4,
}: {
  value: number;
  max?: number;
  delay?: number;
  /** false renders the fill in grey rather than orange */
  accent?: boolean;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const pct = `${(value / max) * 100}%`;

  return (
    <div
      ref={ref}
      style={{
        height,
        backgroundColor: "rgba(16,17,20,0.07)",
        borderRadius: 999,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <motion.div
        style={{
          height: "100%",
          borderRadius: 999,
          backgroundColor: accent ? "var(--or)" : "var(--ink-4)",
        }}
        initial={reduce ? { width: pct } : { width: 0 }}
        animate={seen ? { width: pct } : undefined}
        transition={{ duration: 1.3, delay, ease: EASE }}
      />
    </div>
  );
}

/* ── Controls ────────────────────────────────────────────────────────────── */

const ArrowGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
    <path
      d="M3 7h8M7.5 3.5 11 7l-3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function Btn({
  href,
  children,
  variant = "solid",
  className = "",
  onClick,
}: {
  href: string;
  children: ReactNode;
  variant?: "solid" | "soft" | "ghost";
  className?: string;
  onClick?: () => void;
}) {
  const cls = `orx-btn ${variant !== "solid" ? `orx-btn--${variant}` : ""} ${className}`;
  if (href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a href={href} className={cls} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} onClick={onClick}>
      {children}
    </Link>
  );
}

export function Arrow({
  href,
  children,
  className = "",
  onClick,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span>{children}</span>
      <ArrowGlyph />
    </>
  );
  if (href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a href={href} className={`orx-link ${className}`} onClick={onClick}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={`orx-link ${className}`} onClick={onClick}>
      {inner}
    </Link>
  );
}

/* ── Section ─────────────────────────────────────────────────────────────── */

export function Section({
  id,
  eyebrow,
  soft = false,
  children,
  className = "",
}: {
  id: string;
  eyebrow?: string;
  /** tint the band very slightly, for rhythm */
  soft?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={className}
      style={{
        backgroundColor: soft ? "var(--bg-soft)" : "var(--bg)",
        borderTop: "1px solid var(--line)",
        scrollMarginTop: 72,
      }}
    >
      <div className={`${SHELL} py-20 sm:py-24 lg:py-32`}>
        {eyebrow && (
          <Rise className="mb-7">
            <Eyebrow>{eyebrow}</Eyebrow>
          </Rise>
        )}
        {children}
      </div>
    </section>
  );
}

/**
 * Section heading + lede.
 *
 * Stacked and left-aligned on one measure rather than split across the width —
 * a title on the left with its standfirst on the right makes the eye travel
 * sideways to pick up the thread, which is exactly the strain to avoid. One
 * column, one reading path.
 */
export function Heading({
  lines,
  lede,
  className = "",
}: {
  lines: ReactNode[];
  lede?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 style={{ maxWidth: 760 }}>
        <Lines lines={lines} style={T.head} />
      </h2>
      {lede && (
        <Rise delay={0.15} className="mt-5" style={{ ...T.lede, maxWidth: 620 }}>
          {lede}
        </Rise>
      )}
    </div>
  );
}
