"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import Frame from "@/components/orx/Frame";
import { Block, Head } from "@/components/orx/Sheet";
import { Arrow, Btn, EASE, Heading, L, Meter, Rise, Section, T } from "@/components/orx/kit";

/* ── Types ── */
type Item = { label: string; body: string };
type Dimension = { label: string; weight: number; body: string };
type Band = { range: string; meaning: string; pass: boolean };
type Step = {
  title: string;
  intro: string;
  items?: Item[];
  note?: string;
};

/* ── The five steps ──────────────────────────────────────────────────────────
   Payment is deliberately not a numbered step here: it was removed from the
   process on the landing page (dfed639), so the two would otherwise disagree
   on how many steps there are. The fee and refund terms live in their own
   panel below instead, where nothing is lost.
   ─────────────────────────────────────────────────────────────────────────── */
const STEPS: Step[] = [
  {
    title: "Submit your project",
    intro:
      "Orcred verifies one specific project — something you built, something you own, something you can talk about for an hour without running out of things to say.",
    items: [
      {
        label: "GitHub repository",
        body: "Your actual codebase. Not a fork, not a tutorial clone. Your own work, with a commit history that reflects genuine building over time.",
      },
      {
        label: "5-minute Loom walkthrough",
        body: "You, explaining what you built and why — the architecture, the decisions. Someone who did not build the project cannot make this video. That is the point.",
      },
      {
        label: "Three build decisions",
        body: "In your own words. For each: what you chose, what you considered instead, and why. They don't need to be long — they need to be specific.",
      },
      {
        label: "One thing that broke",
        body: "Every real project has this moment. What went wrong, how long it took to find, and what fixed it. This one answer tells a reviewer more than almost anything else.",
      },
      {
        label: "AI tools declaration",
        body: "Cursor, Claude, Copilot — declare whatever you used. Orcred is not anti-AI. The question isn't whether you used it, but whether you understand what it built.",
      },
    ],
    note: "Incomplete submissions are returned with specific notes on what's missing.",
  },
  {
    title: "Reviewer matching",
    intro:
      "Your submission goes to a senior engineer who specialises in your domain — NLP, computer vision, MLOps, LLMs, RAG pipelines, wherever your project sits. This is not random assignment.",
    items: [
      {
        label: "Reviewer standards",
        body: "Minimum 5 years of hands-on production AI/ML engineering. Every reviewer is personally vetted by Orcred's founding team and signs a confidentiality agreement before reviewing anyone.",
      },
      {
        label: "Conflict policy",
        body: "Your reviewer will never be a student, someone without relevant specialisation in your domain, or anyone with a personal or professional connection to you.",
      },
    ],
    note: "Reviewer assigned within 3 to 5 business days of payment confirmation.",
  },
  {
    title: "The live Socratic review",
    intro:
      "45 minutes, both parties on camera. Every question is asked specifically for your project — there is no question bank, and no way to coach for it.",
    items: [
      {
        label: "Identity verification",
        body: "At the start of the call you show a government-issued photo ID matching the name on your account. Every call, without exception.",
      },
      {
        label: "Reviewer anonymity",
        body: "Your reviewer appears under an anonymous display name. Their real name, employer and LinkedIn are never disclosed, so the assessment rests on your understanding and nothing else.",
      },
      {
        label: "The questions",
        body: "Your reviewer has studied your GitHub, your Loom and your build decisions before the call. Questions probe specific architectural choices, tradeoffs, failure modes, and your understanding of code you claim to own.",
      },
      {
        label: "Recording",
        body: "Recorded with both parties' consent, accessible only to the founding team for quality control and disputes, and deleted after 90 days unless under active dispute.",
      },
    ],
    note: "The review is not adversarial. It's a genuine technical conversation. If you built it and you understand it, you'll be fine.",
  },
  {
    title: "Score and written feedback",
    intro:
      "Within 24 hours of your review, your Orcred Score and written feedback land in your account — out of 100, across four dimensions.",
  },
  {
    title: "Your credential page",
    intro:
      "If you pass, your credential goes live within 24 hours of your score. It is permanent.",
    items: [
      {
        label: "What it shows",
        body: "Project name and description, tech stack, declared AI tools, review date, and your score overall and per dimension.",
      },
      {
        label: "LinkedIn",
        body: "One click pre-fills every certification field. Recruiters visiting your profile see the Orcred Verified badge with a live link to your credential.",
      },
      {
        label: "Integrity",
        body: "Every credential is cryptographically signed and server-generated. It cannot be faked or edited, and the page lives at that URL permanently.",
      },
    ],
  },
];

const DIMENSIONS: Dimension[] = [
  {
    label: "Technical depth",
    weight: 35,
    body: "How well you understand the architecture, algorithms and decisions inside your system. Weighted highest because it is the hardest to fake.",
  },
  {
    label: "Communication",
    weight: 25,
    body: "How clearly you explained your thinking. Can you make a complex system understandable to a smart person who isn't inside your head?",
  },
  {
    label: "Problem solving",
    weight: 25,
    body: "Genuine problem solving versus tutorial following. Did you make real decisions, or assemble existing pieces without understanding why?",
  },
  {
    label: "Reproducibility",
    weight: 15,
    body: "Could someone else run and understand this project from what you built and documented? A project only you can run is a liability.",
  },
];

