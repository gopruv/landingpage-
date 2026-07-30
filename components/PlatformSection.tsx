"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const panels = [
  {
    num: "01", eyebrow: "The Problem",
    headline: "Everyone has a project.",
    body: "Someone spent six months building something real. Someone else spent a weekend prompting ChatGPT. Right now their portfolios look identical — and that gap is costing real builders their careers.",
  },
  {
    num: "02", eyebrow: "The Session",
    headline: "40 minutes. One engineer. Your work.",
    body: "Not a quiz. Not a take-home test. A real conversation about the project you built, every decision you made, every tradeoff you chose. The ones who built it for real talk about it differently.",
  },
  {
    num: "03", eyebrow: "The Proof",
    headline: "Now there's proof.",
    body: "An Orcred Score. A verified credential backed by a senior engineer's sign-off. Something you carry into any room — a real engineer reviewed this work. It passed.",
  },
];

/* ── Signal grid — white on orange ── */
function SignalGrid() {
  const total = 24; const signal = 13;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 26 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width:           i === signal ? 16 : 10,
          height:          i === signal ? 16 : 10,
          borderRadius:    "50%",
          backgroundColor: i === signal ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.22)",
          boxShadow:       i === signal ? "0 0 18px 6px rgba(255,255,255,0.16)" : "none",
          alignSelf: "center", justifySelf: "center",
        }} />
      ))}
    </div>
  );
}

/* ── Clock — white on orange ── */
function ClockVisual() {
  const r = 88;
  const ticks = [0, 90, 180, 270].map(deg => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return {
      x1: 110 + (r - 8) * Math.cos(rad), y1: 110 + (r - 8) * Math.sin(rad),
      x2: 110 + (r + 4) * Math.cos(rad), y2: 110 + (r + 4) * Math.sin(rad),
    };
  });
  return (
    <div style={{ position: "relative", width: 220, height: 220 }}>
      <svg viewBox="0 0 220 220" style={{ width: "100%", height: "100%", overflow: "visible" }}>
        <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        ))}
        {["0", "15", "30", "45"].map((label, i) => {
          const rad = (i * 90 - 90) * Math.PI / 180;
          return (
            <text key={i}
              x={110 + (r + 16) * Math.cos(rad)} y={110 + (r + 16) * Math.sin(rad)}
              textAnchor="middle" dominantBaseline="central"
              style={{ fill: "rgba(255,255,255,0.35)", fontSize: "10px", letterSpacing: "0.05em" }}
            >{label}</text>
          );
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1, color: "rgba(255,255,255,0.96)" }}>40</div>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginTop: 6 }}>minutes</div>
      </div>
    </div>
  );
}

/* ── Score bars — white on orange ── */
function ScoreVisual() {
  const bars = [
    { label: "Technical Depth", w: "91%" },
    { label: "Communication",   w: "84%" },
    { label: "Reproducibility", w: "88%" },
    { label: "Problem solving", w: "79%" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 260 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5 }}>
        <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1, color: "rgba(255,255,255,0.96)" }}>87</div>
        <div style={{ fontSize: 22, color: "rgba(255,255,255,0.55)", fontWeight: 400, marginBottom: 9 }}>/100</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {bars.map(b => (
          <div key={b.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>{b.label}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{b.w}</div>
            </div>
            <div style={{ height: 2, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: b.w, backgroundColor: "rgba(255,255,255,0.7)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Single card ── */
function PanelCard({
  panel,
  visual,
  index,
}: {
  panel: (typeof panels)[number];
  visual: React.ReactNode;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div>
      {/* Card — solid orange, visual inside, title at bottom */}
      <motion.div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.7, delay: index * 0.1, ease }}
        style={{
          backgroundColor: "#eb4511",
          borderRadius:     "20px",
          overflow:         "hidden",
          position:         "relative",
          height:           "360px",
          transform:        hovered ? "translateY(-6px)" : "translateY(0px)",
          boxShadow:        hovered
            ? "0 28px 56px rgba(235,69,17,0.28), 0 6px 16px rgba(235,69,17,0.16)"
            : "0 4px 18px rgba(235,69,17,0.16)",
          transition: "transform 0.38s cubic-bezier(0.22,1,0.36,1), box-shadow 0.38s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Visual — centred, sits above the title */}
        <div style={{
          position: "absolute",
          inset: 0,
          bottom: "95px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}>
          {visual}
        </div>

        {/* Title pinned to card bottom */}
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          padding: "0 24px 26px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>{panel.num}</div>
            <div style={{ width: 12, height: 1, background: "rgba(255,255,255,0.28)" }} />
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
              {panel.eyebrow}
            </div>
          </div>
          <div style={{
            fontSize:      "clamp(17px, 1.7vw, 23px)",
            fontWeight:    500,
            letterSpacing: "-0.02em",
            lineHeight:    1.15,
            color:         "#ffffff",
          }}>
            {panel.headline}
          </div>
        </div>
      </motion.div>

      {/* Body text — outside the card, below */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, delay: index * 0.1 + 0.2, ease }}
        style={{ paddingTop: "18px" }}
      >
        <div style={{
          fontSize:   "clamp(13px, 1vw, 14px)",
          fontWeight: 400,
          lineHeight: 1.8,
          color:      "rgba(15,13,12,0.55)",
        }}>
          {panel.body}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Section ── */
export default function PlatformSection() {
  const visuals = [
    <SignalGrid  key={0} />,
    <ClockVisual key={1} />,
    <ScoreVisual key={2} />,
  ];

  return (
    <section
      id="story"
      className="py-14 sm:py-16 px-6 sm:px-10 lg:px-16"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      <div className="max-w-[1400px] mx-auto">

        {/* Section heading */}
        <motion.div
          className="mb-10 sm:mb-12"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease }}
        >
          <div style={{
            fontSize:      "clamp(22px, 2.8vw, 38px)",
            fontWeight:    400,
            letterSpacing: "-0.02em",
            lineHeight:    1.1,
            color:         "#0f0d0c",
            marginBottom:  "12px",
          }}>
            The verification gap.
          </div>
          <div style={{
            fontSize:   "clamp(14px, 1.2vw, 16px)",
            fontWeight: 400,
            lineHeight: 1.7,
            color:      "rgba(15,13,12,0.55)",
            maxWidth:   "480px",
          }}>
            The problem, the session, the proof — how Orcred closes the gap between doing the work and being believed.
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {panels.map((panel, i) => (
            <PanelCard key={i} panel={panel} visual={visuals[i]} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
