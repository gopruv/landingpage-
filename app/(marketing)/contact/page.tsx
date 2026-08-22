"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Frame from "@/components/orx/Frame";
import { Block, Done, Field, Head, Submit } from "@/components/orx/Sheet";
import { Arrow, EASE, L, Rise, T } from "@/components/orx/kit";

const DIRECT = [
  { k: "General enquiries", v: "team@orcred.com" },
  { k: "Privacy and data", v: "contact@orcred.com" },
];

const ELSEWHERE = [
  { label: "Questions we answer most", href: "/#questions" },
  { label: "Apply to review for us", href: "/become-a-reviewer" },
  { label: "Join the waitlist", href: "/join-waitlist" },
];

export default function ContactPage() {
  const [v, setV] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof v) => (val: string) => setV((p) => ({ ...p, [k]: val }));
  const ok = Boolean(v.name.trim() && v.email.trim() && v.message.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "contact", ...v }),
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
        eyebrow="Contact"
        title={["Get in touch."]}
        lede="Every message is read by a founder, and we reply to all of them."
        meta={["Usually within 1–2 days", "No support queue"]}
      />

      <Block id="enquiry">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-14 lg:gap-x-16">
          {/* Form */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {sent ? (
                <Done
                  key="done"
                  title={["Message received."]}
                  body="We read every message personally. Expect a reply from a founder, not a queue."
                >
                  <Rise delay={0.4} className="mt-9 flex flex-wrap gap-x-8 gap-y-4">
                    <Arrow href="/">Back to home</Arrow>
                    <Arrow href="/join-waitlist">Join the waitlist</Arrow>
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
                  style={{ maxWidth: 560 }}
                >
                  <Field id="name" label="Your name" required>
                    <input
                      id="name" className="orx-input" autoComplete="name" required
                      value={v.name} onChange={(e) => set("name")(e.target.value)}
                      placeholder="Priya Sharma"
                    />
                  </Field>

                  <Field id="email" label="Email" required>
                    <input
                      id="email" type="email" className="orx-input" autoComplete="email" required
                      value={v.email} onChange={(e) => set("email")(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </Field>

                  <Field
                    id="message" label="Message" required
                    hint="The more specific you are, the more useful our reply will be."
                  >
                    <textarea
                      id="message" rows={6} className="orx-input" required
                      value={v.message} onChange={(e) => set("message")(e.target.value)}
                      placeholder="What would you like to know?"
                    />
                  </Field>

                  <Submit label="Send message" busy={busy} disabled={!ok} error={error} />
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Direct */}
          <div className="lg:col-span-5">
            <div className="orx-card p-7 sm:p-8">
              <L style={{ display: "block", marginBottom: 20 }}>Or email us directly</L>

              <div className="orx-rows">
                {DIRECT.map((row, i) => (
                  <div key={row.k} style={{ paddingTop: i === 0 ? 0 : 18, paddingBottom: 18 }}>
                    <div style={{ ...T.fine, marginBottom: 6 }}>{row.k}</div>
                    <a href={`mailto:${row.v}`} className="orx-ref" style={{ ...T.title, fontSize: 19 }}>
                      {row.v}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <L style={{ display: "block", marginBottom: 18 }}>You might also want</L>
              <div className="flex flex-col items-start gap-5">
                {ELSEWHERE.map((l) => (
                  <Arrow key={l.href} href={l.href}>{l.label}</Arrow>
                ))}
              </div>
            </div>

            <p style={{ ...T.fine, marginTop: 32 }}>
              Your information is handled under our{" "}
              <a href="/privacy" className="orx-ref">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </Block>
    </Frame>
  );
}
