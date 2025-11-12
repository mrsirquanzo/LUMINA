import Hero from "@/components/home/Hero";
import ValueProp from "@/components/home/ValueProp";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import InsightsSection from "@/components/home/InsightsSection";

export default function Home() {
  return (
    <div>
      <Hero />
      <ValueProp />
      <FeaturedProjects />
      <InsightsSection />
    </div>
  );
}
