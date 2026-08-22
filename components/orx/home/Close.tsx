"use client";

/**
 * Close.
 *
 * One centred statement, one action, and the three facts repeated so the
 * decision can be made without scrolling back. The orange stays in the button
 * and a soft wash — no full-bleed colour field.
 */

import { Arrow, Btn, Lines, Rise, SHELL, T } from "@/components/orx/kit";

const FACTS = ["₹1,999, one time", "45-minute live review", "Result in 24 hours"];

export default function Close() {
  return (
    <section
      id="start"
      className="relative"
      style={{ borderTop: "1px solid var(--line)", overflow: "hidden" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(58% 62% at 50% 108%, rgba(235,69,17,0.13) 0%, rgba(235,69,17,0) 64%)",
        }}
      />

      <div className={`${SHELL} relative py-24 sm:py-32 lg:py-40 text-center`}>
        <h2>
          <Lines
            stagger={0.1}
            style={{ ...T.hero, fontSize: "clamp(34px, 4.6vw, 62px)", margin: "0 auto", maxWidth: 780 }}
            lines={["You built something real.", <span key="p" style={{ color: "var(--or)" }}>Now prove it.</span>]}
          />
        </h2>

        <Rise delay={0.25} className="mt-7" style={{ ...T.lede, maxWidth: 500, margin: "0 auto" }}>
          Join the waitlist and we&apos;ll email you the moment applications open.
        </Rise>

        <Rise delay={0.35} className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
          <Btn href="/join-waitlist" className="!px-7 !py-4 !text-[16px]">
            Join the waitlist
          </Btn>
          <Arrow href="/how-it-works">See how it works</Arrow>
        </Rise>

        <Rise
          delay={0.45}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-3"
        >
          {FACTS.map((f, i) => (
            <span key={f} className="flex items-center gap-3">
              {i > 0 && (
                <span aria-hidden style={{ width: 4, height: 4, borderRadius: 999, backgroundColor: "var(--ink-4)" }} />
              )}
              <span style={{ ...T.fine, fontSize: 15 }}>{f}</span>
            </span>
          ))}
        </Rise>
      </div>
    </section>
  );
}
