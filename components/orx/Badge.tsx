"use client";

/**
 * Badge — the mark Orcred issues.
 *
 * Same card family as the credential: issuer strip with the Verified pill, a
 * labelled body, a footer carrying the reference. A badge and a credential
 * should read as coming from one issuer, not as two unrelated graphics.
 *
 * Every dimension is expressed in `cqw` against the card's own container, so
 * the whole thing scales with whatever width it is actually given — not with
 * the `width` cap. A fixed scale factor would size the type for the maximum
 * and cramp it the moment the column got narrower.
 *
 * Absent by design: the score, because a public badge showing 64 is a badge
 * nobody shares — the published pass mark of 60 already means the bar was
 * cleared. And the holder's name, because sharing resolves to the credential
 * page, and three projects would otherwise print the name three times.
 */

import { motion, useReducedMotion } from "framer-motion";
import { EASE, Mark, T } from "./kit";

/** The width the proportions below were drawn at. */
const BASE = 260;

export default function Badge({
  project = "RAG Pipeline",
  stack = "LangChain · Pinecone · FastAPI",
  id = "ORC-2026-001",
  width = 380,
  caption = true,
}: {
  project?: string;
  stack?: string;
  id?: string;
  width?: number;
  caption?: boolean;
}) {
  const reduce = useReducedMotion();
  /** A length from the BASE drawing, expressed against the card's own width. */
  const q = (px: number) => `${((px / BASE) * 100).toFixed(3)}cqw`;
  const pad = q(18);

  return (
    <div style={{ width: "100%", maxWidth: width }}>
      <div style={{ containerType: "inline-size" }}>
      <motion.div
        className="orx-card"
        style={{
          overflow: "hidden",
          /* The head rule is the card's own top border, not a child div — a
             child clips to the padding box and its square ends would overhang
             the corner radius. A border follows the curve. */
          borderTop: `${q(4)} solid var(--or)`,
          borderRadius: q(20),
        }}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.85, ease: EASE }}
      >
        {/* Issuer */}
        <div
          className="flex items-center justify-between gap-2"
          style={{ height: q(52), paddingLeft: pad, paddingRight: pad, borderBottom: "1px solid var(--line)" }}
        >
          <Mark size={18} u={q} />

          <span
            className="inline-flex items-center flex-shrink-0"
            style={{
              gap: q(6),
              padding: `${q(4.5)} ${q(9.5)}`,
              borderRadius: 999,
              backgroundColor: "var(--or-soft)",
              color: "var(--or)",
            }}
          >
            <span aria-hidden style={{ width: q(4.5), height: q(4.5), borderRadius: 999, backgroundColor: "var(--or)" }} />
            <span style={{ fontSize: q(12), fontWeight: 500, letterSpacing: "-0.005em" }}>Verified</span>
          </span>
        </div>

        {/* Mark above the subject */}
        <div style={{ paddingLeft: pad, paddingRight: pad, paddingTop: q(26), paddingBottom: q(26) }}>
          <motion.svg
            viewBox="0 0 100 100" fill="none" aria-hidden
            initial={reduce ? {} : { scale: 0.86, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
            style={{ display: "block", width: q(66), height: q(66), marginBottom: q(24) }}
          >
            <circle cx="50" cy="50" r="50" fill="#eb4511" />
            <motion.path
              d="M 29 51 l 14.5 14.5 L 71 34.5"
              stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"
              initial={reduce ? {} : { pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, delay: 0.5, ease: EASE }}
            />
          </motion.svg>

          <span
            className="orx-label"
            style={{ display: "block", fontSize: q(11.5), marginBottom: q(9) }}
          >
            Project
          </span>
          <div
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontWeight: 500,
              fontSize: q(20),
              letterSpacing: "-0.024em",
              lineHeight: 1.2,
              color: "var(--ink)",
              marginBottom: q(6),
            }}
          >
            {project}
          </div>
          <div style={{ ...T.fine, fontSize: q(13), lineHeight: 1.5 }}>{stack}</div>
        </div>

        {/* Reference */}
        <div
          className="flex items-center"
          style={{ height: q(46), paddingLeft: pad, paddingRight: pad, borderTop: "1px solid var(--line)" }}
        >
          <span className="orx-num" style={{ ...T.fine, fontSize: q(12.5), whiteSpace: "nowrap" }}>{id}</span>
        </div>
      </motion.div>
      </div>

      {caption && (
        <div className="flex items-center gap-2.5" style={{ marginTop: 14 }}>
          <span aria-hidden style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: "var(--ink-4)", flexShrink: 0 }} />
          <span style={{ ...T.fine }}>Example badge</span>
        </div>
      )}
    </div>
  );
}
