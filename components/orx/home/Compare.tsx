"use client";

/**
 * Comparison.
 *
 * Four cards rather than a table — a table forces the eye across columns and
 * back, which is exactly the scanning cost to avoid. Each card answers the
 * same two questions in the same place, so the pattern reads at a glance and
 * the Orcred card is the only one carrying colour.
 */

import { Heading, Rise, Section, T } from "@/components/orx/kit";

const ITEMS = [
  { name: "GitHub", proves: "You pushed code.", misses: "Whether you understand it.", us: false },
  { name: "LeetCode", proves: "You solve puzzles.", misses: "Whether you can build systems.", us: false },
  { name: "Certificates", proves: "You finished a course.", misses: "Whether you can apply it.", us: false },
  { name: "Orcred", proves: "You understand what you built.", misses: "Nothing.", us: true },
];

function Line({
  label,
  value,
  accent,
  strong,
}: {
  label: string;
  value: string;
  accent: boolean;
  strong?: boolean;
}) {
  return (
    <div>
      <span
        className="orx-label"
        style={{ color: accent ? "rgba(255,255,255,0.72)" : "var(--ink-3)", display: "block", marginBottom: 7 }}
      >
        {label}
      </span>
      <span
        style={{
          ...T.body,
          fontSize: 16,
          color: accent ? (strong ? "#fff" : "rgba(255,255,255,0.9)") : "var(--ink-2)",
          fontWeight: strong ? 450 : 400,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function Compare() {
  return (
    <Section id="comparison" eyebrow="Comparison">
      <Heading
        lines={["Every other signal leaves", "one question unanswered."]}
        lede="GitHub shows commits. LeetCode shows patterns. Certificates show completions. None of them answer the only question that matters."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-14 sm:mt-16">
        {ITEMS.map((item, i) => (
          <Rise key={item.name} delay={i * 0.08} className="h-full">
            <div
              className={`h-full p-7 ${item.us ? "" : "orx-card orx-card--lift"}`}
              style={
                item.us
                  ? {
                      borderRadius: "var(--r-lg)",
                      backgroundColor: "var(--or)",
                      color: "#fff",
                      boxShadow: "0 18px 40px -16px rgba(235,69,17,0.55)",
                    }
                  : undefined
              }
            >
              <div className="flex items-center gap-2.5" style={{ marginBottom: 26 }}>
                <h3
                  style={{
                    ...T.title,
                    fontSize: "clamp(20px, 1.8vw, 24px)",
                    color: item.us ? "#fff" : "var(--ink)",
                  }}
                >
                  {item.name}
                </h3>
                {item.us && (
                  <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <circle cx="7" cy="7" r="7" fill="rgba(255,255,255,0.22)" />
                    <path d="M4 7.2 6.2 9.4 10 5.4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              <div className="flex flex-col gap-5">
                <Line label="What it proves" value={item.proves} accent={item.us} strong={item.us} />
                <Line label="What it misses" value={item.misses} accent={item.us} />
              </div>
            </div>
          </Rise>
        ))}
      </div>
    </Section>
  );
}
