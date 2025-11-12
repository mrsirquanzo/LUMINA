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

              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Computational analysis & data visualization</span>
                    <span className="text-sm text-gray-700"> — Python, R, SQL, Qiagen Omicsoft, Tableau, Spotfire</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900">AI agent prototyping</span>
                    <span className="text-sm text-gray-700"> — Developing portfolio-ready agents for patent analysis, business intelligence, and data-driven decision support</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Prompt engineering & automation</span>
                    <span className="text-sm text-gray-700"> — Building LLM-based agents that convert technical or IP documents into strategic insights</span>
                  </div>
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
                  <span className="text-sm">IP strategy and technology assessment</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <span className="text-sm">Clinical and biomarker data interpretation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <span className="text-sm">Market opportunity and portfolio evaluation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <span className="text-sm">Vendor coordination, requirements definition, and platform adoption leadership</span>
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
                  <div>
                    <span className="text-sm font-medium text-gray-900">Therapeutic areas:</span>
                    <span className="text-sm text-gray-700"> Immunology & oncology, cell & gene therapy</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Modalities:</span>
                    <span className="text-sm text-gray-700"> ADCs, TCEs, bispecifics, CRISPR, CAR-T, organ-on-chip</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Analytical skills:</span>
                    <span className="text-sm text-gray-700"> Transcriptomics, multi-omics, flow cytometry, immunogenicity assays</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-0.5">•</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Computational tools:</span>
                    <span className="text-sm text-gray-700"> RNA-seq pipelines, data visualization, AI model validation</span>
                  </div>
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
            <p className="text-body text-gray-700 mb-6">
              I see innovation as the intersection of science, strategy, and systems thinking. My approach combines the curiosity of a scientist, the analytical mindset of a strategist, and the pragmatism of a builder.
            </p>

            <p className="text-body text-gray-700 mb-6">
              I'm drawn to problems where biology meets computation—where data can sharpen intuition and translate discovery into real decisions. Whether it's advancing therapeutic programs, refining AI tools, or evaluating emerging technologies, I focus on turning complex information into clear, actionable insight.
            </p>

            <p className="text-body text-gray-700 text-center font-semibold text-xl mt-8">
              Scientist × Strategist × Builder
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
              <strong>Boston-based</strong> · <strong>Balancing curiosity & chaos</strong>
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Outside of work, I'm learning as much from parenthood as I do from building AI systems—both push you to stay patient, flexible, and quick on your feet. When I'm not debugging models or baby sleep cycles, I'm playing soccer or squash, diving into new research, or watching Manchester United test my resilience.
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
