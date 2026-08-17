import { Navbar } from "@/components/homepage/Navbar";
import { Hero } from "@/components/homepage/Hero";
import { Features } from "@/components/homepage/Features";
import { AISection } from "@/components/homepage/AISection";
import { Pricing } from "@/components/homepage/Pricing";
import { CTA } from "@/components/homepage/CTA";
import { Footer } from "@/components/homepage/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden">
        <Hero />
        <Features />
        <AISection />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