const BANDS: Band[] = [
  { range: "90–100", meaning: "Exceptional", pass: true },
  { range: "75–89", meaning: "Strong — ready for industry", pass: true },
  { range: "60–74", meaning: "Passed — solid, with room to grow", pass: true },
  { range: "40–59", meaning: "Did not pass — specific gaps noted", pass: false },
  { range: "0–39", meaning: "Did not pass — significant gaps in understanding", pass: false },
];

const REFUNDS = [
  "Full refund if a reviewer cannot be assigned within 10 business days.",
  "Full refund if your assigned reviewer cancels and cannot be rescheduled within 5 business days.",
  "50% refund if you cancel more than 48 hours before your call.",
  "No refund after the review is completed.",
];

/* ── A labelled detail row ───────────────────────────────────────────────── */
function Detail({ item }: { item: Item }) {
  return (
    <div className="flex items-start gap-3.5">
      <span
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          backgroundColor: "var(--or-soft)",
          color: "var(--or)",
          marginTop: 2,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M3 7.2 5.6 9.8 11 4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div>
        <div style={{ ...T.title, fontSize: 17, marginBottom: 5 }}>{item.label}</div>
        <p style={{ ...T.body, margin: 0 }}>{item.body}</p>
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...T.fine,
        margin: 0,
        marginTop: 22,
        paddingLeft: 16,
        borderLeft: "2px solid var(--or-line)",
        maxWidth: 620,
      }}
    >
      {children}
    </p>
  );
}

