"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Frame from "@/components/orx/Frame";
import { Block, Chips, Done, Field, Head, Submit } from "@/components/orx/Sheet";
import { Arrow, EASE, L, Rise, T } from "@/components/orx/kit";
import { DOMAIN_TAGS, DEGREE_OPTIONS, REFERRAL_SOURCE_OPTIONS } from "@/lib/form-constants";
import { api, ApiError } from "@/lib/api";

const MAX_DOMAINS = 3;
const MIN_MOTIVATION = 20;

function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return true;
  return raw.trim().startsWith("+") && digits.length >= 11 && digits.length <= 15;
}

const PREP = [
  { label: "Prepare a GitHub repo", sub: "A real AI/ML project you built — not a tutorial clone." },
  { label: "Record a Loom walkthrough", sub: "3–5 minutes on what you built, a key decision, and what broke." },
  { label: "Watch your inbox", sub: "We email before launch, and again when applications open." },
];

export default function JoinWaitlistPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [degree, setDegree] = useState("");
  const [referral, setReferral] = useState("");
  const [motivation, setMotivation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const toggle = (tag: string) => {
    setError(null);
    setDomains((prev) => {
      if (prev.includes(tag)) {
        if (tag === "Other") setCustom("");
        return prev.filter((t) => t !== tag);
      }
      if (prev.length >= MAX_DOMAINS) return prev;
      return [...prev, tag];
    });
  };

  const resolved = domains.flatMap((t) =>
    t === "Other" ? (custom.trim() ? [custom.trim()] : []) : [t],
  );

  const ok =
    fullName.trim() !== "" &&
    email.trim() !== "" &&
    isValidPhone(phone) &&
    domains.length > 0 &&
    degree !== "" &&
    referral !== "" &&
    motivation.trim().length >= MIN_MOTIVATION &&
    (!domains.includes("Other") || custom.trim() !== "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await api.waitlist.submit({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        domains: resolved,
        degree,
        referral_source: referral,
        motivation: motivation.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Frame>
      <Head
        eyebrow="Early access"
        title={["Join the waitlist."]}
        lede="Two minutes. Tell us who you are and what you build. Applications open at launch, and applicants who show up ready get priority."
        meta={["Takes about 2 minutes", "No payment now"]}
      />

      <Block id="registration">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-14 lg:gap-x-16">
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {done ? (
                <Done
                  key="done"
                  title={["You're on the list."]}
                  body="Check your inbox for a confirmation email. We'll write again the moment applications open."
                >
                  <Rise delay={0.4} className="mt-9 flex flex-wrap gap-x-8 gap-y-4">
                    <Arrow href="/">Back to home</Arrow>
                    <Arrow href="/how-it-works">See how it works</Arrow>
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
                  style={{ maxWidth: 580 }}
                >
                  <Field id="full_name" label="Full name" required>
                    <input id="full_name" className="orx-input" autoComplete="name" required
                      value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                  </Field>

                  <Field id="email" label="Email" required>
                    <input id="email" type="email" className="orx-input" autoComplete="email" required
                      value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" />
                  </Field>

                  <Field id="phone" label="Phone" required hint="WhatsApp or SMS — we may reach out about launch">
                    <input id="phone" type="tel" className="orx-input" autoComplete="tel" inputMode="tel" required
                      value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210 or +91 98765 43210" />
                  </Field>

                  <Field
                    id="domains" label="What do you build?" required
                    hint={`Pick up to ${MAX_DOMAINS} — ${domains.length} of ${MAX_DOMAINS} selected`}
                  >
                    <Chips
                      options={DOMAIN_TAGS}
                      selected={domains}
                      onToggle={toggle}
                      atMax={domains.length >= MAX_DOMAINS}
                    />
                    {domains.includes("Other") && (
                      <input
                        className="orx-input"
                        style={{ marginTop: 14 }}
                        value={custom}
                        onChange={(e) => setCustom(e.target.value)}
                        placeholder="Describe your domain"
                        aria-label="Describe your domain"
                      />
                    )}
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-5">
                    <Field id="degree" label="Degree or background" required>
                      <select id="degree" className="orx-input" required
                        value={degree} onChange={(e) => setDegree(e.target.value)}>
                        <option value="">Select…</option>
                        {DEGREE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </Field>

                    <Field id="referral_source" label="Where did you find us?" required>
                      <select id="referral_source" className="orx-input" required
                        value={referral} onChange={(e) => setReferral(e.target.value)}>
                        <option value="">Select…</option>
                        {REFERRAL_SOURCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </Field>
                  </div>

                  <Field
                    id="motivation" label="Why do you want Orcred verification?" required
                    hint={`${motivation.trim().length} characters — ${MIN_MOTIVATION} minimum`}
                  >
                    <textarea id="motivation" rows={5} className="orx-input" required maxLength={2000}
                      value={motivation} onChange={(e) => setMotivation(e.target.value)}
                      placeholder="What are you building, and why does a live expert review matter to you?" />
                  </Field>

                  <Submit
                    label="Join the waitlist"
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
          </div>

          {/* While you wait */}
          <div className="lg:col-span-5">
            <div className="orx-card p-7 sm:p-8">
              <L style={{ display: "block", marginBottom: 22 }}>While you wait</L>

              <ol style={{ listStyle: "none", margin: 0, padding: 0 }} className="flex flex-col gap-6">
                {PREP.map((item, i) => (
                  <li key={item.label} className="flex items-start gap-4">
                    <span
                      className="flex items-center justify-center flex-shrink-0 orx-num"
                      style={{
                        width: 28, height: 28, borderRadius: 999,
                        backgroundColor: "var(--or-soft)", color: "var(--or)",
                        fontSize: 14, fontWeight: 500, marginTop: 1,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>
                      <span style={{ ...T.title, fontSize: 18, display: "block", marginBottom: 5 }}>
                        {item.label}
                      </span>
                      <span style={{ ...T.body, fontSize: 15.5 }}>{item.sub}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-8 flex flex-col items-start gap-5">
              <Arrow href="/how-it-works">See how verification works</Arrow>
              <Arrow href="/#standard">Read the scoring standard</Arrow>
            </div>
          </div>
        </div>
      </Block>
    </Frame>
  );
}
