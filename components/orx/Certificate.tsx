"use client";

/**
 * Certificate — the formal document.
 *
 * Sibling to the badge, and deliberately carries different things. A
 * certificate names the holder, the credential, the date and who signed it.
 * It does not carry the dimensional breakdown: a degree certificate does not
 * print your per-module marks, and neither should this. That analysis is the
 * score report, a separate document.
 *
 * The overall score stays, once, because it is the substance of what Orcred
 * attests to — but it is stated in a sentence rather than charted.
 *
 * Built to the shape of the PDF it becomes: square corners and an exact A4
 * landscape ratio (√2:1). The border and shadow here are screen chrome so the
 * sheet reads as paper on a white page — they are not part of the document.
 */

import { motion, useReducedMotion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { EASE, Mark, T } from "./kit";

/** A drawn flourish — a specimen signature, not anyone's real mark. */
function Flourish({ w }: { w: number }) {
  const reduce = useReducedMotion();
  return (
    <svg width={w} height={w * 0.3} viewBox="0 0 120 36" fill="none" aria-hidden>
      <motion.path
        d="M4 26c8-14 13-19 17-18 4 1 1 12-2 17-3 5-6 6-7 4-2-3 3-10 10-14 6-4 12-6 15-3 3 3-2 9-5 12-2 3-2 5 1 5 5 0 12-6 18-13 5-6 9-11 12-10 3 1 0 8-3 13-2 4-3 7-1 8 3 1 9-3 15-9"
        stroke="var(--ink)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0.9 }}
        whileInView={{ pathLength: 1, opacity: 0.9 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: reduce ? 0.3 : 1.8, delay: 0.5, ease: "easeInOut" }}
      />
    </svg>
  );
}

export default function Certificate({
  name = "Priya Sharma",
  project = "RAG Pipeline",
  stack = "LangChain · Pinecone · FastAPI",
  score = 87,
  date = "12 May 2026",
  id = "ORC-2026-001",
  signatory = "Pragathi S A",
  signatoryRole = "Founder, Orcred",
  /** Where the QR resolves. Defaults to this credential's verification page. */
  verifyUrl,
  /** Width. Height follows a landscape document ratio. */
  size = 720,
  caption = true,
}: {
  name?: string;
  project?: string;
  stack?: string;
  score?: number;
  date?: string;
  id?: string;
  signatory?: string;
  signatoryRole?: string;
  verifyUrl?: string;
  size?: number;
  caption?: boolean;
}) {
  const reduce = useReducedMotion();
  const pad = size * 0.075;
  const u = size / 720; // scale unit, so every value below reads at 720px
  const url = verifyUrl ?? `https://orcred.com/verify/${id}`;

  return (
    <div className="flex flex-col" style={{ width: size }}>
      <motion.div
        style={{
          width: size,
          height: size / Math.SQRT2, // A4 landscape
          overflow: "hidden",
          position: "relative",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--line-2)",
          borderRadius: 0,             // it is a document, not a UI card
          boxShadow: "var(--sh-3)",    // screen only — reads as paper on a page
        }}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        {/* Head rule — the only colour above the fold of the document */}
        <div style={{ height: 4 * u, backgroundColor: "var(--or)" }} />

        <div style={{ padding: pad, height: `calc(100% - ${4 * u}px)`, display: "flex", flexDirection: "column" }}>
          {/* Issuer + reference */}
          <div className="flex items-center justify-between gap-4">
            <Mark size={23} u={(n) => n * u} />

            <span
              className="orx-num"
              style={{ fontSize: 12 * u, fontWeight: 500, color: "var(--ink-3)", letterSpacing: "0.04em" }}
            >
              {id}
            </span>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col justify-center" style={{ paddingTop: 12 * u }}>
            <span
              style={{
                fontSize: 11.5 * u,
                fontWeight: 500,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
            >
              Certificate of Verification
            </span>

            <span style={{ fontSize: 14 * u, color: "var(--ink-3)", marginTop: 22 * u }}>
              This certifies that
            </span>

            <span
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                fontWeight: 500,
                fontSize: 44 * u,
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                color: "var(--ink)",
                marginTop: 8 * u,
              }}
            >
              {name}
            </span>

            <span
              style={{
                fontSize: 15 * u,
                lineHeight: 1.6,
                color: "var(--ink-2)",
                marginTop: 16 * u,
                maxWidth: 520 * u,
              }}
            >
              was verified in a live technical review on{" "}
              <span style={{ color: "var(--ink)", fontWeight: 500 }}>{project}</span>
              {stack && (
                /* Bind each separator to the word before it so a line never opens
                   with a stray middot when the stack wraps. */
                <span style={{ color: "var(--ink-3)" }}> ({stack.replace(/ · /g, "\u00a0\u00b7 ")})</span>
              )}, scoring{" "}
              <span style={{ color: "var(--or)", fontWeight: 500 }}>{score} out of 100</span>.
            </span>
          </div>

          {/* Attestation */}
          <div className="flex items-end justify-between gap-8" style={{ paddingTop: 10 * u }}>
            <div style={{ minWidth: 190 * u }}>
              <Flourish w={120 * u} />
              <div style={{ borderTop: "1px solid var(--ink-4)", paddingTop: 8 * u, marginTop: 2 * u }}>
                <div style={{ fontSize: 14 * u, fontWeight: 500, color: "var(--ink)" }}>{signatory}</div>
                <div style={{ fontSize: 12.5 * u, color: "var(--ink-3)", marginTop: 2 * u }}>{signatoryRole}</div>
              </div>
            </div>

            <div className="text-right" style={{ minWidth: 150 * u }}>
              <div style={{ height: 120 * u * 0.3 }} />
              <div style={{ borderTop: "1px solid var(--ink-4)", paddingTop: 8 * u, marginTop: 2 * u }}>
                <div style={{ fontSize: 14 * u, fontWeight: 500, color: "var(--ink)" }}>{date}</div>
                <div style={{ fontSize: 12.5 * u, color: "var(--ink-3)", marginTop: 2 * u }}>Date of issue</div>
              </div>
            </div>

            {/* Scans to the verification page — the part that makes a printed
                certificate checkable rather than just decorative. High error
                correction so it still reads if the print is imperfect. */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ gap: 7 * u }}>
              <QRCodeSVG
                value={url}
                size={Math.round(74 * u)}
                level="H"
                bgColor="transparent"
                fgColor="#0e0f12"
                marginSize={0}
              />
              <span
                style={{
                  fontSize: 9.5 * u,
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                }}
              >
                Scan to verify
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {caption && (
        <span style={{ ...T.fine, marginTop: 16 }}>
          Example certificate — details are illustrative
        </span>
      )}
    </div>
  );
}
