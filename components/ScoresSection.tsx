"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/* ── Original inline SVG icons — no font dependency, no copyright ── */
const icons = {
  // Two angle-brackets < > = universally understood as "code / technical"
  TechnicalDepth: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="7,4 2,10 7,16"/>
      <polyline points="13,4 18,10 13,16"/>
    </svg>
  ),
  // Speech bubble with two text lines = communication
  Communication: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h16v10H11l-3 4-1-4H2z"/>
      <line x1="6" y1="7" x2="14" y2="7"/>
      <line x1="6" y1="10" x2="10" y2="10"/>
    </svg>
  ),
  // Two-arrow cycle = reproducible / repeatable
  Reproducibility: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 9A6.5 6.5 0 0115 4.5"/>
      <polyline points="18,2 15,4.5 18,7"/>
      <path d="M16.5 11A6.5 6.5 0 015 15.5"/>
      <polyline points="2,18 5,15.5 2,13"/>
    </svg>
  ),
  // Six-ray spark / asterisk = original idea / unique
  ProblemSolving: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="10" y1="2"   x2="10" y2="18"/>
      <line x1="2"  y1="10"  x2="18" y2="10"/>
      <line x1="4.3" y1="4.3" x2="15.7" y2="15.7"/>
      <line x1="15.7" y1="4.3" x2="4.3" y2="15.7"/>
    </svg>
  ),
};

const criteria = [
  {
    Icon: icons.TechnicalDepth,
    title: "Technical Depth",
    weight: "35%",
    desc: "Do you know why it works — not just that it does?",
  },
  {
    Icon: icons.Communication,
    title: "Communication",
    weight: "25%",
    desc: "Can you explain your decisions clearly under live questioning?",
  },
  {
    Icon: icons.ProblemSolving,
    title: "Problem Solving",
    weight: "25%",
    desc: "When something broke — what did you do?",
  },
  {
    Icon: icons.Reproducibility,
    title: "Reproducibility",
    weight: "15%",
    desc: "Could another engineer pick this up tomorrow?",
  },
];

export default function ScoresSection() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section
      id="scores"
      className="py-16 sm:py-20 px-6 sm:px-10 lg:px-16"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      <div className="max-w-[1400px] mx-auto">

        {/* Main heading — same size as PlatformSection headlines */}
        <motion.div
          className="mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease }}
        >
          <div
            style={{
              fontSize:      "clamp(22px, 2.8vw, 38px)",
              fontWeight:    400,
              letterSpacing: "-0.02em",
              lineHeight:    1.1,
              color:         "#0f0d0c",
              marginBottom:  "12px",
            }}
          >
            Four dimensions. One honest score.
          </div>
          <div
            style={{
              fontSize:   "clamp(14px, 1.2vw, 16px)",
              fontWeight: 400,
              lineHeight: 1.7,
              color:      "rgba(15,13,12,0.55)",
              maxWidth:   "480px",
            }}
          >
            Pass threshold: 60 out of 100. Everyone gets written feedback — pass or fail.
          </div>
        </motion.div>

        {/* 2-column criteria grid */}
        <div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-20 gap-y-10 sm:gap-y-12"
        >
          {criteria.map((c, i) => (
            <motion.div
              key={c.title}
              className="flex gap-5"
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.1, ease }}
            >
              {/* Icon in orange circle */}
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width:        "48px",
                  height:       "48px",
                  borderRadius: "50%",
                  border:       "1.5px solid #eb4511",
                  color:        "#eb4511",
                  marginTop:    "2px",
                }}
              >
                <c.Icon />
              </div>

              {/* Content */}
              <div className="flex-1">
                {/* Title + weight */}
                <div className="flex items-baseline gap-3 mb-2">
                  <div
                    style={{
                      fontSize:      "clamp(15px, 1.3vw, 17px)",
                      fontWeight:    600,
                      letterSpacing: "-0.01em",
                      lineHeight:    1.3,
                      color:         "#0f0d0c",
                    }}
                  >
                    {c.title}
                  </div>
                  <div
                    className="font-label-sm uppercase tracking-[0.15em]"
                    style={{ color: "#eb4511", opacity: 0.9, flexShrink: 0, fontSize: "13px", fontWeight: 500 }}
                  >
                    {c.weight}
                  </div>
                </div>

                {/* Body */}
                <div
                  style={{
                    fontSize:   "clamp(13px, 1.1vw, 14px)",
                    fontWeight: 400,
                    lineHeight: 1.85,
                    color:      "rgba(15,13,12,0.6)",
                  }}
                >
                  {c.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tagline */}
        <motion.div
          className="mt-14 sm:mt-16 flex items-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="w-8 h-px" style={{ backgroundColor: "#eb4511", opacity: 0.7 }} />
          <div
            style={{
              fontSize:      "clamp(13px, 1.2vw, 15px)",
              fontWeight:    400,
              fontStyle:     "italic",
              color:         "rgba(180,45,5,0.75)",
              letterSpacing: "0.01em",
            }}
          >
            Not everyone passes. That&apos;s the point.
          </div>
        </motion.div>

      </div>
    </section>
  );
}
