"use client";

/**
 * Questions.
 *
 * A single-column accordion on a comfortable measure. Rows are tall, targets
 * are large, and the answer opens with a grid-rows transition so nothing
 * jumps under the cursor.
 */

import { motion, useReducedMotion } from "framer-motion";
import { useId, useState } from "react";
import { Arrow, EASE, Heading, Section, T } from "@/components/orx/kit";

const QUESTIONS = [
  {
    q: "What kind of project can I submit?",
    a: "Anything you genuinely built in AI/ML — a RAG pipeline, a recommender, a vision model, an LLM app. It does not need to be perfect or deployed. It needs to be yours.",
  },
  {
    q: "I used Claude or Copilot to build it. Am I disqualified?",
    a: "No. Plenty of applicants use AI tools. We don't judge how you built it — only whether you understand it.",
  },
  {
    q: "I'm from a tier 2 college. Will that affect my score?",
    a: "Your reviewer doesn't know where you studied. They see your code, your Loom, and your decisions. Nothing else.",
  },
  {
    q: "What happens if I don't pass?",
    a: "You get specific written feedback on every dimension. Many students tell us a failed attempt gave them the most useful technical input they'd ever had. You can retry whenever you're ready.",
  },
  {
    q: "Is my project safe? Could my code be shared?",
    a: "Only your assigned reviewer sees your code. Reviewers sign a confidentiality agreement before accessing any submission — they cannot copy, share or reuse your work. Sessions are recorded for internal quality checks only, and deleted after 90 days.",
  },
  {
    q: "Who can see my credential?",
    a: "Only people you share the link with. It shows your project, tech stack, score and review date. Nothing personal.",
  },
  {
    q: "How much does it cost?",
    a: "₹1,999 per verification. No subscription, no hidden fees.",
  },
];

function Row({
  item,
  i,
  open,
  onToggle,
}: {
  item: (typeof QUESTIONS)[number];
  i: number;
  open: boolean;
  onToggle: () => void;
}) {
  const reduce = useReducedMotion();
  const panelId = `${useId()}-a`;

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: i * 0.05, ease: EASE }}
      style={{ borderTop: i === 0 ? "none" : "1px solid var(--line)" }}
    >
      <h3>
        <button
          type="button"
          className="orx-reset w-full flex items-start justify-between gap-6 text-left"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          style={{ paddingTop: 24, paddingBottom: 24 }}
        >
          <span
            style={{
              ...T.title,
              fontSize: "clamp(18px, 1.55vw, 21px)",
              color: open ? "var(--or)" : "var(--ink)",
              transition: "color .25s ease",
            }}
          >
            {item.q}
          </span>

          <span
            aria-hidden
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 30,
              height: 30,
              marginTop: 1,
              borderRadius: 999,
              backgroundColor: open ? "var(--or)" : "rgba(16,17,20,0.05)",
              color: open ? "#fff" : "var(--ink-2)",
              transform: open ? "rotate(45deg)" : "rotate(0deg)",
              transition: "transform .4s cubic-bezier(.22,1,.36,1), background-color .25s ease, color .25s ease",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.6v10.8M1.6 7h10.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
          transition: "grid-template-rows .45s cubic-bezier(.22,1,.36,1), opacity .3s ease",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <p style={{ ...T.body, margin: 0, maxWidth: 680, paddingRight: 46, paddingBottom: 26 }}>
            {item.a}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Questions() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="questions" eyebrow="Questions" soft>
      <Heading
        lines={["Questions, answered."]}
        lede="Everything students ask us before they apply."
      />

      <div className="mt-12 sm:mt-14" style={{ maxWidth: 860 }}>
        {QUESTIONS.map((item, i) => (
          <Row
            key={item.q}
            item={item}
            i={i}
            open={open === i}
            onToggle={() => setOpen(open === i ? null : i)}
          />
        ))}
      </div>

      <div className="mt-11">
        <Arrow href="/contact">Still have a question? Ask us</Arrow>
      </div>
    </Section>
  );
}
