"use client";

/**
 * Badge — the mark Orcred issues.
 *
 * Deliberately not the credential record. A badge answers one question at a
 * glance: verified, on what, how strongly. Everything else — the holder, the
 * four dimensions, the reviewer, the date — belongs on the credential page the
 * badge links to.
 *
 * The holder's name is intentionally absent. Every issuer that does this well
 * (CFA, AWS, Google) keeps the badge identical for everyone who earned it and
 * puts the name on the verification page: sharing resolves to the page rather
 * than the image, and a person with three verified projects would otherwise
 * get their name repeated three times.
 */

import { motion, useReducedMotion } from "framer-motion";
import { EASE, T, Tally } from "./kit";

export default function Badge({
  score = 87,
  project = "RAG Pipeline",
  /** Card width. Height is derived to keep it portrait. */
  size = 260,
  caption = true,
}: {
  score?: number;
  project?: string;
  size?: number;
  caption?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="orx-card flex flex-col"
        style={{ width: size, height: size * 1.42, overflow: "hidden" }}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.85, ease: EASE }}
      >
        {/* Issuer */}
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            gap: size * 0.042,
            height: size * 0.23,
            borderBottom: "1px solid var(--line)",
          }}
        >
          <svg width={size * 0.082} height={size * 0.082} viewBox="0 0 42 42" fill="none" aria-hidden>
            <circle cx="21" cy="21" r="20" fill="#eb4511" />
          </svg>
          <span
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontWeight: 600,
              fontSize: size * 0.095,
              letterSpacing: "-0.035em",
              color: "var(--ink)",
              lineHeight: 1,
            }}
          >
            Orcred
          </span>
        </div>

        {/* Score, then what it was earned on */}
        <div
          className="flex-1 flex flex-col items-center justify-center text-center"
          style={{ padding: `${size * 0.06}px ${size * 0.09}px` }}
        >
          <span
            className="inline-flex items-baseline justify-center"
            style={{
              gap: 1,
              padding: `${size * 0.055}px ${size * 0.1}px`,
              borderRadius: 999,
              backgroundColor: "var(--or)",
              color: "#fff",
              boxShadow: "0 10px 24px -10px rgba(235,69,17,0.6)",
            }}
          >
            <span
              className="orx-num"
              style={{ fontSize: size * 0.165, fontWeight: 600, letterSpacing: "-0.035em" }}
            >
              <Tally to={score} dur={1.5} delay={0.3} />
            </span>
            <span className="orx-num" style={{ fontSize: size * 0.08, opacity: 0.82 }}>
              /100
            </span>
          </span>

          <span
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontWeight: 500,
              fontSize: size * 0.088,
              letterSpacing: "-0.024em",
              lineHeight: 1.25,
              color: "var(--ink)",
              marginTop: size * 0.155,
            }}
          >
            {project}
          </span>
        </div>

        {/* Assertion */}
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            gap: size * 0.03,
            height: size * 0.19,
            borderTop: "1px solid var(--line)",
            backgroundColor: "var(--bg-soft)",
          }}
        >
          <svg
            width={size * 0.055}
            height={size * 0.055}
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden
            style={{ color: "var(--or)" }}
          >
            <path
              d="M2.5 7.4 5.5 10.4 11.5 3.9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontSize: size * 0.05,
              fontWeight: 500,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: "var(--ink-2)",
            }}
          >
            Verified
          </span>
        </div>
      </motion.div>

      {caption && (
        <span style={{ ...T.fine, marginTop: 16, textAlign: "center" }}>
          Example badge — score is illustrative
        </span>
      )}
    </div>
  );
}
