import { Metadata } from "next";
import Section from "@/components/shared/Section";
import Button from "@/components/shared/Button";
import { generateSEO } from "@/components/layout/SEO";

export const metadata: Metadata = generateSEO({
  title: "About Quan Ho",
  description: "Learn about Quan Ho's journey from bench scientist to biotech investor, with 10+ years of experience in immunology, oncology, and AI-driven drug discovery.",
  keywords: ["biotech scientist", "career transition", "drug discovery", "investment professional"],
});

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <Section className="bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center">
            From Bench to Board Room
          </h1>
          <p className="text-xl text-gray-700 text-center mb-8">
            After 10 years in the lab, I realized I'm energized by the strategy and why,
            not just the how.
          </p>
        </div>
      </Section>

      {/* The Journey */}
      <Section background="white">
        <div className="max-w-3xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <p className="text-body text-gray-700 mb-6">
              Throughout my career at Generate Biomedicines, Novartis, Juno Therapeutics,
              and MGH, I've consistently gravitated toward the questions that sit at the
              intersection of science and business:
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-primary-600 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Which therapeutic modality will dominate the next decade?</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-primary-600 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">How do we prioritize targets when resources are limited?</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-primary-600 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">What makes one platform technology fundable vs. another?</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-primary-600 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">When should we advance a program, and when should we kill it?</span>
              </li>
            </ul>

            <p className="text-body text-gray-700 mb-6">
              These are the questions that keep me up at night—and they're the ones I want
              to spend my career answering.
            </p>
          </div>
        </div>
      </Section>

      {/* What I Bring */}
      <Section background="gray">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            What I Bring
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Technical Due Diligence */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Technical Due Diligence
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Immunogenicity risk assessment
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  AI/ML model validation
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Platform technology evaluation
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Clinical trial design critique
                </li>
              </ul>
            </div>

            {/* Cross-Functional Leadership */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Cross-Functional Leadership
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Vendor management & partnerships
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Requirements definition for AI/ML
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Cross-team project coordination
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Scientific communication to non-technical stakeholders
                </li>
              </ul>
            </div>

            {/* Data-Driven Decision Making */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Data-Driven Decision Making
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Transcriptomics & multi-omics analysis
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Competitive intelligence gathering
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Clinical data interpretation
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Statistical modeling & analysis
                </li>
              </ul>
            </div>

            {/* Financial Acumen */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Financial Acumen
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  WallStreetPrep certified
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Financial modeling & valuation
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Self-directed investing experience
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  Market analysis & forecasting
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Why BD/PE/VC */}
      <Section background="white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Why BD/PE/VC
          </h2>

          <div className="prose prose-lg max-w-none">
            <p className="text-body text-gray-700 mb-6">
              I'm drawn to roles where I can:
            </p>

            <ol className="space-y-4 mb-8 list-decimal list-inside">
              <li className="text-gray-700 pl-2">
                <strong className="text-gray-900">Evaluate emerging companies and technologies at scale</strong> —
                Rather than working on one program, I want to assess dozens and identify the winners
              </li>
              <li className="text-gray-700 pl-2">
                <strong className="text-gray-900">Partner with founders and scientists to accelerate innovation</strong> —
                Provide strategic guidance that helps transform great science into successful businesses
              </li>
              <li className="text-gray-700 pl-2">
                <strong className="text-gray-900">Make decisions that shape the future of medicine</strong> —
                Deploy capital and resources toward the most promising therapeutic approaches
              </li>
            </ol>

            <div className="bg-accent-50 border-l-4 border-accent-500 p-6 rounded-r-lg mb-8">
              <p className="text-gray-800">
                <strong className="text-gray-900">Particularly excited about the intersection of AI and biology:</strong>
                <br /><br />
                Having worked hands-on with generative AI models for protein design at Generate
                Biomedicines, I've seen both the promise and the pitfalls firsthand. I understand
                what it takes to validate these models, where they excel, and where they fall short—
                critical insights for investment decisions.
              </p>
            </div>
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
              New parent based in Boston, navigating the balance between sleepless nights
              and scientific curiosity. When I'm not analyzing biotech companies or changing
              diapers, I enjoy staying current with the latest research, exploring new
              technologies, and thinking about the future of medicine.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button href="/portfolio" variant="primary">
                See My Work
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
