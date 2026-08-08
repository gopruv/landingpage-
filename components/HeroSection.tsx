"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface HeroProps { onApply: () => void; }

const ease = [0.22, 1, 0.36, 1] as const;

export default function HeroSection({ onApply: _ }: HeroProps) {
  return (
    <section
      id="hero-section"
      style={{
        backgroundColor: "var(--bg-page)",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        paddingTop: "60px",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 w-full py-16">

        {/* Eyebrow */}
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-6 h-px" style={{ backgroundColor: "#eb4511" }} />
          <span className="font-label-sm uppercase tracking-[0.3em] text-[10px]" style={{ color: "#eb4511" }}>
            AI · ML Verification Standard
          </span>
        </motion.div>

        {/* Two-column row: headline left, body right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-10">

          {/* Left: headline */}
          <motion.div
            style={{
              fontSize:      "clamp(30px, 3.6vw, 48px)",
              fontWeight:    400,
              letterSpacing: "-0.02em",
              lineHeight:    1.15,
              color:         "#0f0d0c",
            }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease }}
          >
            The verification standard<br />
            for AI/ML engineers.
          </motion.div>

          {/* Right: body */}
          <motion.div
            style={{
              fontSize:   "clamp(13px, 1.1vw, 15px)",
              fontWeight: 400,
              lineHeight: 1.85,
              color:      "rgba(15,13,12,0.55)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease }}
          >
            A live 45-minute technical review with a senior engineer who has read your code and watched your walkthrough. One score. One credential. Delivered in 24 hours.
            <div style={{ marginTop: 20, fontStyle: "italic", color: "rgba(15,13,12,0.38)", fontSize: "clamp(12px, 1vw, 14px)" }}>
              The standard does not move.
            </div>
          </motion.div>

        </div>

        {/* CTAs */}
        <motion.div
          className="flex flex-wrap items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link
            href="/join-waitlist"
            className="inline-flex items-center px-6 py-2.5 font-label-sm uppercase tracking-[0.2em] text-[11px] transition-all duration-200"
            style={{ backgroundColor: "#eb4511", color: "#ffffff", border: "1px solid #eb4511", borderRadius: "50px", transition: "opacity 0.15s ease" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "0.8")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            Apply for Verification
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2.5 px-5 py-2.5 font-label-sm uppercase tracking-[0.2em] text-[11px] transition-all duration-200"
            style={{ border: "1px solid #0f0d0c", backgroundColor: "transparent", color: "#0f0d0c", borderRadius: "50px", transition: "opacity 0.15s ease" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "0.6")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            How it works
            <span style={{ letterSpacing: 0, color: "inherit" }}>→</span>
          </Link>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          className="flex flex-wrap items-center gap-0 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.52 }}
        >
          {[
            { value: "40–60%", label: "Pass rate" },
            { value: "40 min",  label: "Live review" },
            { value: "24 hrs",  label: "Turnaround" },
          ].map((s, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ paddingRight: 20 }}>
                <div style={{ fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 600, letterSpacing: "-0.02em", color: "#0f0d0c", lineHeight: 1, marginBottom: 5 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15,13,12,0.38)" }}>
                  {s.label}
                </div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ width: 1, height: 28, backgroundColor: "rgba(15,13,12,0.12)", marginRight: 20 }} />
              )}
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
