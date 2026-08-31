"use client";

/**
 * Sheet — the header and form primitives shared by every non-home page.
 *
 * Fields are labelled above the input on a single column with large targets,
 * which is the arrangement people fill in fastest. No numbering, no side
 * columns: one path down the page.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";
import { EASE, Eyebrow, L, Lines, Rise, SHELL, T } from "./kit";

/* ── Page head ───────────────────────────────────────────────────────────── */

export function Head({
  eyebrow,
  title,
  lede,
  meta,
}: {
  eyebrow: string;
  title: ReactNode[];
  lede?: ReactNode;
  /** Small facts shown as pills under the lede. */
  meta?: string[];
}) {
  return (
    <div className="relative" style={{ overflow: "hidden" }}>
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(52% 60% at 8% 0%, rgba(235,69,17,0.09) 0%, rgba(235,69,17,0) 60%)",
        }}
      />

      <div className={`${SHELL} relative pt-14 sm:pt-20 pb-14 sm:pb-16`}>
        <Rise now className="mb-7">
          <Eyebrow>{eyebrow}</Eyebrow>
        </Rise>

        <h1>
          <Lines now delay={0.06} style={{ ...T.hero, maxWidth: 780 }} lines={title} />
        </h1>

        {lede && (
          <Rise now delay={0.3} className="mt-6" style={{ ...T.lede, maxWidth: 580 }}>
            {lede}
          </Rise>
        )}

        {meta && meta.length > 0 && (
          <Rise now delay={0.4} className="mt-8 flex flex-wrap gap-2.5">
            {meta.map((m) => (
              <span
                key={m}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "1px solid var(--line-2)",
                  backgroundColor: "var(--surface)",
                  fontSize: 14,
                  fontWeight: 450,
                  color: "var(--ink-2)",
                  letterSpacing: "-0.008em",
                }}
              >
                {m}
              </span>
            ))}
          </Rise>
        )}
      </div>
    </div>
  );
}

/* ── A section within a page ─────────────────────────────────────────────── */

export function Block({
  id,
  eyebrow,
  soft = false,
  children,
  className = "",
}: {
  id: string;
  eyebrow?: string;
  soft?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={className}
      style={{
        borderTop: "1px solid var(--line)",
        backgroundColor: soft ? "var(--bg-soft)" : "var(--bg)",
        scrollMarginTop: 72,
      }}
    >
      <div className={`${SHELL} py-16 sm:py-20`}>
        {eyebrow && (
          <Rise className="mb-8">
            <Eyebrow>{eyebrow}</Eyebrow>
          </Rise>
        )}
        {children}
      </div>
    </section>
  );
}

/* ── Field ───────────────────────────────────────────────────────────────── */

export function Field({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Rise style={{ marginBottom: 26 }}>
      <label
        htmlFor={id}
        className="flex items-baseline gap-2"
        style={{ marginBottom: 9 }}
      >
        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          {label}
          {required && (
            <span style={{ color: "var(--or)", marginLeft: 3, fontWeight: 600 }} aria-hidden="true">
              *
            </span>
          )}
        </span>
        {required && (
          <span style={{ fontSize: 13, color: "var(--or)", fontWeight: 500 }} aria-hidden="true">
            required
          </span>
        )}
      </label>

      {children}

      {hint && (
        <div style={{ marginTop: 9, ...T.fine }}>{hint}</div>
      )}
    </Rise>
  );
}

/* ── Toggle group ────────────────────────────────────────────────────────── */

export function Chips({
  options,
  selected,
  onToggle,
  atMax,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  atMax: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((o) => {
        const on = selected.includes(o);
        const blocked = atMax && !on;
        return (
          <button
            key={o}
            type="button"
            className="orx-chip"
            data-s={on ? "on" : blocked ? "max" : "off"}
            disabled={blocked}
            aria-pressed={on}
            onClick={() => onToggle(o)}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* ── Submit ──────────────────────────────────────────────────────────────── */

export function Submit({
  label,
  busy,
  disabled,
  error,
  note,
}: {
  label: string;
  busy?: boolean;
  disabled?: boolean;
  error?: string | null;
  note?: ReactNode;
}) {
  const off = busy || disabled;
  return (
    <Rise
      className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-6"
      style={{ borderTop: "1px solid var(--line)", paddingTop: 26, marginTop: 8 }}
    >
      <div style={{ ...T.fine, maxWidth: 420 }}>
        {note}
        {error && (
          <div
            className="flex items-start gap-2"
            style={{ marginTop: note ? 10 : 0, color: "var(--or)", fontWeight: 450, lineHeight: 1.55 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 4.6v4M8 11.1h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>

      <button type="submit" className="orx-btn" data-off={off} disabled={off}>
        {busy ? "Sending…" : label}
      </button>
    </Rise>
  );
}

/* ── Success ─────────────────────────────────────────────────────────────── */

export function Done({
  title,
  body,
  children,
}: {
  title: ReactNode[];
  body: ReactNode;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <motion.span
        className="inline-flex items-center justify-center"
        style={{
          width: 52,
          height: 52,
          borderRadius: 999,
          backgroundColor: "var(--or)",
          color: "#fff",
          marginBottom: 26,
          boxShadow: "0 12px 28px -10px rgba(235,69,17,0.6)",
        }}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 12.4 10.2 16.6 18 8.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.span>

      <h2>
        <Lines now delay={0.2} style={{ ...T.head, maxWidth: 640 }} lines={title} />
      </h2>

      <div style={{ ...T.lede, marginTop: 18, maxWidth: 560 }}>{body}</div>

      {children}
    </motion.div>
  );
}

export { AnimatePresence };
