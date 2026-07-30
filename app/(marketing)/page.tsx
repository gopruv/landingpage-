"use client";

import HeroSection from "@/components/HeroSection";
import PlatformSection from "@/components/PlatformSection";
import ProcessSection from "@/components/ProcessSection";
import ScoresSection from "@/components/ScoresSection";
import ComparisonSection from "@/components/ComparisonSection";
import CtaSection from "@/components/CtaSection";
import ScrollProgress from "@/components/ScrollProgress";

export default function Home() {
  return (
    <>
      <ScrollProgress />

      <main>
        {/* 1 · Brand statement — the hero */}
        <HeroSection onApply={() => {}} />

        {/* 2 · The problem / the cost / the fix */}
        <PlatformSection />

        {/* 3 · The Score — formal assessment framework */}
        <ScoresSection />

        {/* 4 · Process — how the review works */}
        <ProcessSection />

        {/* 5 · Why Orcred — comparison vs alternatives */}
        <ComparisonSection />

        {/* 6 · Final CTA */}
        <CtaSection />
      </main>
    </>
  );
}
