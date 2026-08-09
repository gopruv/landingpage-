"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const faqs = [
  {
    q: "What kind of project can I submit?",
    a: "Anything you genuinely built in the AI/ML space — a RAG pipeline, a recommendation system, a computer vision model, an LLM app, anything. It doesn't need to be perfect. It doesn't need to be deployed. It just needs to be yours.",
  },
  {
    q: "I used Claude or Copilot to help build it. Am I disqualified?",
    a: "Not at all. Half the engineers applying probably used AI tools — and that's fine. We're not here to judge how you built it. We want to know if you understand it. That's the only question that matters.",
  },
  {
    q: "I'm from a tier 2 college. Will that affect my score?",
    a: "Your reviewer doesn't know where you studied. They see your code, your Loom, your decisions — nothing else. The score reflects your understanding and nothing else. That's the whole point of Orcred.",
  },
  {
    q: "What if I fail?",
    a: "You get honest, specific written feedback on exactly what to improve — per dimension, specific to your project. A lot of students tell us the feedback from a failed attempt was the most useful technical input they ever got. You can try again whenever you feel ready.",
  },
  {
    q: "Is my project safe? Will my code be shared or leaked?",
    a: "Your code is only seen by your assigned reviewer — no one else. Reviewers sign a strict confidentiality agreement before accessing any submission. They cannot copy, share, clone, or use your code in any way. Sessions are recorded only for internal quality checks and deleted after 90 days. We will never share your submission, your score, or anything about your session with anyone outside Orcred.",
  },
  {
    q: "Who sees my credential?",
    a: "Only people you share it with. Your credential page is public only if you share the link — it doesn't appear anywhere without your action. What shows is your project name, tech stack, score, and review date. Nothing personal.",
  },
  {
    q: "How much does it cost?",
    a: "Rs 1,999 per verification. No subscription, no hidden fees. Less than a weekend course — and more useful than most certifications.",
  },
];

export default function FaqSection() {
  const [open, setOpen]       = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="py-16 sm:py-20 px-6 sm:px-10 lg:px-16"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      <div className="max-w-[1400px] mx-auto">

        {/* Heading */}
        <motion.div
          className="mb-10 sm:mb-12"
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
              lineHeight:    1.15,
              color:         "#0f0d0c",
              marginBottom:  "12px",
            }}
          >
            Questions, answered.
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
            Everything students ask us before they apply.
          </div>
        </motion.div>

        {/* Rows */}
        <div>
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                className="border-b"
                style={{
                  borderColor:     "var(--border)",
                  backgroundColor: hovered === i && !isOpen ? "rgba(235,69,17,0.055)" : "transparent",
                  transition:      "background-color 0.35s ease",
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.7, delay: i * 0.06, ease }}
              >
                {/* Question row */}
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-start gap-6 sm:gap-10 text-left"
                  style={{
                    background:    "transparent",
                    border:        "none",
                    cursor:        "pointer",
                    paddingLeft:   0,
                    paddingRight:  0,
                    paddingTop:    "clamp(20px, 2.4vw, 28px)",
                    paddingBottom: "clamp(20px, 2.4vw, 28px)",
                  }}
                >
                  <div
                    className="flex-1"
                    style={{
                      fontWeight:    600,
                      fontSize:      "clamp(15px, 1.4vw, 18px)",
                      color:         "#0f0d0c",
                      letterSpacing: "-0.015em",
                      lineHeight:    1.35,
                    }}
                  >
                    {item.q}
                  </div>

                  {/* Plus / minus */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      width:        "26px",
                      height:       "26px",
                      color:        "#eb4511",
                      marginTop:    "1px",
                      transform:    isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      transition:   "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
                      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <line x1="7.5" y1="1.5" x2="7.5" y2="13.5" />
                      <line x1="1.5" y1="7.5" x2="13.5" y2="7.5" />
                    </svg>
                  </div>
                </button>

                {/* Answer — grid-rows 0fr→1fr gives a smooth CSS-only slide open */}
                <div
                  style={{
                    display:          "grid",
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    opacity:          isOpen ? 1 : 0,
                    transition:       "grid-template-rows 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
                  }}
                >
                  <div style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize:      "clamp(14px, 1.1vw, 15px)",
                        fontWeight:    400,
                        lineHeight:    1.85,
                        color:         "rgba(15,13,12,0.62)",
                        maxWidth:      "760px",
                        paddingRight:  "56px",
                        paddingBottom: "clamp(22px, 2.6vw, 30px)",
                      }}
                    >
                      {item.a}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
