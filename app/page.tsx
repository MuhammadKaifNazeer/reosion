import { LandingNavbar } from "@/components/landing/navbar";
import { LandingHero } from "@/components/landing/hero";
import { LandingExamples } from "@/components/landing/examples";
import { LandingFlow } from "@/components/landing/flow";
import { LandingFeatures } from "@/components/landing/features";
import { LandingLocalFirst } from "@/components/landing/local-first";
import { LandingAI } from "@/components/landing/ai";
import { LandingCTA } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingExamples />
        <LandingFlow />
        <LandingFeatures />
        <LandingLocalFirst />
        <LandingAI />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}