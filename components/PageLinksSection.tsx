"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

/* ── Original SVG motifs — one per card ── */

// Contact Us: simple speech bubble outline
function ContactVisual() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 320 180" fill="none" preserveAspectRatio="xMidYMid meet">
      {/* Bubble */}
      <rect x="100" y="54" width="120" height="76" rx="4"
        stroke="rgba(235,69,17,0.6)" strokeWidth="1.5" />
      {/* Tail */}
      <polyline points="122,130 112,148 138,130"
        stroke="rgba(235,69,17,0.6)" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Lines inside */}
      <line x1="120" y1="80"  x2="200" y2="80"  stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="120" y1="96"  x2="200" y2="96"  stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="120" y1="112" x2="168" y2="112" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// Become a Reviewer: code chevrons < > (same motif as ScoresSection icon)
function ReviewerVisual() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 320 180" fill="none" preserveAspectRatio="xMidYMid meet">
      {/* Left chevron */}
      <polyline points="128,62 88,90 128,118"
        stroke="#eb4511" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right chevron */}
      <polyline points="192,62 232,90 192,118"
        stroke="#eb4511" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Slash */}
      <line x1="172" y1="56" x2="148" y2="124"
        stroke="rgba(235,69,17,0.45)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const cards = [
  {
    href:    "/contact",
    title:   "Contact Us",
    desc:    "Questions about verification, the process, or pricing. Reach us directly — every message is read by a founder.",
    cta:     "Get in touch",
    Visual:  ContactVisual,
  },
  {
    href:    "/contact",
    title:   "Become a Reviewer",
    desc:    "Senior engineer with 5+ years in AI/ML? Five founding reviewer spots remain. Join us and help set the standard.",
    cta:     "Apply",
    Visual:  ReviewerVisual,
  },
];

export default function PageLinksSection() {
  return (
    <section
      className="px-6 sm:px-10 lg:px-16 pb-16 sm:pb-20"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      <div className="max-w-[1400px] mx-auto">

        {/* Divider */}
        <div className="w-full h-px mb-12 sm:mb-16" style={{ background: "var(--border)" }} />

        {/* Cards */}
        <div className="flex flex-col md:flex-row justify-center gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              className="w-full md:w-[300px] lg:w-[320px] flex-shrink-0"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease }}
            >
              <Link
                href={card.href}
                className="group flex flex-col h-full"
                style={{
                  textDecoration:  "none",
                  border:          "1px solid rgba(15,13,12,0.14)",
                  backgroundColor: "#ffffff",
                }}
              >
                {/* Visual panel */}
                <div
                  className="relative overflow-hidden"
                  style={{
                    height:          "160px",
                    backgroundColor: "#0f0d0c",
                  }}
                >
                  <card.Visual />
                  {/* Subtle orange tint on hover */}
                  <div
                    className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                    style={{ backgroundColor: "rgba(235,69,17,0.06)" }}
                  />
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 p-5">

                  <div style={{ fontWeight: 600, fontSize: "15px", letterSpacing: "-0.01em", lineHeight: 1.2, color: "#0f0d0c", marginBottom: "8px" }}>
                    {card.title}
                  </div>

                  <div style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.75, color: "rgba(15,13,12,0.55)", marginBottom: "16px", flex: 1 }}>
                    {card.desc}
                  </div>

                  <div
                    className="flex items-center gap-1.5 font-label-sm uppercase tracking-[0.15em] text-[10px]"
                    style={{ color: "#eb4511", fontWeight: 600 }}
                  >
                    {card.cta}
                    <span style={{ letterSpacing: 0 }}>→</span>
                  </div>

                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
