"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Breadcrumb from "@/components/Breadcrumb";
import { DOMAIN_TAGS, DEGREE_OPTIONS, REFERRAL_SOURCE_OPTIONS } from "@/lib/form-constants";
import { api, ApiError } from "@/lib/api";

const ease = [0.22, 1, 0.36, 1] as const;
const MAX_DOMAINS = 3;

const prepTips = [
  {
    label: "Prepare a GitHub repo",
    sub: "A real AI/ML project you built — not a tutorial clone.",
  },
  {
    label: "Record a Loom walkthrough",
    sub: "3–5 minutes on what you built, a key decision, and what broke.",
  },
  {
    label: "Watch your inbox",
    sub: "We'll email before launch and again when applications open.",
  },
];

const SUCCESS_LINKS = [
  { href: "/", label: "Back to home" },
  { href: "/how-it-works", label: "See how it works" },
  { href: "/who-we-are", label: "About Orcred" },
  { href: "/become-a-reviewer", label: "Become a reviewer" },
] as const;

function Field({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: "block",
          marginBottom: "6px",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          color: "rgba(15,13,12,0.55)",
        }}
      >
        {label}
        {required && <span style={{ color: "#eb4511", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {hint && (
        <div
          style={{
            marginTop: "6px",
            fontSize: "11px",
            lineHeight: 1.65,
            color: "rgba(15,13,12,0.4)",
            fontStyle: "italic",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function useFocusedInputStyle(focused: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 14px",
    background: "#fdfcfa",
    border: `1.5px solid ${focused ? "#eb4511" : "rgba(15,13,12,0.16)"}`,
    borderRadius: "2px",
    color: "#0f0d0c",
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 400,
    fontSize: "14px",
    lineHeight: 1.65,
    outline: "none",
    transition: "border-color 0.2s ease",
    display: "block",
  };
}

function SuccessView() {
  return (
    <motion.div
      className="flex flex-col items-start gap-8 py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease }}
    >
      <div className="relative w-[56px] h-[56px]">
        <div className="absolute inset-0 rounded-full border" style={{ borderColor: "var(--orange-dim)" }} />
        <div className="absolute inset-[7px] rounded-full border" style={{ borderColor: "var(--orange-tint)" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-[11px] h-[11px] rounded-full"
            style={{ background: "#eb4511", boxShadow: "0 0 14px 4px var(--orange-dim)" }}
          />
        </div>
      </div>

      <div>
        <div
          className="font-label-sm uppercase tracking-[0.42em] text-[9px] mb-5"
          style={{ color: "var(--orange-faint)" }}
        >
          You&apos;re on the list
        </div>
        <div
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(32px, 4vw, 52px)",
            lineHeight: 1.05,
            color: "var(--fg)",
          }}
        >
          Thanks for joining
          <br />
          <span style={{ fontStyle: "italic", fontWeight: 300, color: "var(--fg-muted)" }}>
            the waitlist.
          </span>
        </div>
      </div>

      <div className="w-8 h-px" style={{ background: "#eb4511", opacity: 0.7 }} />

      <div
        style={{
          fontSize: "13px",
          fontWeight: 400,
          lineHeight: 1.9,
          color: "var(--fg-muted)",
          maxWidth: "420px",
        }}
      >
        Check your inbox for a confirmation email. Early applicants who show up ready get priority when we launch.
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        {prepTips.map((item, i) => (
          <div
            key={item.label}
            style={{
              padding: "14px 16px",
              background: "rgba(250,247,242,0.8)",
              border: "1px solid rgba(15,13,12,0.09)",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f0d0c", letterSpacing: "-0.01em" }}>
              {i + 1}. {item.label}
            </div>
            <div style={{ fontSize: "11px", fontWeight: 400, color: "rgba(15,13,12,0.45)", marginTop: "2px" }}>
              {item.sub}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          width: "100%",
          paddingTop: 8,
          borderTop: "1px solid rgba(15,13,12,0.09)",
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {SUCCESS_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="font-label-sm uppercase tracking-[0.16em] text-[10px] transition-all duration-200"
            style={{
              padding: "10px 20px",
              backgroundColor: link.href === "/" ? "#eb4511" : "#ffffff",
              color: link.href === "/" ? "#ffffff" : "rgba(15,13,12,0.65)",
              border: link.href === "/" ? "none" : "1px solid rgba(15,13,12,0.14)",
              borderRadius: "50px",
              textDecoration: "none",
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

export default function JoinWaitlistPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [customDomain, setCustomDomain] = useState("");
  const [degree, setDegree] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [motivation, setMotivation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [otherFocused, setOtherFocused] = useState(false);
  const [degreeFocused, setDegreeFocused] = useState(false);
  const [referralFocused, setReferralFocused] = useState(false);
  const [motivationFocused, setMotivationFocused] = useState(false);

  const nameStyle = useFocusedInputStyle(nameFocused);
  const emailStyle = useFocusedInputStyle(emailFocused);
  const otherStyle = useFocusedInputStyle(otherFocused);
  const degreeStyle = useFocusedInputStyle(degreeFocused);
  const referralStyle = useFocusedInputStyle(referralFocused);
  const motivationStyle: React.CSSProperties = {
    ...useFocusedInputStyle(motivationFocused),
    padding: "11px 14px",
    resize: "none",
  };

  const toggleDomain = (tag: string) => {
    setError("");
    if (selectedDomains.includes(tag)) {
      setSelectedDomains((prev) => prev.filter((t) => t !== tag));
      if (tag === "Other") setCustomDomain("");
      return;
    }
    if (selectedDomains.length >= MAX_DOMAINS) {
      setError(`You can select up to ${MAX_DOMAINS} domains.`);
      return;
    }
    setSelectedDomains((prev) => [...prev, tag]);
  };

  const resolvedDomains = selectedDomains.flatMap((tag) => {
    if (tag === "Other") {
      const custom = customDomain.trim();
      return custom ? [custom] : [];
    }
    return [tag];
  });

  const canSubmit =
    fullName.trim() !== "" &&
    email.trim() !== "" &&
    selectedDomains.length > 0 &&
    degree !== "" &&
    referralSource !== "" &&
    motivation.trim().length >= 20 &&
    (!selectedDomains.includes("Other") || customDomain.trim() !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedDomains.length === 0) {
      setError("Select at least one project domain.");
      return;
    }
    if (selectedDomains.includes("Other") && !customDomain.trim()) {
      setError("Describe your domain when selecting Other.");
      return;
    }
    if (motivation.trim().length < 20) {
      setError("Tell us a bit more about why you want to join (at least 20 characters).");
      return;
    }

    setLoading(true);
    try {
      await api.waitlist.submit({
        full_name: fullName.trim(),
        email: email.trim(),
        domains: resolvedDomains,
        degree,
        referral_source: referralSource,
        motivation: motivation.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-page)" }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% 0%, var(--orange-tint) 0%, transparent 65%)",
        }}
      />

      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Join waitlist" }]} />

      <div className="relative z-10 flex-1 w-full max-w-[1200px] mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left: editorial */}
          <div className="lg:col-span-4 lg:sticky lg:top-[80px]">
            <motion.div
              className="flex items-center gap-3 mb-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
            >
              <div className="w-5 h-px" style={{ backgroundColor: "#eb4511" }} />
              <span
                className="font-label-sm uppercase tracking-[0.38em] text-[9px]"
                style={{ color: "#eb4511" }}
              >
                Early access
              </span>
            </motion.div>

            <motion.div
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 400,
                fontSize: "clamp(30px, 3.5vw, 48px)",
                lineHeight: 1.05,
                color: "var(--fg)",
                marginBottom: "16px",
              }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease }}
            >
              Join the waitlist.
            </motion.div>

            <motion.div
              style={{
                fontSize: "14px",
                fontWeight: 400,
                lineHeight: 1.85,
                color: "var(--fg-muted)",
                marginBottom: "32px",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              ~2 minutes. Tell us who you are and what you build. Full applications — GitHub, Loom, live review — open at launch.
            </motion.div>

            <motion.div
              style={{
                padding: "14px 16px",
                marginBottom: "28px",
                backgroundColor: "rgba(235,69,17,0.05)",
                border: "1px solid rgba(235,69,17,0.22)",
                borderLeft: "3px solid #eb4511",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.25 }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  color: "#eb4511",
                  marginBottom: "4px",
                }}
              >
                Launching soon
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 400,
                  lineHeight: 1.65,
                  color: "rgba(15,13,12,0.58)",
                }}
              >
                Join now and get a head start on prep. Ready applicants get priority.
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.3 }}
            >
              <div
                className="font-label-sm uppercase tracking-[0.3em] text-[9px] mb-4"
                style={{ color: "rgba(15,13,12,0.4)" }}
              >
                While you wait
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>
                {prepTips.map((p) => (
                  <div key={p.label} className="flex items-start gap-3">
                    <div
                      className="mt-[5px] w-[5px] h-[5px] rounded-full flex-shrink-0"
                      style={{ background: "#eb4511", opacity: 0.7 }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#0f0d0c",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {p.label}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 400,
                          color: "rgba(15,13,12,0.45)",
                          marginTop: "1px",
                        }}
                      >
                        {p.sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="mt-8 pt-8"
              style={{ borderTop: "1px solid rgba(15,13,12,0.09)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.4 }}
            >
              <div
                className="font-label-sm uppercase tracking-[0.3em] text-[9px] mb-4"
                style={{ color: "rgba(15,13,12,0.4)" }}
              >
                Explore
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                {[
                  { href: "/how-it-works", label: "See how verification works" },
                  { href: "/who-we-are", label: "About Orcred" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#eb4511",
                      textDecoration: "none",
                    }}
                  >
                    {link.label} →
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: form card */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.15, ease }}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(15,13,12,0.11)",
                boxShadow: "0 2px 24px rgba(15,13,12,0.05)",
              }}
            >
              <div
                style={{
                  padding: "22px 32px 20px",
                  borderBottom: "1px solid rgba(15,13,12,0.09)",
                  backgroundColor: "rgba(250,247,242,0.6)",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(16px, 1.8vw, 20px)",
                    fontWeight: 600,
                    color: "#0f0d0c",
                    letterSpacing: "-0.015em",
                  }}
                >
                  Waitlist signup
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "rgba(15,13,12,0.45)",
                    marginTop: "3px",
                  }}
                >
                  Takes about 2 minutes. We&apos;ll email you when applications open.
                </div>
              </div>

              <div style={{ padding: "32px 32px 28px" }}>
                <AnimatePresence mode="wait">
                  {done ? (
                    <SuccessView key="success" />
                  ) : (
                    <motion.form
                      key="form"
                      onSubmit={handleSubmit}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: "24px" }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <Field id="full_name" label="Full name" required>
                            <input
                              id="full_name"
                              required
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Your name"
                              onFocus={() => setNameFocused(true)}
                              onBlur={() => setNameFocused(false)}
                              style={nameStyle}
                              className="placeholder:text-[rgba(15,13,12,0.28)]"
                            />
                          </Field>
                          <Field id="email" label="Email" required>
                            <input
                              id="email"
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@university.edu"
                              onFocus={() => setEmailFocused(true)}
                              onBlur={() => setEmailFocused(false)}
                              style={emailStyle}
                              className="placeholder:text-[rgba(15,13,12,0.28)]"
                            />
                          </Field>
                        </div>

                        <Field
                          id="domains"
                          label="Project domains"
                          required
                          hint={`Select up to ${MAX_DOMAINS} — ${selectedDomains.length}/${MAX_DOMAINS} selected`}
                        >
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {DOMAIN_TAGS.map((tag) => {
                              const active = selectedDomains.includes(tag);
                              const atMax = selectedDomains.length >= MAX_DOMAINS && !active;
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => toggleDomain(tag)}
                                  disabled={atMax}
                                  style={{
                                    padding: "6px 12px",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    border: active
                                      ? "1.5px solid #eb4511"
                                      : "1px solid rgba(15,13,12,0.15)",
                                    background: active ? "rgba(235,69,17,0.08)" : "#fff",
                                    color: active
                                      ? "#eb4511"
                                      : atMax
                                        ? "rgba(15,13,12,0.3)"
                                        : "rgba(15,13,12,0.65)",
                                    cursor: atMax ? "not-allowed" : "pointer",
                                    borderRadius: 2,
                                    opacity: atMax ? 0.6 : 1,
                                  }}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                          {selectedDomains.includes("Other") && (
                            <input
                              value={customDomain}
                              onChange={(e) => setCustomDomain(e.target.value)}
                              placeholder="Describe your domain"
                              onFocus={() => setOtherFocused(true)}
                              onBlur={() => setOtherFocused(false)}
                              style={{ ...otherStyle, marginTop: 10 }}
                              className="placeholder:text-[rgba(15,13,12,0.28)]"
                            />
                          )}
                        </Field>

                        <Field id="degree" label="Degree / background" required>
                          <select
                            id="degree"
                            required
                            value={degree}
                            onChange={(e) => setDegree(e.target.value)}
                            onFocus={() => setDegreeFocused(true)}
                            onBlur={() => setDegreeFocused(false)}
                            style={{ ...degreeStyle, cursor: "pointer" }}
                          >
                            <option value="">Select…</option>
                            {DEGREE_OPTIONS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field id="referral_source" label="Where did you find us?" required>
                          <select
                            id="referral_source"
                            required
                            value={referralSource}
                            onChange={(e) => setReferralSource(e.target.value)}
                            onFocus={() => setReferralFocused(true)}
                            onBlur={() => setReferralFocused(false)}
                            style={{ ...referralStyle, cursor: "pointer" }}
                          >
                            <option value="">Select…</option>
                            {REFERRAL_SOURCE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field
                          id="motivation"
                          label="Why do you want Orcred verification?"
                          required
                          hint={`${motivation.length}/2000 · min 20 characters`}
                        >
                          <textarea
                            id="motivation"
                            required
                            rows={4}
                            value={motivation}
                            onChange={(e) => setMotivation(e.target.value)}
                            placeholder="What are you building, and why does a live expert review matter for you?"
                            onFocus={() => setMotivationFocused(true)}
                            onBlur={() => setMotivationFocused(false)}
                            style={motivationStyle}
                            className="placeholder:text-[rgba(15,13,12,0.28)]"
                          />
                        </Field>
                      </div>

                      <div
                        style={{
                          marginTop: "32px",
                          paddingTop: "24px",
                          borderTop: "1px solid rgba(15,13,12,0.09)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap" as const,
                          gap: "12px",
                        }}
                      >
                        <div style={{ fontSize: "11px", fontWeight: 400, color: "rgba(15,13,12,0.35)" }}>
                          Fields marked <span style={{ color: "#eb4511" }}>*</span> are required
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          {error && (
                            <div
                              className="font-label-sm text-[9px] tracking-[0.2em]"
                              style={{ color: "#eb4511" }}
                            >
                              {error}
                            </div>
                          )}
                          <motion.button
                            type="submit"
                            disabled={loading || !canSubmit}
                            className="font-label-sm uppercase tracking-[0.2em] text-[11px] transition-all duration-200"
                            style={{
                              padding: "10px 28px",
                              backgroundColor: canSubmit && !loading ? "#eb4511" : "rgba(15,13,12,0.07)",
                              color: canSubmit && !loading ? "#ffffff" : "rgba(15,13,12,0.25)",
                              border: "none",
                              borderRadius: "50px",
                              cursor: canSubmit && !loading ? "pointer" : "default",
                              transition: "opacity 0.15s ease",
                            }}
                            onMouseEnter={(e) =>
                              canSubmit && !loading && ((e.currentTarget as HTMLElement).style.opacity = "0.8")
                            }
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                            whileTap={canSubmit ? { scale: 0.98 } : {}}
                          >
                            {loading ? "Submitting…" : "Join waitlist"}
                          </motion.button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <div className="mt-5" style={{ fontSize: "11px", fontWeight: 400, color: "var(--fg-faint)" }}>
              Your information is handled in accordance with our{" "}
              <a
                href="/privacy"
                style={{
                  color: "rgba(15,13,12,0.45)",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                Privacy Policy
              </a>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
