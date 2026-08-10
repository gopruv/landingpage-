"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useState, useRef } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const steps = [
  {
    num: "01",
    title: "Submit your project",
    body: "Your GitHub, a 5-minute Loom walkthrough, three build decisions, and one honest account of what broke. That's it.",
  },
  {
    num: "02",
    title: "Pay Rs 1,999",
    body: "Payment is made at the time of registration and confirms your slot. UPI, cards, and net banking accepted.",
  },
  {
    num: "03",
    title: "We review your submission",
    body: "We check it is complete and genuine before your reviewer is assigned.",
  },
  {
    num: "04",
    title: "Get matched to a reviewer",
    body: "A senior engineer who specialises in your domain is assigned. Every reviewer in our founding cohort has a minimum of 5 years of hands-on production AI/ML engineering experience and is personally vetted by Orcred's founding team.",
  },
  {
    num: "05",
    title: "Your 45-minute live session",
    body: "On camera. Real questions. Only about your project. Your reviewer already knows your code before you join.",
  },
  {
    num: "06",
    title: "Score and credential",
    body: "Within 24 hours — your score, written feedback on every dimension, and your credential if you passed.",
  },
];

const dimensions = [
  { label: "Technical Depth",  score: 91 },
  { label: "Communication",    score: 84 },
  { label: "Problem Solving",  score: 79 },
  { label: "Reproducibility",  score: 88 },
];

