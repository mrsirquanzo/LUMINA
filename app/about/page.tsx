import { Metadata } from "next";
import Section from "@/components/shared/Section";
import Button from "@/components/shared/Button";
import { generateSEO } from "@/components/layout/SEO";

export const metadata: Metadata = generateSEO({
  title: "About Quan Ho",
  description: "Scientist × Strategist × Builder. Bridging biotech, data, and intelligent design with 10+ years of experience in immunology, oncology, and AI-driven drug discovery.",
  keywords: ["biotech scientist", "business intelligence", "AI agents", "data systems", "scientific strategy"],
});

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <Section className="bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center">
            From Bench to Business Intelligence
          </h1>
          <p className="text-xl text-gray-700 text-center mb-8">
            After a decade in R&D—Generate Biomedicines, Novartis, Juno Therapeutics—I became
            fascinated by how discoveries translate into impact.
          </p>
        </div>
      </Section>

      {/* What I Do */}
      <Section background="white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            What I Do
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-body text-gray-700 mb-8">
              Now I focus on bridging biology, data, and design to drive smarter biotech decisions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card text-center">
                <div className="text-3xl mb-3">🔬</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Translate Scientific Data
                </h3>
                <p className="text-sm text-gray-700">
                  Turn clinical data, patent landscapes, and competitive intelligence into business insight
                </p>
              </div>

              <div className="card text-center">
                <div className="text-3xl mb-3">🤖</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Build AI Agents
                </h3>
                <p className="text-sm text-gray-700">
                  Automate research and diligence workflows with intelligent systems
                </p>
              </div>

              <div className="card text-center">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Design Data Systems
                </h3>
                <p className="text-sm text-gray-700">
                  Create clean dashboards, memo frameworks, and visual systems
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Experience & Background */}
      <Section background="gray">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Experience & Background
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Biotech R&D */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Biotech R&D Experience
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Generate Biomedicines — AI-driven protein design
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Novartis — Cell therapy development
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Juno Therapeutics — Immunology & oncology
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  MGH — Translational research
                </li>
              </ul>
            </div>

            {/* Technical Skills */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Technical Skills
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  AI/ML systems & agent architecture
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Data analysis (Python, R, SQL)
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Financial modeling & valuation
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Design systems & data visualization
                </li>
              </ul>
            </div>

            {/* Business Intelligence */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Business Intelligence
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Competitive landscape analysis
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Patent intelligence & IP strategy
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Clinical data interpretation
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Market opportunity assessment
                </li>
              </ul>
            </div>

            {/* Scientific Expertise */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Scientific Expertise
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Immunology & oncology
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Cell & gene therapy modalities
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Platform technology validation
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Transcriptomics & multi-omics
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Philosophy */}
      <Section background="white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Philosophy
          </h2>

          <div className="prose prose-lg max-w-none">
            <div className="bg-accent-50 border-l-4 border-accent-500 p-6 rounded-r-lg mb-8">
              <p className="text-gray-800 italic">
                "The best business intelligence doesn't just describe what's happening—it explains why it matters and what to do about it."
              </p>
            </div>

            <p className="text-body text-gray-700 mb-6">
              Throughout my career, I've learned that great analysis requires three things:
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <span className="text-primary-600 text-2xl mr-3 leading-none">1</span>
                <div>
                  <strong className="text-gray-900">Deep scientific literacy</strong> —
                  <span className="text-gray-700"> Understanding the biology well enough to ask the right questions</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 text-2xl mr-3 leading-none">2</span>
                <div>
                  <strong className="text-gray-900">Technical execution</strong> —
                  <span className="text-gray-700"> Building systems that scale insights beyond manual work</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 text-2xl mr-3 leading-none">3</span>
                <div>
                  <strong className="text-gray-900">Clear communication</strong> —
                  <span className="text-gray-700"> Translating complexity into actionable recommendations</span>
                </div>
              </li>
            </ul>

            <p className="text-body text-gray-700">
              This is the intersection where I operate: <strong>Scientist × Strategist × Builder</strong>.
            </p>
          </div>
        </div>
      </Section>

      {/* Beyond Work */}
      <Section background="gray">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Beyond Work
          </h2>

          <div className="card text-center">
            <p className="text-body text-gray-700 mb-6">
              <strong>Boston-based</strong> • <strong>New parent</strong> • <strong>Always learning</strong>
            </p>
            <p className="text-sm text-gray-600 mb-6">
              When I'm not building AI agents or analyzing biotech companies, I'm navigating
              the chaos of new parenthood and staying current with the latest research.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button href="/case-studies" variant="primary">
                View Case Studies
              </Button>
              <Button href="/ai-projects" variant="secondary">
                Explore AI Projects
              </Button>
              <Button href="/contact" variant="secondary">
                Get in Touch
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
