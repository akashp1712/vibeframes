import { Topbar } from "@/components/layout/topbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { EngineeringBehindIt } from "@/components/landing/engineering-behind-it";
// import { TechStack } from "@/components/landing/tech-stack";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Topbar />
      <main className="flex flex-1 flex-col items-center justify-center">
        <Hero />
        <HowItWorks />
        <EngineeringBehindIt />
        {/* <TechStack /> */} {/* TODO: fix correct logo */}
      </main>
      <Footer />
    </div>
  );
}
