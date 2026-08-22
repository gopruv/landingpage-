"use client";

/**
 * Credential — the artifact the business issues.
 *
 * A soft card rather than a ruled box: rounded, hairline border, layered
 * shadow, one orange accent on the score. Labelled a specimen, because a body
 * selling verification should never show an unmarked sample as if it were real.
 */

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { EASE, L, Meter, T, Tally } from "./kit";

const DIMENSIONS = [
  { label: "Technical depth", score: 91 },
  { label: "Communication", score: 84 },
  { label: "Problem solving", score: 79 },
  { label: "Reproducibility", score: 88 },
];

export default function Credential({ caption = true }: { caption?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();

  return (
    <div ref={ref}>
      <div className="orx-card" style={{ overflow: "hidden" }}>
        {/* Head */}
        <div
          className="flex items-center justify-between gap-4 px-6"
          style={{ height: 56, borderBottom: "1px solid var(--line)" }}
        >
          <div className="flex items-center gap-2.5">
            <svg width="15" height="15" viewBox="0 0 42 42" fill="none" aria-hidden>
              <circle cx="21" cy="21" r="20" fill="#eb4511" />
            </svg>
            <span
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                fontWeight: 600,
                fontSize: 16,
                letterSpacing: "-0.035em",
                color: "var(--ink)",
              }}
            >
              Orcred
            </span>
          </div>

          <span
            className="inline-flex items-center gap-2"
            style={{
              padding: "6px 11px",
              borderRadius: 999,
              backgroundColor: "var(--or-soft)",
              color: "var(--or)",
            }}
          >
            <span aria-hidden style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: "var(--or)" }} />
            <span style={{ fontSize: 12.5, fontWeight: 500, letterSpacing: "-0.005em" }}>Verified</span>
          </span>
        </div>

        <div className="px-6 py-7">
          {/* Subject */}
          <L style={{ display: "block", marginBottom: 9 }}>Project</L>
          <div style={{ ...T.title, fontSize: 23, marginBottom: 6 }}>RAG Pipeline</div>
          <div style={{ ...T.fine }}>LangChain · Pinecone · FastAPI</div>

          {/* Score */}
          <div
            className="flex items-end justify-between gap-4"
            style={{ marginTop: 26, marginBottom: 28 }}
          >
            <div>
              <L style={{ display: "block", marginBottom: 12 }}>Orcred score</L>
              <div className="flex items-baseline" style={{ gap: 5 }}>
                <span style={{ ...T.fig, fontSize: "clamp(56px, 6.5vw, 76px)", color: "var(--or)" }}>
                  <Tally to={87} dur={1.7} delay={0.35} />
                </span>
                <span
                  className="orx-num"
                  style={{ fontSize: 20, fontWeight: 500, color: "var(--ink-3)", letterSpacing: "-0.02em" }}
                >
                  /100
                </span>
              </div>
            </div>

            <motion.span
              className="inline-flex items-center gap-2"
              style={{
                padding: "9px 15px",
                borderRadius: 999,
                backgroundColor: "var(--or)",
                color: "#fff",
                boxShadow: "0 8px 20px -8px rgba(235,69,17,0.55)",
                flexShrink: 0,
              }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
              animate={seen ? { opacity: 1, scale: 1 } : undefined}
              transition={{ duration: 0.55, delay: 1.4, ease: EASE }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2.5 7.5 5.5 10.5 11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 13.5, fontWeight: 500, letterSpacing: "-0.01em" }}>Passed</span>
            </motion.span>
          </div>

          {/* Dimensions */}
          <div className="flex flex-col" style={{ gap: 16 }}>
            {DIMENSIONS.map((d, i) => (
              <div key={d.label}>
                <div className="flex justify-between items-baseline" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 450, color: "var(--ink-2)", letterSpacing: "-0.008em" }}>
                    {d.label}
                  </span>
                  <span
                    className="orx-num"
                    style={{ fontSize: 14.5, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em" }}
                  >
                    {d.score}
                  </span>
                </div>
                <Meter value={d.score} delay={0.5 + i * 0.12} height={5} />
              </div>
            ))}
          </div>
        </div>

        {/* Foot */}
        <div
          className="flex items-center justify-between gap-4 px-6 flex-wrap"
          style={{ height: 50, borderTop: "1px solid var(--line)", backgroundColor: "var(--bg-soft)" }}
        >
          <span style={{ ...T.fine, fontSize: 13.5 }}>Reviewed by a senior ML engineer</span>
          <span className="orx-num" style={{ ...T.fine, fontSize: 13.5 }}>ORC-2026-001</span>
        </div>
      </div>

      {caption && (
        <div className="flex items-center gap-2.5" style={{ marginTop: 14 }}>
          <span aria-hidden style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: "var(--ink-4)", flexShrink: 0 }} />
          <span style={{ ...T.fine }}>Example credential — scores are illustrative</span>
        </div>
      )}
    </div>
  );
}
