"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const rows = [
  {
    platform: "GitHub",
    proves:   "You pushed code.",
    misses:   "Whether you understand it.",
    highlight: false,
  },
  {
    platform: "LeetCode",
    proves:   "You solve puzzles.",
    misses:   "Whether you can build systems.",
    highlight: false,
  },
  {
    platform: "Certificates",
    proves:   "You finished a course.",
    misses:   "Whether you can apply it.",
    highlight: false,
  },
  {
    platform: "Orcred",
    proves:   "You understand what you built.",
    misses:   "Nothing.",
    highlight: true,
  },
];

export default function ComparisonSection() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section
      id="comparison"
      className="py-16 sm:py-20 px-6 sm:px-10 lg:px-16"
      style={{ backgroundColor: "var(--bg-alt)" }}
    >
      <div className="max-w-[1400px] mx-auto">

        {/* Heading */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 14 }}
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
            }}
          >
            Every credential leaves one question unanswered.
          </div>
        </motion.div>

        {/* Intro */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, delay: 0.1, ease }}
        >
          <div
            style={{
              fontSize:   "clamp(13px, 1.1vw, 15px)",
              fontWeight: 400,
              lineHeight: 1.8,
              color:      "rgba(15,13,12,0.55)",
              maxWidth:   "560px",
            }}
          >
            GitHub shows commits. LeetCode shows patterns. Certificates show completions.
            None of them answer the one question that matters: does this person understand what they built?
          </div>
        </motion.div>

        {/* Table */}
        <div ref={ref} className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: "480px" }}>

            {/* Column headers */}
            <thead>
              <tr style={{ borderBottom: "2px solid rgba(15,13,12,0.15)" }}>
                <th className="text-left pb-4 pr-8 w-[28%]"
                  style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#0f0d0c" }}>
                </th>
                <th className="text-left pb-4 pr-8 w-[36%]"
                  style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#0f0d0c" }}>
                  What it proves
                </th>
                <th className="text-left pb-4 w-[36%]"
                  style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#0f0d0c" }}>
                  What it misses
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, i) => (
                <motion.tr
                  key={row.platform}
                  style={{ borderBottom: "1px solid rgba(15,13,12,0.1)" }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                >
                  {/* Platform */}
                  <td className="py-6 pr-8 align-top">
                    <div style={{
                      fontSize:      "clamp(18px, 2.2vw, 26px)",
                      fontWeight:    row.highlight ? 600 : 400,
                      letterSpacing: "-0.01em",
                      lineHeight:    1,
                      color:         row.highlight ? "#eb4511" : "rgba(15,13,12,0.5)",
                    }}>
                      {row.platform}
                    </div>
                  </td>

                  {/* Proves */}
                  <td className="py-6 pr-8 align-top">
                    <div style={{
                      fontSize:   "clamp(13px, 1.1vw, 14px)",
                      fontWeight: row.highlight ? 500 : 400,
                      lineHeight: 1.7,
                      color:      row.highlight ? "#0f0d0c" : "rgba(15,13,12,0.5)",
                    }}>
                      {row.proves}
                    </div>
                  </td>

                  {/* Misses */}
                  <td className="py-6 align-top">
                    <div style={{
                      fontSize:   "clamp(13px, 1.1vw, 14px)",
                      fontWeight: 400,
                      lineHeight: 1.7,
                      color:      row.highlight ? "rgba(180,45,5,0.8)" : "rgba(15,13,12,0.4)",
                    }}>
                      {row.misses}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tagline */}
        <motion.div
          className="mt-10 flex items-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="w-8 h-px" style={{ backgroundColor: "#eb4511", opacity: 0.7 }} />
          <div style={{
            fontSize: "clamp(12px, 1.1vw, 14px)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "rgba(15,13,12,0.45)",
          }}>
            One conversation changes the signal permanently.
          </div>
        </motion.div>

      </div>
    </section>
  );
}
