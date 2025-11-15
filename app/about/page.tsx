import { Metadata } from "next";
import Section from "@/components/shared/Section";
import Button from "@/components/shared/Button";
import { generateSEO } from "@/components/layout/SEO";

export const metadata: Metadata = generateSEO({
  title: "About Quan Ho",
  description: "Scientist × Strategist × Builder. Bridging science and strategy to transform complex research into data-driven insight that drives meaningful impact.",
  keywords: ["biotech scientist", "business intelligence", "AI agents", "data systems", "scientific strategy"],
});

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <Section className="bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center">
            Scientist × Strategist × Builder
          </h1>
          <p className="text-xl text-gray-700 text-center">
            Bridging science and strategy to transform complex research into data-driven insight that drives meaningful impact.
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
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Experience & Background
          </h2>

          {/* Featured: Biotech R&D Leadership (Full Width) */}
          <div className="card mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              Biotech R&D Leadership
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generate Biomedicines */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                    GB
                  </div>
                  <h4 className="font-semibold text-gray-900 text-base">
                    Generate Biomedicines
                  </h4>
                </div>
                <p className="text-sm text-gray-600 mb-1 ml-8 font-medium">
                  Immunogenicity & AI Collaboration
                </p>
                <p className="text-sm text-gray-700 ml-8">
                  Partnered with ML engineers to define biological requirements, generate validation datasets, and interpret results that guided improvements to generative protein models and immunogenicity prediction workflows.
                </p>
              </div>

              {/* Novartis */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                    N
                  </div>
                  <h4 className="font-semibold text-gray-900 text-base">
                    Novartis
                  </h4>
                </div>
                <p className="text-sm text-gray-600 mb-1 ml-8 font-medium">
                  Oncology Translational Research
                </p>
                <p className="text-sm text-gray-700 ml-8">
                  Designed and validated biomarker assays, led pharmacodynamic method transfer to clinical sites, and guided multi-program biomarker strategy supporting adenosine pathway trials.
                </p>
              </div>

              {/* Intellia */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                    I
                  </div>
                  <h4 className="font-semibold text-gray-900 text-base">
                    Intellia Therapeutics
                  </h4>
                </div>
                <p className="text-sm text-gray-600 mb-1 ml-8 font-medium">
                  CRISPR Gene Editing
                </p>
                <p className="text-sm text-gray-700 ml-8">
                  Conducted large-scale CRISPR HSPC screens, analyzed editing outcomes, and generated datasets that supported IP filings (U.S. Patent 20200308603).
                </p>
              </div>

              {/* Juno Therapeutics */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-teal-600 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                    J
                  </div>
                  <h4 className="font-semibold text-gray-900 text-base">
                    Juno Therapeutics
                  </h4>
                </div>
                <p className="text-sm text-gray-600 mb-1 ml-8 font-medium">
                  CAR-T Discovery
                </p>
                <p className="text-sm text-gray-700 ml-8">
                  Developed high-throughput CAR-T screening assays to assess binding specificity and activation potential, enabling early-stage therapeutic candidate selection.
                </p>
              </div>

              {/* Massachusetts General Hospital */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                    MGH
                  </div>
                  <h4 className="font-semibold text-gray-900 text-base">
                    Massachusetts General Hospital
                  </h4>
                </div>
                <p className="text-sm text-gray-600 mb-1 ml-8 font-medium">
                  Molecular Pathology
                </p>
                <p className="text-sm text-gray-700 ml-8">
                  Implemented anchored multiplex PCR for NGS-based gene fusion detection in collaboration with Blueprint Medicines and supported pharma partnerships investigating treatment resistance in GBM and solid tumors.
                </p>
              </div>
            </div>
          </div>

          {/* Three Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI, Data & Systems Engineering */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                AI, Data & Systems Engineering
              </h3>

              <ul className="space-y-2.5 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <span className="text-sm">Computational analysis & visualization (Python, R, SQL, Tableau)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <span className="text-sm">AI agent development for patent analysis & business intelligence</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <span className="text-sm">LLM-based automation for strategic insights</span>
                </li>
              </ul>
            </div>

            {/* Business Intelligence & Strategy */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Business Intelligence & Strategy
              </h3>

              <ul className="space-y-2.5 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <span className="text-sm">Competitive landscape & patent analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <span className="text-sm">Clinical data interpretation & biomarker strategy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <span className="text-sm">Market opportunity evaluation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <span className="text-sm">IP strategy & technology assessment</span>
                </li>
              </ul>
            </div>

            {/* Scientific & Technical Expertise */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Scientific & Technical Expertise
              </h3>

              <ul className="space-y-2.5 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <span className="text-sm">Immunology, oncology, cell & gene therapy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <span className="text-sm">ADCs, TCEs, bispecifics, CRISPR, CAR-T</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <span className="text-sm">Transcriptomics, flow cytometry, immunogenicity assays</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Beyond Work */}
      <Section background="white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Beyond Work
          </h2>

          <div className="card text-center">
            <p className="text-body text-gray-700 mb-4">
              <strong>Boston-based</strong> · <strong>Balancing curiosity & chaos</strong>
            </p>
            <p className="text-sm text-gray-600">
              Outside of work, I play soccer and squash, dive into new research, explore AI and emerging tech, or watch Manchester United test my loyalty. Parenthood has sharpened my patience and adaptability, skills that translate surprisingly well to navigating biotech.
            </p>
          </div>
        </div>
      </Section>

      {/* Contact */}
      <Section background="gray">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Get in Touch
          </h2>

          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LinkedIn */}
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </div>
                <div className="ml-4 flex items-center">
                  <Button
                    href="https://www.linkedin.com/in/quan-ho"
                    external
                    variant="primary"
                    className="text-sm"
                  >
                    Connect on LinkedIn
                  </Button>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center text-accent-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4 flex items-center">
                  <Button
                    href="mailto:hoquan12@gmail.com"
                    variant="secondary"
                    className="text-sm"
                  >
                    hoquan12@gmail.com
                  </Button>
                </div>
              </div>
            </div>

            {/* Location & Status */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex flex-wrap items-center justify-center gap-6 text-gray-700">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Boston, MA</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold text-accent-700">Available now</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Open to relocation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
