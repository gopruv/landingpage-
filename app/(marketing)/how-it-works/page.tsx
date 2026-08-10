"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Breadcrumb from "@/components/Breadcrumb";

const ease = [0.22, 1, 0.36, 1] as const;

/* ── Types ── */
interface ListItem  { label: string; body: string; }
interface ScoreRow  { range: string; meaning: string; pass: boolean; }
interface Dimension { label: string; weight: string; body: string; }
interface Step {
  num: string;
  title: string;
  intro: string;
  items?: ListItem[];
  dimensions?: Dimension[];
  scoreTable?: ScoreRow[];
  note?: string;
  noteLink?: { label: string; href: string };
}

/* ── Content ── */
const steps: Step[] = [
  {
    num: "01",
    title: "Submit Your Project",
    intro:
      "Everything starts with your submission. Orcred verifies one specific project — something you built, something you own, something you can talk about for an hour without running out of things to say.",
    items: [
      { label: "GitHub repository",    body: "Your actual codebase. Not a fork. Not a tutorial clone. Your own work with a commit history that reflects genuine building over time." },
      { label: "5-minute Loom walkthrough", body: "Record yourself explaining what you built and why — the architecture, the decisions. Someone who did not build the project cannot make this video. That is the point." },
      { label: "Three build decisions", body: "Written in your own words. For each: what you chose, what alternatives you considered, and why. They do not need to be long. They need to be honest and specific." },
      { label: "One thing that broke",  body: "Every real project has this moment. What went wrong, how long it took to figure out, and what the fix was. This single answer tells a reviewer more about your understanding than almost anything else." },
      { label: "AI tools declaration",  body: "Did you use Cursor, Claude, Copilot, or anything else? Declare it. Orcred is not anti-AI. The question is not whether you used AI — it is whether you understand what it built for you." },
    ],
    note: "Payment is made at the time of registration, together with your submission. Incomplete submissions are returned with specific notes on what is missing.",
  },
  {
    num: "02",
    title: "Payment",
    intro:
      "Payment of Rs 1,999 is made at the time of registration and confirms your slot in the verification queue. You pay when you register — not days later. Payment is processed via Razorpay — UPI, cards, and net banking accepted.",
    note: "Full refund if a reviewer cannot be assigned within 10 business days, or if your assigned reviewer cancels and cannot be rescheduled within 5 business days. 50% refund if you cancel more than 48 hours before your call. No refund after the review is completed. Full details in our",
    noteLink: { label: "Terms of Service", href: "/terms" },
  },
  {
    num: "03",
    title: "Reviewer Matching",
    intro:
      "Your submission is matched to a senior engineer who specialises in your specific domain — NLP, computer vision, MLOps, LLMs, RAG pipelines, or wherever your project sits. This is not random assignment.",
    items: [
      { label: "Reviewer standards", body: "Every Orcred reviewer has a minimum of 5 years of hands-on production AI/ML engineering experience. Every reviewer is personally vetted by Orcred's founding team and signs a confidentiality agreement before reviewing anyone." },
      { label: "Conflict policy",    body: "Your reviewer will never be a student or recent graduate, someone without relevant specialisation in your domain, or anyone with a personal or professional connection to you." },
    ],
    note: "Reviewer assigned within 3 to 5 business days of payment confirmation.",
  },
  {
    num: "04",
    title: "The Live Socratic Review",
    intro:
      "45 minutes. Both parties on camera. Mandatory. Every question is asked specifically for your project — there is no question bank and no way to coach for it.",
    items: [
      { label: "Identity verification", body: "At the start of the call you will be asked to show a valid government-issued photo ID matching the name on your Orcred account. This happens before every call without exception." },
      { label: "Reviewer anonymity",    body: "Your reviewer appears under an anonymous display name. Their real name, employer, and LinkedIn are never disclosed. This ensures the assessment is based entirely on your understanding and nothing else." },
      { label: "The questions",         body: "Your reviewer has studied your submission thoroughly before the call. They know your GitHub, your Loom, your build decisions. Questions probe specific architectural choices, tradeoffs, failure modes, and your understanding of code you claim to own." },
      { label: "Recording",             body: "Every call is recorded with both parties' consent. Stored securely, accessible only to the Orcred founding team for quality control and dispute resolution. Deleted after 90 days unless under active dispute." },
    ],
    note: "The review is not adversarial. It is a genuine technical conversation. If you built it and you understand it — you will be fine.",
  },
  {
    num: "05",
    title: "Score and Written Feedback",
    intro:
      "Within 24 hours of your review, your Orcred Score and written feedback are delivered to your account. Your score is out of 100 across four dimensions.",
    dimensions: [
      { label: "Technical Depth",  weight: "35%", body: "How well you understand the architecture, algorithms, and decisions inside your system. The highest weighted dimension because it is the hardest to fake." },
      { label: "Communication",    weight: "25%", body: "How clearly you explained your thinking. Can you make a complex system understandable to a smart person who is not inside your head?" },
      { label: "Problem Solving",  weight: "25%", body: "Genuine problem solving versus tutorial following. Did you make real decisions or assemble existing pieces without understanding why?" },
      { label: "Reproducibility",  weight: "15%", body: "Could someone else run and understand this project from what you have built and documented? A project only you can run is a liability." },
    ],
    scoreTable: [
      { range: "90 – 100", meaning: "Exceptional",                                        pass: true  },
      { range: "75 – 89",  meaning: "Strong — ready for industry",                        pass: true  },
      { range: "60 – 74",  meaning: "Passed — solid with room to grow",                   pass: true  },
      { range: "40 – 59",  meaning: "Did not pass — specific gaps noted",                 pass: false },
      { range: "0 – 39",   meaning: "Did not pass — significant gaps in understanding",   pass: false },
    ],
    note: "Pass threshold is 60. Every student — pass or fail — receives specific written feedback across all four dimensions within 24 hours. A rejection with honest feedback is more valuable than a pass with no insight.",
  },
  {
    num: "06",
    title: "Your Credential Page",
    intro:
      "If you pass, your Orcred credential page goes live at orcred.com/verify/[credential-id] within 24 hours of your score being delivered. It is permanent.",
    items: [
      { label: "What it shows", body: "Project name and description, tech stack, declared AI tools, review date, your Orcred Score overall and per dimension." },
      { label: "LinkedIn",      body: "One-click Add to LinkedIn pre-fills every certification field. Every recruiter who visits your profile sees the Orcred Verified badge with a live link to your credential page." },
      { label: "Integrity",     body: "Every credential is cryptographically signed and server-generated. It cannot be faked or edited. The credential page lives at that URL permanently." },
    ],
  },
];

