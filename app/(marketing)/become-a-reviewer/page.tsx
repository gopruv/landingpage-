"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Frame from "@/components/orx/Frame";
import { Block, Done, Field, Head, Submit } from "@/components/orx/Sheet";
import { Arrow, EASE, L, Rise, T } from "@/components/orx/kit";

const PERKS = [
  { k: "Compensation", v: "Discussed at onboarding" },
  { k: "Credential", v: "Founding Reviewer badge" },
  { k: "Influence", v: "You help define what passes" },
  { k: "Schedule", v: "Fits around your day job" },
];

const ELIGIBILITY = [
  "5+ years of AI/ML industry experience",
  "An active or recent engineering role",
  "No current employment at the applicant's company",
];

type Vals = {
  name: string; email: string; role: string; linkedin: string;
  years: string; domain: string; scope: string; why: string; timezone: string;
};

const EMPTY: Vals = {
  name: "", email: "", role: "", linkedin: "",
  years: "", domain: "", scope: "", why: "", timezone: "",
};

const REQUIRED: (keyof Vals)[] = ["name", "email", "role", "years", "domain", "scope", "why", "timezone"];

export default function BecomeAReviewerPage() {
  const [v, setV] = useState<Vals>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof Vals) => (val: string) => setV((p) => ({ ...p, [k]: val }));
  const ok = REQUIRED.every((k) => v[k].trim() !== "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reviewer", ...v }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again, or email team@orcred.com.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Frame>
      <Head
        eyebrow="Founding reviewers"
        title={["Become a reviewer."]}
        lede="You've been in enough rooms to know within 60 seconds. That instinct is what Orcred is built on."
        meta={["5 spots remaining", "Takes about 5 minutes"]}
      />

      {/* What you get + eligibility */}
      <Block id="role" soft>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Rise className="h-full">
            <div className="orx-card h-full p-7 sm:p-8">
              <L style={{ display: "block", marginBottom: 20 }}>What you get</L>
              <div className="orx-rows">
                {PERKS.map((p, i) => (
                  <div
                    key={p.k}
                    className="flex items-baseline justify-between gap-6"
                    style={{ paddingTop: i === 0 ? 0 : 16, paddingBottom: 16 }}
                  >
                    <span style={{ ...T.fine, fontSize: 15 }}>{p.k}</span>
                    <span style={{ ...T.title, fontSize: 17, textAlign: "right" }}>{p.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Rise>

          <Rise delay={0.1} className="h-full">
            <div className="orx-card h-full p-7 sm:p-8">
              <L style={{ display: "block", marginBottom: 20 }}>Who we&apos;re looking for</L>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }} className="flex flex-col gap-4">
                {ELIGIBILITY.map((item) => (
                  <li key={item} className="flex items-start gap-3.5">
                    <span
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 22, height: 22, borderRadius: 999,
                        backgroundColor: "var(--or-soft)", color: "var(--or)", marginTop: 1,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                        <path d="M3 7.2 5.6 9.8 11 4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span style={{ ...T.body, margin: 0 }}>{item}</span>
                  </li>
                ))}
              </ul>
              <p style={{ ...T.fine, marginTop: 22 }}>
                Applications are read personally by the founding team. If you&apos;re a fit, we&apos;ll
                propose a short calibration call.
              </p>
            </div>
          </Rise>
        </div>
      </Block>

      {/* Application */}
      <Block id="application" eyebrow="Application">
        <AnimatePresence mode="wait">
          {sent ? (
            <Done
              key="done"
              title={["Application received."]}
              body="We review every application personally. If you're a fit, we'll reach out to schedule a short calibration call."
            >
              <Rise delay={0.4} className="mt-9 flex flex-wrap gap-x-8 gap-y-4">
                <Arrow href="/">Back to home</Arrow>
                <Arrow href="/contact">Ask us something</Arrow>
              </Rise>
            </Done>
          ) : (
            <motion.form
              key="form"
              onSubmit={submit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{ maxWidth: 620 }}
            >
              <Field id="name" label="Full name" required>
                <input id="name" className="orx-input" autoComplete="name" required
                  value={v.name} onChange={(e) => set("name")(e.target.value)} placeholder="Your name" />
              </Field>

              <Field id="email" label="Email" required>
                <input id="email" type="email" className="orx-input" autoComplete="email" required
                  value={v.email} onChange={(e) => set("email")(e.target.value)} placeholder="you@example.com" />
              </Field>

              <Field id="role" label="Current role and company" required>
                <input id="role" className="orx-input" required
                  value={v.role} onChange={(e) => set("role")(e.target.value)} placeholder="Senior ML Engineer at Stripe" />
              </Field>

              <Field id="linkedin" label="LinkedIn or GitHub">
                <input id="linkedin" type="url" className="orx-input"
                  value={v.linkedin} onChange={(e) => set("linkedin")(e.target.value)} placeholder="linkedin.com/in/you" />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-5">
                <Field id="years" label="Years in AI/ML" required>
                  <input id="years" className="orx-input" required
                    value={v.years} onChange={(e) => set("years")(e.target.value)} placeholder="6 years" />
                </Field>

                <Field id="domain" label="Specialisation" required>
                  <input id="domain" className="orx-input" required
                    value={v.domain} onChange={(e) => set("domain")(e.target.value)} placeholder="NLP, MLOps, LLMs" />
                </Field>
              </div>

              <Field
                id="scope" label="What work do you review best?" required
                hint="We match candidates to reviewers by domain, so please be specific."
              >
                <textarea id="scope" rows={4} className="orx-input" required
                  value={v.scope} onChange={(e) => set("scope")(e.target.value)}
                  placeholder="The domain, stack and type of projects you're most equipped to evaluate." />
              </Field>

              <Field id="why" label="Why do you want to review for Orcred?" required>
                <textarea id="why" rows={4} className="orx-input" required
                  value={v.why} onChange={(e) => set("why")(e.target.value)} placeholder="You can be direct." />
              </Field>

              <Field
                id="timezone" label="Timezone and availability" required
                hint="We'll use this to propose a calibration call time."
              >
                <input id="timezone" className="orx-input" required
                  value={v.timezone} onChange={(e) => set("timezone")(e.target.value)}
                  placeholder="IST — weekday evenings, weekend mornings" />
              </Field>

              <Submit
                label="Submit application"
                busy={busy}
                disabled={!ok}
                error={error}
                note={
                  <>
                    Your information is handled under our{" "}
                    <a href="/privacy" className="orx-ref">Privacy Policy</a>.
                  </>
                }
              />
            </motion.form>
          )}
        </AnimatePresence>
      </Block>
    </Frame>
  );
}
