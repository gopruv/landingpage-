"use client";

import { motion } from "framer-motion";
import Breadcrumb from "@/components/Breadcrumb";

const ease = [0.22, 1, 0.36, 1] as const;

const sections = [
  {
    title: "Acceptance of Terms",
    body: [
      "By accessing or using Orcred — including joining the waitlist, submitting an application, participating in a review session, or browsing this site — you agree to be bound by these Terms of Service.",
    ],
  },
  {
    title: "What Orcred Is",
    body: [
      "Orcred is a technical verification platform for AI/ML engineers in India. We facilitate live 45-minute Socratic review sessions conducted by senior engineers who have studied the candidate's project submission before the call. Candidates who pass receive a verified credential — an Orcred Score — that attests to their demonstrated understanding of their work.",
      "All sessions are monitored in real time by an AI agent for quality assurance purposes. Session recordings are stored for 90 days and then permanently deleted unless a dispute is active.",
      "Orcred does not guarantee employment, job placement, or any specific outcome as a result of receiving a credential.",
    ],
  },
  {
    title: "Eligibility",
    body: [
      "By using Orcred you confirm that you are 18 years of age or older. Orcred is not intended for use by persons under 18. If we become aware that a person under 18 has submitted personal data, we will delete it immediately.",
    ],
  },
  {
    title: "Candidate Terms",
    body: [
      "By submitting an application to be verified, you confirm that the project and work described is your own. You confirm that you will personally attend and participate in your assigned review session. Misrepresentation of your work, having another person conduct your session, or any attempt to circumvent the verification process is grounds for immediate disqualification, permanent ineligibility, and potential legal action.",
      "Your Orcred Score and credential are tied to a specific project submission. Scores do not transfer between projects.",
      "You confirm that you declare all AI tools used in building your project as part of your submission. Failure to declare AI tool usage is considered misrepresentation.",
    ],
  },
  {
    title: "Payment and Refund Policy",
    body: [
      "The verification fee is Rs 1,999 per session + GST. Payment is required to confirm your slot in the verification queue. Payment is processed via Razorpay.",
      "Refund policy: Full refund if a reviewer cannot be assigned within 10 business days of payment. Full refund if your assigned reviewer cancels and cannot be rescheduled within 5 business days. 50% refund if you cancel more than 48 hours before your scheduled session. No refund after the session is completed — pass or fail.",
    ],
  },
  {
    title: "Resubmission Policy",
    body: [
      "Candidates who do not pass may resubmit at any time by paying the full verification fee again. Each resubmission is treated as a completely independent application — new reviewer, new questions, no reference to previous sessions or scores.",
    ],
  },
  {
    title: "Session Recording and Monitoring",
    body: [
      "All sessions are recorded with both parties' explicit consent obtained at the start of each call. Recordings are stored securely and are accessible only to Orcred's founding team for quality assurance and dispute resolution purposes. Recordings are permanently deleted after 90 days unless a dispute is active.",
      "An AI agent monitors all sessions in real time for quality assurance purposes. By participating in a session you consent to this monitoring.",
    ],
  },
  {
    title: "Reviewer Terms",
    body: [
      "Reviewers are engaged as independent contractors. Reviewers agree to conduct sessions honestly, professionally, and in accordance with Orcred's evaluation framework. Scores must reflect genuine independent assessment of the candidate's demonstrated understanding.",
      "Reviewers may not solicit candidates for private coaching, employment, or any compensation outside of Orcred. Reviewers may not independently record any session by any means. Reviewers may not copy, clone, share, or use any candidate's code or project materials for any purpose.",
      "Orcred reserves the right to remove a reviewer from the platform immediately for any conduct that undermines the integrity of the credential or breaches the reviewer's confidentiality obligations.",
    ],
  },
  {
    title: "Credential Integrity",
    body: [
      "Every Orcred credential is cryptographically signed and server-generated. It cannot be faked or edited. Orcred reserves the right to revoke any credential where fraud, misrepresentation, or breach of these Terms is identified. Credential revocation decisions are made solely by Orcred and are final.",
    ],
  },
  {
    title: "Intellectual Property",
    body: [
      "All platform content, branding, scoring methodology, assessment framework, and design assets are the property of Orcred. You may not reproduce, distribute, or create derivative works without explicit written consent.",
      "Candidate project submissions remain the intellectual property of the candidate. Orcred acquires no rights over candidate code or project materials by virtue of the verification process.",
    ],
  },
  {
    title: "Data Protection",
    body: [
      "Your personal data is collected and processed in accordance with our Privacy Policy and the Digital Personal Data Protection Act 2023. By using Orcred you consent to the collection and processing of your data as described in our Privacy Policy.",
    ],
  },
  {
    title: "Limitation of Liability",
    body: [
      "Orcred is provided on an as-is basis. We make no warranties, express or implied, regarding the platform's availability, accuracy, or fitness for any particular purpose.",
      "To the maximum extent permitted by law, Orcred's liability to any user shall not exceed the total fees paid by that user for the specific session giving rise to the claim. Orcred shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.",
    ],
  },
  {
    title: "Dispute Resolution",
    body: [
      "Any dispute arising from these Terms shall first be attempted through good faith discussion. If unresolved, disputes shall be referred to mediation and then arbitration in Bengaluru, Karnataka under the Arbitration and Conciliation Act 1996. The courts of Bengaluru, Karnataka have exclusive jurisdiction for matters not subject to arbitration.",
    ],
  },
  {
    title: "Governing Law",
    body: [
      "These Terms are governed by the laws of India. Jurisdiction: Bengaluru, Karnataka.",
    ],
  },
  {
    title: "Changes to These Terms",
    body: [
      "We may update these Terms from time to time. Continued use of the platform after changes are posted constitutes acceptance of the revised Terms. We will note the date of the most recent update at the top of this page.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Questions about these Terms? Reach us at contact@orcred.com",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-page)" }}>

      {/* Subtle ambient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% 20%, var(--orange-tint) 0%, transparent 70%)",
        }}
      />

      {/* ── Content ── */}
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]} />

      <main className="relative z-10 flex-1 max-w-[760px] mx-auto w-full px-8 sm:px-12 lg:px-16 py-12 sm:py-16 lg:py-20">

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
              Legal
            </span>
          </div>
          <div style={{ fontSize: "clamp(22px, 2.8vw, 38px)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#0f0d0c", marginBottom: 12 }}>
            Terms of Service
          </div>
          <div style={{ fontSize: "clamp(13px, 1.1vw, 14px)", fontWeight: 400, lineHeight: 1.7, color: "rgba(15,13,12,0.4)", fontStyle: "italic" }}>
            Last updated August 2026
          </div>
        </motion.div>

        <div className="w-full h-px mb-12" style={{ background: "rgba(15,13,12,0.1)" }} />

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.07, ease }}
            >
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase" as const, color: "#eb4511", marginBottom: 12 }}>
                {s.title}
              </div>
              <div className="space-y-3">
                {s.body.map((para, j) => (
                  <p
                    key={j}
                    style={{ fontSize: "clamp(14px, 1.2vw, 15px)", fontWeight: 400, lineHeight: 1.85, color: "rgba(15,13,12,0.58)" }}
                  >
                    {para}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

      </main>

    </div>
  );
}