/* ── Shared text styles (matching other sections) ── */
const sectionTitle: React.CSSProperties = {
  fontSize:      "clamp(22px, 2.8vw, 38px)",
  fontWeight:    400,
  letterSpacing: "-0.02em",
  lineHeight:    1.1,
  color:         "#0f0d0c",
  marginBottom:  "12px",
};

const bodyText: React.CSSProperties = {
  fontSize:   "clamp(14px, 1.2vw, 15px)",
  fontWeight: 400,
  lineHeight: 1.8,
  color:      "rgba(15,13,12,0.58)",
};

const eyebrow = (num: string) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
    <div style={{ fontSize: 9, fontWeight: 700, color: "#eb4511" }}>{num}</div>
    <div style={{ width: 18, height: 1, background: "rgba(15,13,12,0.15)" }} />
  </div>
);

/* ── Page ── */
export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-page)" }}>

      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "How It Works" }]} />

      <main className="relative z-10 flex-1 max-w-[860px] mx-auto w-full px-8 sm:px-12 lg:px-16 py-12 sm:py-16 lg:py-20">

        {/* Page title */}
        <motion.div
          className="mb-14"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-6 h-px" style={{ backgroundColor: "#eb4511" }} />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#eb4511" }}>
              Process
            </span>
          </div>

          <div style={{ fontSize: "clamp(30px, 3.6vw, 48px)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#0f0d0c", marginBottom: 16 }}>
            How It Works
          </div>
          <div style={{ ...bodyText, maxWidth: "560px", fontStyle: "italic", color: "rgba(15,13,12,0.45)" }}>
            You built something real. We prove it.
          </div>
        </motion.div>

        {/* Intro */}
        <motion.p
          style={{ ...bodyText, maxWidth: "640px", marginBottom: "48px" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.15 }}
        >
          Orcred is not a quiz. Not a multiple choice test. Not a course completion badge. It is a live technical verification — a conversation with a senior engineer who knows your project inside out before you walk in. Here is exactly what happens from the moment you submit to the moment your credential goes live.
        </motion.p>

        <div className="w-full h-px mb-14" style={{ background: "rgba(15,13,12,0.1)" }} />

        {/* Steps */}
        <div className="space-y-16">
          {steps.map((step) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.8, ease }}
            >
              {/* Step number eyebrow */}
              {eyebrow(step.num)}

              {/* Step title — matches other section headings exactly */}
              <div style={{ ...sectionTitle, marginBottom: "14px" }}>
                {step.title}
              </div>

              {/* Intro */}
              <p style={{ ...bodyText, maxWidth: "640px", marginBottom: "24px" }}>
                {step.intro}
              </p>

              {/* Items */}
              {step.items && (
                <div className="space-y-5 mb-6">
                  {step.items.map((item) => (
                    <div key={item.label} className="flex gap-5">
                      <div className="mt-[6px] w-[3px] h-[3px] rounded-full flex-shrink-0" style={{ background: "#eb4511", opacity: 0.65 }} />
                      <div>
                        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase" as const, color: "#0f0d0c", display: "block", marginBottom: 5 }}>
                          {item.label}
                        </span>
                        <p style={{ ...bodyText }}>
                          {item.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Dimensions */}
              {step.dimensions && (
                <div className="mb-7 border-t" style={{ borderColor: "rgba(15,13,12,0.1)" }}>
                  {step.dimensions.map((d) => (
                    <div key={d.label} className="flex gap-8 py-4 border-b" style={{ borderColor: "rgba(15,13,12,0.1)" }}>
                      <div className="w-[130px] flex-shrink-0 pt-0.5">
                        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#0f0d0c", display: "block" }}>
                          {d.label}
                        </span>
                        <span style={{ fontSize: 10, color: "#eb4511", opacity: 0.9, display: "block", marginTop: 3 }}>
                          {d.weight}
                        </span>
                      </div>
                      <p style={{ ...bodyText }}>{d.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Score table */}
              {step.scoreTable && (
                <div className="mb-6 border-t" style={{ borderColor: "rgba(15,13,12,0.1)" }}>
                  {step.scoreTable.map((row) => (
                    <div key={row.range} className="flex items-center gap-8 py-3 border-b" style={{ borderColor: "rgba(15,13,12,0.1)" }}>
                      <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-0.01em", color: row.pass ? "#0f0d0c" : "rgba(15,13,12,0.35)", width: "80px", flexShrink: 0 }}>
                        {row.range}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 400, color: row.pass ? "rgba(15,13,12,0.6)" : "rgba(15,13,12,0.35)" }}>
                        {row.meaning}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Note */}
              {step.note && (
                <p style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.8, fontStyle: "italic", color: "rgba(15,13,12,0.42)", borderLeft: "2px solid rgba(15,13,12,0.1)", paddingLeft: "16px" }}>
                  {step.note}
                  {step.noteLink && (
                    <>
                      {" "}
                      <Link href={step.noteLink.href} style={{ color: "#eb4511", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                        {step.noteLink.label}
                      </Link>
                      .
                    </>
                  )}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <div className="w-full h-px my-16" style={{ background: "rgba(15,13,12,0.1)" }} />

        {/* If You Did Not Pass */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease }}
          className="mb-16"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div className="w-6 h-px" style={{ backgroundColor: "#eb4511" }} />
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#eb4511" }}>
              If You Did Not Pass
            </span>
          </div>

          <div style={{ ...sectionTitle, marginBottom: "20px" }}>
            A rejection with good feedback beats a pass with none.
          </div>

          <div className="space-y-4 max-w-[640px]">
            <p style={{ ...bodyText }}>
              Failing an Orcred review is not the end. It is specific, documented, actionable information about exactly where your understanding has gaps. You receive your full score breakdown and written feedback within 24 hours. Read it carefully. The reviewer has told you exactly what to fix.
            </p>
            <p style={{ ...bodyText }}>
              You can resubmit at any time — no waiting period. Pay the full fee again. New reviewer. New questions. Clean slate. Many students who pass on their second attempt say the feedback from their first attempt was the most useful technical feedback they ever received.
            </p>
          </div>
        </motion.div>

        {/* One Final Thing */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease }}
          className="py-14 border-t border-b"
          style={{ borderColor: "rgba(15,13,12,0.1)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div className="w-6 h-px" style={{ backgroundColor: "#eb4511" }} />
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(15,13,12,0.4)" }}>
              One Final Thing
            </span>
          </div>

          <div style={{ fontSize: "clamp(22px, 2.8vw, 38px)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.2, color: "#0f0d0c", maxWidth: "640px", marginBottom: 20 }}>
            The credential means something because not everyone gets it.
          </div>

          <p style={{ ...bodyText, maxWidth: "560px", marginBottom: 20 }}>
            Every company that sees Orcred Verified on a profile knows that a real senior engineer reviewed this person&apos;s actual work and confirmed they understand what they built. That is what makes it worth carrying.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div className="w-8 h-px" style={{ backgroundColor: "#eb4511", opacity: 0.7 }} />
            <p style={{ fontSize: "clamp(13px, 1.2vw, 15px)", fontWeight: 400, fontStyle: "italic", color: "rgba(180,45,5,0.75)" }}>
              If you built something real and you understand it — come in.
            </p>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
