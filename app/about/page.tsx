import { Metadata } from "next";
import Section from "@/components/shared/Section";
import { generateSEO } from "@/components/layout/SEO";
import CompanyLogo from "@/components/about/CompanyLogo";

export const metadata: Metadata = generateSEO({
  title: "About Quan Ho - My Journey from Bench Science to Strategic Intelligence",
  description: "From oncology research at MGH to generative AI at Generate Biomedicines. Scientist × Strategist × Builder bridging biotech, data, and intelligent design.",
  keywords: ["biotech career", "scientific strategy", "AI in biotech", "drug development", "business intelligence", "CAR-T", "CRISPR", "immunology"],
});

export default function AboutPage() {
  return (
    <>
      {/* Journey Section */}
      <Section className="bg-gradient-to-br from-primary-50 via-white to-accent-50 pt-16 pb-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-16 text-center">
            My Journey
          </h1>

          {/* Phase I: Foundation */}
          <div className="card mb-8 border-l-4 border-green-500 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6 pb-5 border-b-2 border-gray-100">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-2xl font-bold text-green-600">I:</span>
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">Foundation</h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <CompanyLogo
                  name="Massachusetts General Hospital"
                  shortName="MGH"
                  color="bg-green-100 text-green-800"
                />
                <span className="text-gray-400">·</span>
                <span className="text-gray-700 italic">Oncology Research</span>
              </div>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg leading-relaxed">
                I started at MGH learning to ask focused questions and design experiments that could answer them. I built NGS workflows for gene fusion detection, sequenced over 1,500 clinical samples, and collaborated with Blueprint Medicines and other partners studying resistance mechanisms in glioblastoma multiforme (GBM) and solid tumors.
              </p>
              <p className="text-lg leading-relaxed">
                Tumor biology is complex and highly variable from patient to patient. That complexity taught me to question assumptions, design rigorous controls, and value data quality over speed.
              </p>
            </div>
          </div>

          {/* Phase II: Innovation */}
          <div className="card mb-8 border-l-4 border-teal-500 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6 pb-5 border-b-2 border-gray-100">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-2xl font-bold text-teal-600">II:</span>
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">Innovation</h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <CompanyLogo
                  name="Juno Therapeutics"
                  shortName="Juno"
                  color="bg-teal-100 text-teal-800"
                />
                <span className="text-gray-600 font-medium">&</span>
                <CompanyLogo
                  name="Intellia Therapeutics"
                  shortName="Intellia"
                  color="bg-purple-100 text-purple-800"
                />
                <span className="text-gray-400">·</span>
                <span className="text-gray-700 italic">Cell & Gene Therapy</span>
              </div>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg leading-relaxed">
                At Juno, I worked on early CAR-T discovery, building high-throughput assays to measure specificity and T-cell activation. I screened engineered constructs and compared binding and killing profiles to narrow down lead candidates. This deepened my interest in immunology.
              </p>
              <p className="text-lg leading-relaxed">
                At Intellia, I shifted to CRISPR editing, running large HSPC screens and analyzing editing outcomes that supported IP filings. Evaluating engraftment and lineage behavior in NSG models taught me that in vivo systems rarely behave as predicted.
              </p>
              <p className="text-lg leading-relaxed">
                Both roles meant adapting quickly, testing without a playbook, and adjusting as data emerged.
              </p>
            </div>
          </div>

          {/* Phase III: Translation */}
          <div className="card mb-8 border-l-4 border-red-500 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6 pb-5 border-b-2 border-gray-100">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-2xl font-bold text-red-600">III:</span>
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">Translation</h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <CompanyLogo
                  name="Novartis"
                  shortName="Novartis"
                  color="bg-red-100 text-red-800"
                />
                <span className="text-gray-400">·</span>
                <span className="text-gray-700 italic">Biomarkers & Clinical Translation</span>
              </div>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg leading-relaxed">
                At Novartis, the core question changed: Can we measure whether the drug is working in patients?
              </p>
              <p className="text-lg leading-relaxed">
                I designed biomarker assays, built 32-color spectral flow panels, developed multiplex immunoassays, and transferred pharmacodynamic methods to clinical sites. I managed CRO partnerships and supported biomarker strategies across multiple adenosine-pathway programs. I also worked with bulk RNA-seq data and evaluated emerging technologies for measuring pathway engagement.
              </p>
              <p className="text-lg leading-relaxed">
                This role showed me how programs evolve once they reach the clinic. I learned how teams interpret real-time data and how those signals shape decisions about dose, timing, and program direction. I gained an end-to-end view of drug development I hadn't had before.
              </p>
            </div>
          </div>

          {/* Phase IV: Convergence */}
          <div className="card mb-8 border-l-4 border-blue-500 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6 pb-5 border-b-2 border-gray-100">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-2xl font-bold text-blue-600">IV:</span>
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">Convergence</h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <CompanyLogo
                  name="Generate Biomedicines"
                  shortName="Generate"
                  color="bg-blue-100 text-blue-800"
                />
                <span className="text-gray-400">·</span>
                <span className="text-gray-700 italic">Generative AI & Strategic R&D</span>
              </div>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg leading-relaxed">
                Generate was where biology, generative AI, and strategic thinking merged in a meaningful way for me.
              </p>
              <p className="text-lg leading-relaxed">
                I partnered with AI/ML engineers to define biological requirements for generative models, build validation datasets, and interpret outputs for immunogenicity prediction and protein design. I explored new experimental tools, including "artificial lymph node" chip systems measuring B-cell responses to novel proteins, and collaborated on computer-vision models that classify immune activation states from microscopy.
              </p>
              <p className="text-lg leading-relaxed">
                I also began using genAI to code and automate analyses, integrating transcriptomics into bispecific ADC target discovery. Those workflows and visualizations clarified target priorities and supported strategic program decisions.
              </p>
              <p className="text-lg leading-relaxed">
                This experience showed me how much I enjoy working at intersections, bringing together experimental biology, computational tools, and strategic thinking so teams can make decisions with clarity and confidence.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* What I'm Exploring Next */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            What I'm Exploring Next
          </h2>
          <div className="prose prose-lg mx-auto text-gray-700">
            <p className="text-lg leading-relaxed mb-5">
              I'm most energized when combining deep scientific context with systems thinking and AI-powered tools to solve challenging problems.
            </p>
            <p className="text-lg leading-relaxed mb-5">
              I'm exploring opportunities where I can help teams evaluate new technologies and platforms, map competitive and scientific landscapes, and design workflows that turn scattered data into clear decisions about where to invest, partner, or build.
            </p>
            <p className="text-lg leading-relaxed">
              Whether in strategy, business development, or a hybrid technical role, I'm drawn to problems where the answer depends on understanding both the biology and the system around it.
            </p>
          </div>
        </div>
      </Section>

      {/* Core Capabilities */}
      <Section background="gray">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Core Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Scientist */}
            <div className="card text-center hover:shadow-2xl transition-all duration-300 flex flex-col">
              <div className="mb-6">
                <div className="text-5xl mb-4">🔬</div>
                <h3 className="text-2xl font-semibold text-gray-900">Scientist</h3>
              </div>
              <p className="text-gray-700 leading-relaxed flex-grow">
                Immunology, oncology, cell & gene therapy · ADCs, TCEs, bispecifics, CAR-T, CRISPR · Preclinical assay development and biomarker strategy
              </p>
            </div>

            {/* Strategist */}
            <div className="card text-center hover:shadow-2xl transition-all duration-300 flex flex-col">
              <div className="mb-6">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-2xl font-semibold text-gray-900">Strategist</h3>
              </div>
              <p className="text-gray-700 leading-relaxed flex-grow">
                Competitive and IP landscape analysis · Technology assessment and due diligence · Portfolio decisions and opportunity evaluation
              </p>
            </div>

            {/* Builder */}
            <div className="card text-center hover:shadow-2xl transition-all duration-300 flex flex-col">
              <div className="mb-6">
                <div className="text-5xl mb-4">⚙️</div>
                <h3 className="text-2xl font-semibold text-gray-900">Builder</h3>
              </div>
              <p className="text-gray-700 leading-relaxed flex-grow">
                AI agents for business intelligence · Data analysis and visualization (Python, SQL, R) · Computational workflows for target discovery and due diligence
              </p>
            </div>

          </div>
        </div>
      </Section>

      {/* Why Sonny */}
      <Section background="white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Why "Sonny"?
          </h2>
          <div className="card">
            <p className="text-lg text-gray-700 leading-relaxed">
              My multi-agent system is named after my son, Emerson. Building AI agents while raising a baby taught me that curiosity, iteration, and a tolerance for unexpected outputs are useful in both contexts.
            </p>
          </div>
        </div>
      </Section>

      {/* Beyond Work */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Beyond Work
          </h2>

          <div className="text-center mb-8">
            <span className="text-lg font-semibold text-gray-900">Boston-based</span>
            <span className="text-gray-400 mx-3">·</span>
            <span className="text-lg italic text-gray-700">Always learning, always building</span>
          </div>

          <div className="prose prose-lg mx-auto">
            <div className="card">
              <div className="space-y-5 text-gray-700">
                <p className="text-lg leading-relaxed">
                  Outside of work, you'll usually find me on a soccer field or squash court, or watching Manchester United. I've been a fan since childhood, which means I've seen glory days (Fergie Time!) and, well, let's call them a "character-building decade." If that doesn't prepare you for the ups and downs of biotech, nothing will.
                </p>
                <p className="text-lg leading-relaxed">
                  Being a parent to an 8-month-old has been the best unexpected training for this career transition. Babies teach you patience when experiments don't go as planned, adaptability when priorities shift without warning, and how to function on limited information and even less sleep. You learn to read subtle signals, iterate quickly, and trust your instincts even when the data is incomplete. Turns out those are transferable skills.
                </p>
                <p className="text-lg leading-relaxed">
                  I'm genuinely excited about where AI and biology are headed, and I love building things, whether it's a new assay, a workflow that makes someone's job easier, or a multi-agent system that can tackle competitive intelligence while I sing 5 Little Monkeys. This portfolio is part of that: a space to experiment, learn in public, and show what's possible when you combine scientific depth with strategic thinking and a willingness to build.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Get in Touch */}
      <Section background="white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Get in Touch
          </h2>

          <div className="card text-center">
            {/* Contact Methods */}
            <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 mb-6">
              <a
                href="https://www.linkedin.com/in/quan-ho"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-sm border-2 border-primary-600 hover:bg-primary-700 hover:border-primary-700 transition-colors duration-200"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span>Connect on LinkedIn</span>
              </a>

              <a
                href="mailto:hoquan12@gmail.com"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-primary-600 rounded-lg font-medium text-sm border-2 border-primary-600 hover:bg-primary-50 transition-colors duration-200"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>hoquan12@gmail.com</span>
              </a>
            </div>

            {/* Location & Availability */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-4 text-gray-700">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Boston, MA</span>
                </div>
                <span className="text-gray-400">·</span>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-accent-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold text-accent-700">Open to Collaborations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
