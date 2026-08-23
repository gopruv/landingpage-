"use client";

/**
 * The scoring standard.
 *
 * Four weighted dimensions and the pass line, published plainly. Each row is a
 * single left-to-right read — name, question, weight — with the meter directly
 * under the number so the proportion registers without comparing figures.
 */

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Btn, EASE, Heading, L, Meter, Rise, Section, T, Tally } from "@/components/orx/kit";

const CRITERIA = [
  { title: "Technical depth", w: 35, asks: "Do you know why it works — not just that it does?" },
  { title: "Communication", w: 25, asks: "Can you explain your decisions under live questioning?" },
  { title: "Problem solving", w: 25, asks: "When something broke — what did you do?" },
  { title: "Reproducibility", w: 15, asks: "Could another engineer pick this up tomorrow?" },
];

function Threshold() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();

  return (
    <div ref={ref} className="orx-card p-7 sm:p-9">
      <L style={{ display: "block", marginBottom: 10 }}>Pass mark</L>

      <div className="flex items-baseline gap-3" style={{ marginBottom: 30 }}>
        <span style={{ ...T.fig, fontSize: "clamp(44px, 5vw, 60px)", color: "var(--or)" }}>60</span>
        <span style={{ ...T.lede, color: "var(--ink-3)" }}>out of 100</span>
      </div>

      {/* Scale */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            height: 10,
            borderRadius: 999,
            backgroundColor: "rgba(16,17,20,0.07)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <motion.div
            style={{
              position: "absolute",
              left: "60%",
              top: 0,
              bottom: 0,
              backgroundColor: "var(--or)",
              borderRadius: 999,
            }}
            initial={reduce ? { width: "40%" } : { width: 0 }}
            animate={seen ? { width: "40%" } : undefined}
            transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
          />
        </div>

        <motion.div
          aria-hidden
          style={{
            position: "absolute",
            left: "60%",
            top: -8,
            bottom: -8,
            width: 2,
            borderRadius: 2,
            backgroundColor: "var(--ink)",
            transform: "translateX(-1px)",
          }}
          initial={reduce ? { opacity: 1 } : { scaleY: 0, opacity: 0 }}
          animate={seen ? { scaleY: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.55, delay: 0.15, ease: EASE }}
        />
      </div>

      {/* Regions, labelled directly under the part they describe */}
      <div className="flex" style={{ marginTop: 18 }}>
        <div style={{ width: "60%", paddingRight: 16 }}>
          <div style={{ ...T.title, fontSize: 17, marginBottom: 5 }}>Below 60</div>
          <div style={{ ...T.fine }}>Written feedback on every dimension</div>
        </div>
        <div style={{ width: "40%" }}>
          <div style={{ ...T.title, fontSize: 17, marginBottom: 5, color: "var(--or)" }}>60 and above</div>
          <div style={{ ...T.fine }}>Credential issued within 24 hours</div>
        </div>
      </div>
    </div>
  );
}

export default function Standard() {
  return (
    <Section id="standard" eyebrow="The standard">
      <Heading
        lines={["Four dimensions.", "One honest score."]}
        lede="We publish the weights and the pass mark. Everyone gets written feedback — pass or fail."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-12 lg:gap-x-14 mt-14 sm:mt-16 items-start">
        {/* Rubric */}
        <div className="lg:col-span-7">
          <div className="orx-rows">
            {CRITERIA.map((c, i) => (
              <Rise
                key={c.title}
                delay={i * 0.08}
                className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-y-4 sm:gap-x-10 items-start"
                style={{ paddingTop: i === 0 ? 0 : 26, paddingBottom: 26 }}
              >
                <div>
                  <h3 style={{ ...T.title, marginBottom: 7 }}>{c.title}</h3>
                  <p style={{ ...T.body, margin: 0, maxWidth: 420 }}>{c.asks}</p>
                </div>

                <div style={{ minWidth: 132 }}>
                  <div className="flex items-baseline justify-between gap-3" style={{ marginBottom: 9 }}>
                    <L>Weight</L>
                    <span style={{ ...T.fig, fontSize: 24 }}>
                      <Tally to={c.w} dur={1.2} delay={0.2 + i * 0.08} suffix="%" />
                    </span>
                  </div>
                  <Meter value={c.w} delay={0.3 + i * 0.08} height={5} />
                </div>
              </Rise>
            ))}
          </div>
        </div>

        {/* Threshold + the point */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <Rise>
            <Threshold />
          </Rise>

          <Rise delay={0.1}>
            <div className="orx-card p-7 sm:p-8">
              <h3 style={{ ...T.title, fontSize: "clamp(21px, 1.9vw, 25px)", marginBottom: 12 }}>
                Not everyone passes.
              </h3>
              <p style={{ ...T.body, margin: 0, marginBottom: 22 }}>
                A credential everyone gets is not a credential. Around 40–60% pass, by design, and
                the standard does not move.
              </p>
              <Btn href="/join-waitlist" variant="soft">
                Join the waitlist
              </Btn>
            </div>
          </Rise>
        </div>
      </div>
    </Section>
  );
}
