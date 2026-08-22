import Legal, { type Section } from "@/components/orx/Legal";

/**
 * Privacy Policy.
 *
 * Wording is legally operative and is reproduced here exactly as it stood —
 * this page changes presentation only. LegalDoc sets each section as a
 * numbered clause and drives the index rail from this array.
 */
const SECTIONS: Section[] = [
  {
    title: "What Orcred Is",
    body: [
      "Orcred is a technical verification platform for AI/ML engineers in India. We facilitate live 45-minute Socratic review sessions conducted by senior engineers who have studied the candidate's project submission before the call. Candidates who pass receive a verified credential — an Orcred Score — that attests to their demonstrated understanding of their work.",
      "All sessions are monitored in real time by an AI agent for quality assurance purposes. Session recordings are stored for 90 days and then permanently deleted unless a dispute is active.",
      "Orcred does not guarantee employment, job placement, or any specific outcome as a result of receiving a credential.",
    ],
  },
  {
    title: "Information We Collect",
    body: [
      "We collect information from two types of users — Students and Reviewers.",
      "Students: When you join the waitlist we collect your email address. When you submit a project for verification we collect your name, email address, phone number, college name, graduation year, LinkedIn URL, GitHub repository URL, Loom walkthrough URL, project details, build decisions, AI tools declaration, and availability windows. Payment information is processed by Razorpay — we do not store card details. During your session, you show a government-issued photo ID for identity verification — this is viewed on camera only and is not stored by Orcred.",
      "Reviewers: We collect full legal name, residential address, government ID type and number, PAN number, bank account details, email address, phone number, LinkedIn URL, current employer and role, years of experience, areas of expertise, and a passport photograph. This information is collected for payment, TDS compliance, and engagement purposes only.",
      "Waitlist: When you join the waitlist we collect your email address only.",
      "We collect standard server logs — IP address, browser type, page visit timestamps — retained briefly for security purposes.",
    ],
  },
  {
    title: "How We Use Your Information",
    body: [
      "Your data is used solely to operate the Orcred platform — to evaluate submissions, assign reviewers, conduct sessions, issue credentials, process payments, and communicate with you about your verification.",
      "Live verification sessions are recorded with both parties' explicit consent. Recordings are used solely for internal quality assurance and dispute resolution. Recordings are permanently deleted after 90 days unless a dispute is active.",
      "An AI agent monitors live sessions in real time for quality assurance purposes. Session content is processed during the session only. No full personal information is sent to the AI system.",
      "Reviewer identities are never disclosed to candidates. Reviewers conduct all sessions under anonymised display names.",
      "We do not sell, rent, or share your personal information with third parties for marketing purposes.",
    ],
  },
  {
    title: "Data Retention",
    body: [
      "Session recordings are deleted after 90 days unless a dispute is active. Failed application data is retained for 2 years from submission. Passed application data and credentials are retained indefinitely — credentials are permanent. Payment records are retained for 7 years for tax compliance. Consent records are retained permanently as evidence of lawful processing. You may request deletion of your personal data at any time by emailing team@orcred.com — subject to legal retention requirements.",
    ],
  },
  {
    title: "Cookies & Analytics",
    body: [
      "We use Posthog for anonymised product analytics — pages visited, session duration, and general usage patterns. This data is anonymised and does not identify you personally.",
      "We use no advertising cookies, retargeting pixels, or any other third-party tracking. Essential session storage is used solely to maintain your form state within a single visit.",
    ],
  },
  {
    title: "Third-Party Services",
    body: [
      "We use the following third-party services to operate the platform: Razorpay — payment processing. Daily.co — video sessions and recording. Resend — transactional email delivery. Anthropic Claude API — AI session monitoring. Upstash — rate limiting. Vercel — platform hosting. Posthog — anonymised product analytics. Google Fonts — font assets.",
      "None of these services receive your full personal information beyond what is necessary for their specific function. All personal data is stored on servers in India (Mumbai region) in compliance with the Digital Personal Data Protection Act 2023.",
      "We do not use any CRM, advertising, or data-broker platforms.",
    ],
  },
  {
    title: "Your Rights",
    body: [
      "Under the Digital Personal Data Protection Act 2023 you have the right to access personal data we hold about you, correct inaccurate data, request deletion of your data subject to legal retention requirements, withdraw consent at any time, and raise a grievance with us or the Data Protection Board of India.",
      "To exercise any of these rights, contact us at contact@orcred.com. We will respond within 30 days.",
    ],
  },
  {
    title: "Data Security",
    body: [
      "All data is stored with industry-standard security measures including Row Level Security on our database, encrypted connections, and access controls ensuring only authorised personnel can access personal data. We maintain separate production and staging environments — no real personal data is ever used in testing.",
      "In the event of a data breach we will notify affected individuals within 72 hours as required under the Digital Personal Data Protection Act 2023.",
    ],
  },
  {
    title: "Children's Data",
    body: [
      "Orcred is not intended for persons under 18. We do not knowingly collect data from minors. If we become aware that data from a person under 18 has been collected, we will delete it immediately.",
    ],
  },
  {
    title: "Grievance Officer",
    body: [
      "For data protection queries or to exercise your rights under the Digital Personal Data Protection Act 2023, contact: Pragathi S A — Founder, Orcred — contact@orcred.com",
      "We will respond within 30 days.",
    ],
  },
  {
    title: "Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. Continued use of the platform after changes are posted constitutes acceptance of the revised Policy. We will note the date of the most recent update at the top of this page.",
    ],
  },
  {
    title: "Contact",
    body: [
      "For any privacy-related questions reach us at contact@orcred.com",
    ],
  },
];

export default function PrivacyPage() {
  return <Legal title="Privacy Policy" updated="Last updated August 2026" sections={SECTIONS} />;
}