export default function HowItWorksPage() {
  const reduce = useReducedMotion();

  return (
    <Frame>
      <Head
        eyebrow="Process"
        title={["How it works."]}
        lede="Orcred is not a quiz, a multiple-choice test, or a course badge. It's a live technical conversation with a senior engineer who knows your project before you walk in."
        meta={["5 steps", "45-minute review", "Result in 24 hours"]}
      />

      {/* ── The steps ── */}
      <Block id="steps" eyebrow="Start to finish">
        <div className="relative" style={{ maxWidth: 820 }}>
          {/* Connector */}
          <div
            aria-hidden
            className="absolute hidden sm:block"
            style={{ left: 17, top: 30, bottom: 30, width: 2, borderRadius: 2, backgroundColor: "var(--line-2)" }}
          />

          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {STEPS.map((step, i) => (
              <motion.li
                key={step.title}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.8, ease: EASE }}
                className="relative flex gap-5 sm:gap-7"
                style={{ paddingBottom: i === STEPS.length - 1 ? 0 : 52 }}
              >
                <span
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    backgroundColor: "var(--or)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 500,
                    fontVariantNumeric: "tabular-nums",
                    boxShadow: "0 6px 16px -6px rgba(235,69,17,0.5)",
                  }}
                >
                  {i + 1}
                </span>

                <div className="min-w-0" style={{ paddingTop: 4 }}>
                  <h2 style={{ ...T.title, fontSize: "clamp(21px, 2vw, 26px)", marginBottom: 12 }}>
                    {step.title}
                  </h2>
                  <p style={{ ...T.body, margin: 0, maxWidth: 620 }}>{step.intro}</p>

                  {step.items && (
                    <div className="flex flex-col gap-5" style={{ marginTop: 26 }}>
                      {step.items.map((item) => (
                        <Detail key={item.label} item={item} />
                      ))}
                    </div>
                  )}

                  {/* Step 4 carries the rubric */}
                  {i === 3 && (
                    <div className="orx-card p-6 sm:p-7" style={{ marginTop: 26 }}>
                      <L style={{ display: "block", marginBottom: 22 }}>The four dimensions</L>
                      <div className="orx-rows">
                        {DIMENSIONS.map((d, j) => (
                          <div key={d.label} style={{ paddingTop: j === 0 ? 0 : 20, paddingBottom: 20 }}>
                            <div className="flex items-baseline justify-between gap-4" style={{ marginBottom: 9 }}>
                              <span style={{ ...T.title, fontSize: 17 }}>{d.label}</span>
                              <span style={{ ...T.fig, fontSize: 19 }}>{d.weight}%</span>
                            </div>
                            <Meter value={d.weight} delay={0.1 + j * 0.08} height={5} />
                            <p style={{ ...T.body, margin: 0, marginTop: 12 }}>{d.body}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step.note && <Note>{step.note}</Note>}
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </Block>

      {/* ── Score bands ── */}
      <Block id="scoring" eyebrow="What your score means" soft>
        <Heading
          lines={["Pass mark is 60."]}
          lede="Everyone — pass or fail — receives written feedback across all four dimensions within 24 hours."
        />

        <div className="orx-card mt-12" style={{ maxWidth: 720, overflow: "hidden" }}>
          {BANDS.map((b, i) => (
            <Rise
              key={b.range}
              delay={i * 0.05}
              className="flex items-center gap-5 sm:gap-8 px-6 sm:px-7"
              style={{
                paddingTop: 18,
                paddingBottom: 18,
                borderTop: i === 0 ? "none" : "1px solid var(--line)",
                backgroundColor: b.pass ? "transparent" : "rgba(16,17,20,0.02)",
              }}
            >
              <span
                className="orx-num flex-shrink-0"
                style={{
                  ...T.title,
                  fontSize: 18,
                  width: 82,
                  color: b.pass ? "var(--ink)" : "var(--ink-3)",
                }}
              >
                {b.range}
              </span>

              <span
                className="flex items-center gap-2.5 flex-shrink-0"
                style={{
                  padding: "5px 11px",
                  borderRadius: 999,
                  backgroundColor: b.pass ? "var(--or-soft)" : "rgba(16,17,20,0.05)",
                  color: b.pass ? "var(--or)" : "var(--ink-3)",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {b.pass ? "Pass" : "No pass"}
              </span>

              <span style={{ ...T.body, margin: 0, color: b.pass ? "var(--ink-2)" : "var(--ink-3)" }}>
                {b.meaning}
              </span>
            </Rise>
          ))}
        </div>
      </Block>

      {/* ── Fees ── */}
      <Block id="fees" eyebrow="Fees and refunds">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Rise className="h-full">
            <div className="orx-card h-full p-7 sm:p-8">
              <L style={{ display: "block", marginBottom: 14 }}>Verification fee</L>
              <div className="flex items-baseline gap-3" style={{ marginBottom: 16 }}>
                <span style={{ ...T.fig, fontSize: "clamp(40px, 4.6vw, 56px)", color: "var(--or)" }}>
                  ₹1,999
                </span>
                <span style={{ ...T.lede, color: "var(--ink-3)" }}>one time</span>
              </div>
              <p style={{ ...T.body, margin: 0 }}>
                Paid at registration, which confirms your slot in the queue. UPI, cards and net
                banking accepted. No subscription and no hidden fees.
              </p>
            </div>
          </Rise>

          <Rise delay={0.1} className="h-full">
            <div className="orx-card h-full p-7 sm:p-8">
              <L style={{ display: "block", marginBottom: 20 }}>Refund policy</L>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }} className="flex flex-col gap-4">
                {REFUNDS.map((r) => (
                  <li key={r} className="flex items-start gap-3.5">
                    <span
                      aria-hidden
                      className="flex-shrink-0"
                      style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: "var(--or)", marginTop: 9 }}
                    />
                    <span style={{ ...T.body }}>{r}</span>
                  </li>
                ))}
              </ul>
              <p style={{ ...T.fine, marginTop: 22 }}>
                Full details in our <Link href="/terms" className="orx-ref">Terms of Service</Link>.
              </p>
            </div>
          </Rise>
        </div>
      </Block>

      {/* ── If you did not pass ── */}
      <Section id="retry" eyebrow="If you don't pass" soft>
        <Heading
          lines={["A rejection with good feedback", "beats a pass with none."]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-14 gap-y-6 mt-10" style={{ maxWidth: 960 }}>
          <Rise style={{ ...T.body }}>
            Failing an Orcred review is not the end. It is specific, documented, actionable
            information about exactly where your understanding has gaps. You get your full score
            breakdown and written feedback within 24 hours — the reviewer has told you precisely
            what to fix.
          </Rise>
          <Rise delay={0.1} style={{ ...T.body }}>
            You can resubmit at any time, with no waiting period. Pay the fee again, get a new
            reviewer, new questions, a clean slate. Many students who pass on their second attempt
            say the feedback from the first was the most useful technical input they ever received.
          </Rise>
        </div>
      </Section>

      {/* ── Close ── */}
      <Section id="close" eyebrow="One final thing">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-10 lg:gap-x-14 items-center">
          <div className="lg:col-span-7">
            <Heading
              lines={["The credential means something", "because not everyone gets it."]}
              lede="Every company that sees Orcred Verified on a profile knows a senior engineer reviewed this person's actual work and confirmed they understand what they built."
            />

            <Rise delay={0.25} className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-4">
              <Btn href="/join-waitlist">Join the waitlist</Btn>
              <Arrow href="/#standard">Read the scoring standard</Arrow>
            </Rise>
          </div>

          <Rise delay={0.15} className="lg:col-span-5">
            <div className="orx-card p-7 sm:p-8">
              <p
                style={{
                  ...T.title,
                  fontSize: "clamp(20px, 1.9vw, 25px)",
                  color: "var(--or)",
                  margin: 0,
                }}
              >
                If you built something real and you understand it — come in.
              </p>
            </div>
          </Rise>
        </div>
      </Section>
    </Frame>
  );
}
