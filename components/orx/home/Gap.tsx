"use client";

/**
 * The gap — problem, session, proof.
 *
 * Three soft cards, each led by a simple icon rather than a diagram. Icons
 * give the eye an anchor to land on, so the section can be understood from a
 * scan without reading every word.
 */

import { Heading, Rise, Section, T } from "@/components/orx/kit";

function IconCrowd() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="8" r="3" fill="currentColor" />
      <path d="M2 19c0-2.2 1.8-4 4-4M22 19c0-2.2-1.8-4-4-4M7.5 20c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconLive() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 6.8V12l3.4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconProof() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3.2 19.5 6v6c0 4.3-3 7.4-7.5 8.8C7.5 19.4 4.5 16.3 4.5 12V6L12 3.2Z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.8 12.1 11 14.3l4.2-4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CARDS = [
  {
    Icon: IconCrowd,
    title: "Everyone has a project",
    body: "Your GitHub looks identical to someone who spent a weekend prompting ChatGPT. Recruiters cannot tell the difference.",
  },
  {
    Icon: IconLive,
    title: "One live conversation",
    body: "Your reviewer reads your code before the call. Then 45 minutes of questions, only about your project. No question bank.",
  },
  {
    Icon: IconProof,
    title: "Now there's proof",
    body: "Pass, and your credential is issued within 24 hours. Don't pass, and you get specific written feedback on what to fix.",
  },
];

export default function Gap() {
  return (
    <Section id="gap" eyebrow="The gap" soft>
      <Heading
        lines={["Doing the work and being", "believed are two problems."]}
        lede="We solve the second one."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14 sm:mt-16">
        {CARDS.map((c, i) => (
          <Rise key={c.title} delay={i * 0.1} className="h-full">
            <div className="orx-card orx-card--lift h-full p-7 sm:p-8">
              <span
                className="inline-flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "var(--r)",
                  backgroundColor: "var(--or-soft)",
                  color: "var(--or)",
                  marginBottom: 22,
                }}
              >
                <c.Icon />
              </span>

              <h3 style={{ ...T.title, marginBottom: 12 }}>{c.title}</h3>
              <p style={{ ...T.body, margin: 0 }}>{c.body}</p>
            </div>
          </Rise>
        ))}
      </div>
    </Section>
  );
}
