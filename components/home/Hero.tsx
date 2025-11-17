import Button from "@/components/shared/Button";
import Section from "@/components/shared/Section";

export default function Hero() {
  return (
    <Section className="bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
          Scientist × Strategist × Builder
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
          I combine scientific expertise with strategic business intelligence to identify
          promising biotech opportunities, and I develop AI-powered tools that make
          sophisticated due diligence accessible and scalable.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button href="/ai-projects" variant="primary">
            See What I Build
          </Button>
          <Button href="/about" variant="secondary">
            About Quan
          </Button>
          <Button href="/contact" variant="secondary">
            Get in Touch
          </Button>
        </div>

        {/* Location & Availability */}
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Boston
          </span>
          <span className="text-gray-400">•</span>
          <span>Biotech Business Intelligence & AI Systems</span>
          <span className="text-gray-400">•</span>
          <span className="text-accent-700 font-semibold">Open to Collaborations</span>
        </div>
      </div>
    </Section>
  );
}
