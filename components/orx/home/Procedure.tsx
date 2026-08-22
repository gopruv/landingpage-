"use client";

/**
 * Procedure.
 *
 * Six steps down one column with a connecting line, so the order is obvious
 * without reading the numbers. The line inks in as you scroll and each marker
 * fills as you reach it — the one scroll-linked animation on the page, and it
 * answers the question the section exists to answer.
 */

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";
import { Arrow, EASE, Heading, Rise, Section, T } from "@/components/orx/kit";

const STEPS = [
  {
    who: "You",
    title: "Submit your project",
    body: "Your GitHub, a 5-minute Loom walkthrough, three build decisions, and one honest account of what broke.",
  },
  {
    who: "Orcred",
    title: "We check your submission",
    body: "We confirm it is complete and genuine before assigning a reviewer.",
  },
  {
    who: "Orcred",
    title: "You're matched to a reviewer",
    body: "A senior engineer in your domain — minimum 5 years hands-on production AI/ML, personally vetted by our team.",
  },
  {
    who: "Both",
    title: "Your 45-minute session",
    body: "On camera. Real questions, only about your project. Your reviewer already knows your code.",
  },
  {
    who: "Reviewer",
    title: "Score and credential",
    body: "Within 24 hours — your score, written feedback on every dimension, and your credential if you passed.",
  },
];

export default function Procedure() {
  const railRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [done, setDone] = useState(0);

  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 76%", "end 68%"],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 110, damping: 30, restDelta: 0.001 });
  const scaleY = useTransform(fill, [0, 1], [0, 1]);

  useMotionValueEvent(fill, "change", (v) => {
    const next = Math.min(STEPS.length, Math.floor(v * STEPS.length + 0.45));
    setDone((p) => (p === next ? p : next));
  });

  return (
    <Section id="procedure" eyebrow="Process" soft>
      <Heading
        lines={["Start to finish, in five steps."]}
        lede="You always know what stage you're at, and who acts next."
      />

      <div ref={railRef} className="relative mt-14 sm:mt-16" style={{ maxWidth: 780 }}>
        {/* Connector */}
        <div
          aria-hidden
          className="absolute"
          style={{ left: 17, top: 26, bottom: 40, width: 2, borderRadius: 2, backgroundColor: "var(--line-2)" }}
        />
        <motion.div
          aria-hidden
          className="absolute"
          style={{
            left: 17,
            top: 26,
            bottom: 40,
            width: 2,
            borderRadius: 2,
            backgroundColor: "var(--or)",
            transformOrigin: "top center",
            scaleY: reduce ? 1 : scaleY,
          }}
        />

        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {STEPS.map((s, i) => {
            const on = reduce ? true : i < done;
            return (
              <motion.li
                key={s.title}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.75, delay: 0.04, ease: EASE }}
                className="relative flex gap-5 sm:gap-7"
                style={{ paddingBottom: i === STEPS.length - 1 ? 0 : 34 }}
              >
                {/* Marker */}
                <span
                  className="flex items-center justify-center flex-shrink-0 orx-num"
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    backgroundColor: on ? "var(--or)" : "var(--surface)",
                    border: `1px solid ${on ? "var(--or)" : "var(--line-2)"}`,
                    color: on ? "#fff" : "var(--ink-3)",
                    fontSize: 14,
                    fontWeight: 500,
                    boxShadow: on ? "0 6px 16px -6px rgba(235,69,17,0.5)" : "var(--sh-1)",
                    transition:
                      "background-color .5s cubic-bezier(.22,1,.36,1), border-color .5s ease, color .5s ease, box-shadow .5s ease",
                  }}
                >
                  {i + 1}
                </span>

                {/* Body */}
                <div className="min-w-0" style={{ paddingTop: 5 }}>
                  <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 8 }}>
                    <h3 style={{ ...T.title }}>{s.title}</h3>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: "var(--ink-3)",
                        padding: "4px 9px",
                        borderRadius: 999,
                        backgroundColor: "rgba(16,17,20,0.05)",
                      }}
                    >
                      {s.who}
                    </span>
                  </div>
                  <p style={{ ...T.body, margin: 0, maxWidth: 560 }}>{s.body}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>

      <Rise className="mt-12">
        <Arrow href="/how-it-works">Read the full process</Arrow>
      </Rise>
    </Section>
  );
}
