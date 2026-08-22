"use client";

/**
 * Hero.
 *
 * One reading path down the left: eyebrow, statement, one sentence, actions,
 * then the three numbers that answer "what does this cost me". The credential
 * sits alongside so the claim and the evidence share a sightline.
 *
 * The only colour is a soft radial wash behind the fold and the primary button.
 */

import { motion, useReducedMotion } from "framer-motion";
import Credential from "@/components/orx/Credential";
import { Arrow, Btn, EASE, Eyebrow, L, Lines, Rise, SHELL, T } from "@/components/orx/kit";

const FACTS = [
  { v: "45 min", k: "Live review" },
  { v: "₹1,999", k: "One-time fee" },
  { v: "24 hrs", k: "Your result" },
];

function ComingSoon() {
  const reduce = useReducedMotion();
  return (
    <span
      className="inline-flex items-center gap-2.5"
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        backgroundColor: "var(--or-soft)",
      }}
    >
      <motion.span
        aria-hidden
        style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: "var(--or)", flexShrink: 0 }}
        animate={reduce ? undefined : { opacity: [1, 0.25, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--or)", letterSpacing: "-0.005em" }}>
        Coming soon
      </span>
    </span>
  );
}

export default function Hero() {
  return (
    <section id="top" className="relative" style={{ overflow: "hidden" }}>
      {/* Soft wash — the only ambient colour on the page */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 55% at 12% 0%, rgba(235,69,17,0.10) 0%, rgba(235,69,17,0) 62%)",
        }}
      />

      <div className={`${SHELL} relative pt-14 sm:pt-20 lg:pt-24 pb-20 sm:pb-24`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-14 lg:gap-x-14 items-center">
          {/* Statement */}
          <div className="lg:col-span-7">
            <Rise now className="mb-7">
              <Eyebrow>Verification for AI/ML engineers</Eyebrow>
            </Rise>

            <h1>
              <Lines
                now
                delay={0.08}
                style={{ ...T.hero, maxWidth: 700 }}
                lines={[
                  "Prove you built it.",
                  <>
                    Not just that{" "}
                    <span style={{ color: "var(--or)" }}>you pushed it.</span>
                  </>,
                ]}
              />
            </h1>

            <Rise now delay={0.34} className="mt-7" style={{ ...T.lede, maxWidth: 520 }}>
              A senior engineer reads your code, then questions you live for 45 minutes.
              Understand what you built, and you get a credential that proves it.
            </Rise>

            <Rise now delay={0.44} className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-4">
              <Btn href="/join-waitlist">Join the waitlist</Btn>
              <Arrow href="/how-it-works">See how it works</Arrow>
              <ComingSoon />
            </Rise>

            {/* Three facts, evenly spaced and large enough to read at a glance */}
            <Rise now delay={0.56} className="mt-14">
              <div
                className="grid grid-cols-3 gap-4"
                style={{ borderTop: "1px solid var(--line)", paddingTop: 22 }}
              >
                {FACTS.map((f) => (
                  <div key={f.k}>
                    <div style={{ ...T.fig, fontSize: "clamp(24px, 2.6vw, 32px)", marginBottom: 8 }}>
                      {f.v}
                    </div>
                    <L>{f.k}</L>
                  </div>
                ))}
              </div>
            </Rise>
          </div>

          {/* Artifact */}
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: EASE }}
          >
            <Credential />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