/* ── Credential preview card ── */
function CredentialCard() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease }}
      style={{
        backgroundColor: "#ffffff",
        border:          "1px solid rgba(15,13,12,0.14)",
        padding:         "28px 28px 24px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="6.5" fill="#eb4511"/>
          </svg>
          <div style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "-0.01em", color: "#0f0d0c" }}>
            Orcred
          </div>
        </div>
        <div style={{ fontSize: "8px", fontWeight: 500, color: "rgba(15,13,12,0.4)", letterSpacing: "0.25em", textTransform: "uppercase" }}>
          Verified Credential
        </div>
      </div>

      {/* Top rule */}
      <div style={{ height: "1px", background: "rgba(15,13,12,0.1)", marginBottom: "20px" }} />

      {/* Project */}
      <div style={{ fontSize: "8px", fontWeight: 500, color: "rgba(15,13,12,0.4)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "5px" }}>
        Project
      </div>
      <div style={{ fontSize: "15px", fontWeight: 600, color: "#0f0d0c", letterSpacing: "-0.01em", marginBottom: "3px" }}>
        RAG Pipeline
      </div>
      <div style={{ fontSize: "11px", fontWeight: 400, color: "rgba(15,13,12,0.5)", marginBottom: "22px" }}>
        LangChain · Pinecone · FastAPI
      </div>

      {/* Score */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", marginBottom: "20px" }}>
        <div style={{ fontSize: "clamp(52px, 6vw, 68px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: "#0f0d0c" }}>
          87
        </div>
        <div style={{ fontSize: "18px", fontWeight: 400, color: "#eb4511", marginBottom: "6px", lineHeight: 1 }}>
          /100
        </div>
      </div>

      {/* Dimension bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "22px" }}>
        {dimensions.map((d, i) => (
          <div key={d.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <div style={{ fontSize: "9px", fontWeight: 500, color: "rgba(15,13,12,0.6)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {d.label}
              </div>
              <div style={{ fontSize: "9px", fontWeight: 400, color: "rgba(15,13,12,0.45)" }}>
                {d.score}
              </div>
            </div>
            <div style={{ height: "2px", background: "rgba(15,13,12,0.1)", overflow: "hidden" }}>
              <motion.div
                style={{ height: "100%", backgroundColor: "#eb4511", opacity: 0.75 }}
                initial={{ width: 0 }}
                animate={inView ? { width: `${d.score}%` } : {}}
                transition={{ duration: 1.2, delay: 0.4 + i * 0.12, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom rule */}
      <div style={{ height: "1px", background: "rgba(15,13,12,0.1)", marginBottom: "16px" }} />

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "8px", fontWeight: 400, color: "rgba(15,13,12,0.4)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Senior ML Engineer · Verified
        </div>
        <motion.div
          style={{
            border:    "1.5px solid rgba(235,69,17,0.5)",
            padding:   "4px 10px",
            transform: "rotate(-2deg)",
          }}
          initial={{ opacity: 0, scale: 1.2 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{ fontSize: "9px", fontWeight: 700, color: "#eb4511", letterSpacing: "0.4em", textTransform: "uppercase" }}>
            Passed
          </div>
        </motion.div>
      </div>

      {/* Review date */}
      <div style={{ marginTop: "12px", fontSize: "8px", fontWeight: 400, color: "rgba(15,13,12,0.3)", letterSpacing: "0.2em", textTransform: "uppercase", textAlign: "right" }}>
        Founding Cohort · May 2026
      </div>
    </motion.div>
  );
}

/* ── Section ── */
export default function ProcessSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="process" style={{ backgroundColor: "var(--bg-page)" }}>
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pt-10 pb-12 sm:pb-16">

        {/* Two-column layout on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* ── Left: steps ── */}
          <div className="lg:col-span-7">

            {/* Heading */}
            <motion.div
              style={{
                fontSize:      "clamp(22px, 2.8vw, 38px)",
                fontWeight:    400,
                letterSpacing: "-0.02em",
                lineHeight:    1.15,
                color:         "#0f0d0c",
                marginBottom:  "clamp(28px, 3vw, 40px)",
              }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease }}
            >
              Start to finish — here is what happens.
            </motion.div>

            {/* Steps */}
            <div>
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  className="flex gap-6 sm:gap-10 border-b cursor-default"
                  style={{
                    borderColor:     "var(--border)",
                    backgroundColor: hovered === i ? "rgba(235,69,17,0.055)" : "transparent",
                    transition:      "background-color 0.35s ease",
                    paddingTop:      "clamp(24px, 3vw, 36px)",
                    paddingBottom:   "clamp(24px, 3vw, 36px)",
                  }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease }}
                >
                  {/* Number box */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center select-none"
                    style={{
                      width:           "clamp(48px, 5vw, 58px)",
                      height:          "clamp(48px, 5vw, 58px)",
                      backgroundColor: "#eb4511",
                      fontWeight:      700,
                      fontSize:        "clamp(16px, 1.6vw, 20px)",
                      letterSpacing:   "-0.02em",
                      color:           "#ffffff",
                      lineHeight:      1,
                    }}
                  >
                    {step.num}
                  </div>

                  {/* Content */}
                  <div className="flex-1" style={{ paddingTop: "4px" }}>
                    <div style={{ fontWeight: 600, fontSize: "clamp(16px, 1.5vw, 20px)", color: "#0f0d0c", letterSpacing: "-0.015em", lineHeight: 1.25, marginBottom: "10px" }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: "clamp(14px, 1.1vw, 15px)", lineHeight: 1.85, color: "rgba(15,13,12,0.62)", fontWeight: 400 }}>
                      {step.body}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8">
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 font-label-sm uppercase tracking-[0.2em] text-[11px] transition-all duration-200"
                style={{ border: "1px solid #0f0d0c", backgroundColor: "transparent", color: "#0f0d0c", borderRadius: "50px", transition: "opacity 0.15s ease" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "0.6")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
              >
                See the Full Process
                <span style={{ letterSpacing: 0, color: "inherit" }}>→</span>
              </Link>
            </div>
          </div>

          {/* ── Right: credential card (sticky on desktop) ── */}
          <div className="lg:col-span-5 lg:sticky lg:top-[100px]">
            <CredentialCard />
          </div>

        </div>
      </div>
    </section>
  );
}
