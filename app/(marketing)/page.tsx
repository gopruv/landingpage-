"use client";

import { useEffect } from "react";

import Frame from "@/components/orx/Frame";
import Hero from "@/components/orx/home/Hero";
import Gap from "@/components/orx/home/Gap";
import Standard from "@/components/orx/home/Standard";
import Procedure from "@/components/orx/home/Procedure";
import Compare from "@/components/orx/home/Compare";
import Questions from "@/components/orx/home/Questions";
import Close from "@/components/orx/home/Close";

export default function Home() {
  // Arriving with /#standard from another page: Next restores scroll before the
  // blocks have laid out, so nudge it once the first frame is painted.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const el = document.querySelector(hash);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() =>
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }),
    );
  }, []);

  return (
    <Frame>
      <Hero />
      <Gap />
      <Standard />
      <Procedure />
      <Compare />
      <Questions />
      <Close />
    </Frame>
  );
}
