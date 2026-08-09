"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export default function CtaSection() {
  return (
    <section
      className="px-6 sm:px-10 lg:px-16 py-16 sm:py-20 text-center"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      <div className="max-w-[720px] mx-auto">

        <motion.div
          className="flex items-center justify-center gap-3 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-6 h-px" style={{ backgroundColor: "#eb4511" }} />
          <span className="font-label-sm uppercase tracking-[0.3em] text-[10px]" style={{ color: "#eb4511" }}>
            Get Verified
          </span>
          <div className="w-6 h-px" style={{ backgroundColor: "#eb4511" }} />
        </motion.div>

        <motion.div
          className="mb-10"
          style={{ fontSize: "clamp(22px, 2.8vw, 38px)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.15, color: "#0f0d0c" }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.1, ease }}
        >
          You built something real.<br />Prove it.
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Link
            href="/join-waitlist"
            className="inline-flex items-center px-6 py-2.5 font-label-sm uppercase tracking-[0.2em] text-[11px] transition-all duration-200"
            style={{ backgroundColor: "#eb4511", color: "#ffffff", border: "1px solid #eb4511", borderRadius: "50px", transition: "opacity 0.15s ease" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "0.8")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            Join the Waitlist
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
