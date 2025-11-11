import { Metadata } from "next";
import Link from "next/link";
import Section from "@/components/shared/Section";
import ShareButtons from "@/components/shared/ShareButtons";
import TableOfContents from "@/components/portfolio/TableOfContents";
import ProjectNav from "@/components/portfolio/ProjectNav";
import InteractiveChart from "@/components/visualizations/InteractiveChart";
import LineChart from "@/components/visualizations/LineChart";
import BarChart from "@/components/visualizations/BarChart";
import CompetitiveMatrix from "@/components/visualizations/CompetitiveMatrix";
import { projects } from "@/lib/projects";
import { generateSEO } from "@/components/layout/SEO";
import { TOCItem } from "@/lib/types";

export const metadata: Metadata = generateSEO({
  title: "Absci Corporation: AI-Powered Antibody Discovery Investment Analysis",
  description: "Deep-dive investment analysis of Absci's generative AI platform for antibody discovery, including technical assessment, market sizing, financial modeling, and valuation.",
  keywords: ["Absci", "AI drug discovery", "antibody", "biotech investment", "generative AI", "protein design"],
});

export default function AbsciDeepDivePage() {
  const currentIndex = projects.findIndex((p) => p.slug === "absci-deep-dive");
  const prevProject = currentIndex > 0 ? projects[currentIndex - 1] : undefined;
  const nextProject = currentIndex < projects.length - 1 ? projects[currentIndex + 1] : undefined;

  const tocItems: TOCItem[] = [
    { id: "executive-summary", title: "Executive Summary", level: 1 },
    { id: "context", title: "Context & Thesis", level: 1 },
    { id: "technical-analysis", title: "Technical Deep Dive", level: 1 },
    { id: "platform-overview", title: "Platform Overview", level: 2 },
    { id: "competitive-landscape", title: "Competitive Technology Landscape", level: 2 },
    { id: "scientific-validation", title: "Scientific Validation", level: 2 },
    { id: "market-analysis", title: "Market Analysis", level: 1 },
    { id: "financial-assessment", title: "Financial Assessment", level: 1 },
    { id: "risks", title: "Risk Analysis", level: 1 },
    { id: "recommendation", title: "Investment Recommendation", level: 1 },
  ];

  const fullUrl = "https://quanho.io/portfolio/absci-deep-dive";

  // Market growth data
  const marketGrowthData = [
    { year: "2020", marketSize: 3.2, aiEnabled: 0.3 },
    { year: "2021", marketSize: 3.8, aiEnabled: 0.5 },
    { year: "2022", marketSize: 4.5, aiEnabled: 0.8 },
    { year: "2023", marketSize: 5.4, aiEnabled: 1.3 },
    { year: "2024E", marketSize: 6.5, aiEnabled: 2.1 },
    { year: "2025E", marketSize: 8.2, aiEnabled: 3.5 },
    { year: "2026E", marketSize: 10.5, aiEnabled: 5.2 },
    { year: "2027E", marketSize: 13.5, aiEnabled: 7.8 },
    { year: "2028E", marketSize: 17.2, aiEnabled: 11.2 },
    { year: "2029E", marketSize: 21.8, aiEnabled: 15.5 },
    { year: "2030E", marketSize: 27.5, aiEnabled: 20.8 },
  ];

  // Partnership data
  const partnershipData = [
    { company: "Absci", partnerships: 8, totalValue: 3200, avgDealSize: 400 },
    { company: "Generate Bio", partnerships: 5, totalValue: 2100, avgDealSize: 420 },
    { company: "AbCellera", partnerships: 6, totalValue: 1800, avgDealSize: 300 },
    { company: "Recursion", partnerships: 4, totalValue: 1200, avgDealSize: 300 },
    { company: "Schrödinger", partnerships: 7, totalValue: 900, avgDealSize: 129 },
  ];

  // Competitive matrix data
  const competitiveData = [
    {
      company: "Absci (ABSI)",
      speed: 4,
      cost: 5,
      hitRate: 4,
      validation: "Phase 1",
      partnerships: 8,
    },
    {
      company: "Generate Biomedicines",
      speed: 5,
      cost: 4,
      hitRate: 5,
      validation: "Preclinical",
      partnerships: 5,
    },
    {
      company: "AbCellera",
      speed: 4,
      cost: 3,
      hitRate: 4,
      validation: "Approved",
      partnerships: 6,
    },
    {
      company: "Traditional Discovery",
      speed: 2,
      cost: 2,
      hitRate: 3,
      validation: "Approved",
      partnerships: "N/A",
    },
  ];

  const timelineData = [
    { stage: "Target ID", traditional: 12, absci: 3 },
    { stage: "Lead Discovery", traditional: 18, absci: 6 },
    { stage: "Lead Optimization", traditional: 12, absci: 4 },
    { stage: "IND-Enabling", traditional: 18, absci: 12 },
  ];

  return (
    <>
      {/* Header Section */}
      <Section className="bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <Link href="/portfolio" className="hover:text-primary-600">Portfolio</Link>
            <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-900">Absci Corporation</span>
          </div>

          <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
            Company Deep Dive
          </span>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">
            Absci Corporation: AI-Powered Antibody Discovery
          </h1>

          <p className="text-xl text-gray-700 italic mb-6">
            Evaluating the Commercial Viability of Zero-Shot Generative AI for Antibody Design
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              25 min read
            </span>
            <span className="text-gray-400">•</span>
            <span>Published: January 2025</span>
            <span className="text-gray-400">•</span>
            <span>Last Updated: January 11, 2025</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-200">
            <ShareButtons title="Absci Corporation: AI-Powered Antibody Discovery" url={fullUrl} />
            <button className="btn-secondary text-sm py-2">
              Download PDF
            </button>
          </div>
        </div>
      </Section>

      {/* Main Content Section */}
      <Section background="white">
        <div className="max-w-site mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Table of Contents */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <TableOfContents items={tocItems} />
            </aside>

            {/* Main Content */}
            <article className="flex-1 min-w-0">
              <div className="prose prose-lg max-w-content">
                {/* EXECUTIVE SUMMARY */}
                <section id="executive-summary" className="mb-16 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Executive Summary</h2>

                  <div className="bg-primary-50 border-l-4 border-primary-600 p-6 rounded-r-lg mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Takeaways</h3>
                    <ul className="space-y-3 text-gray-800">
                      <li className="flex items-start">
                        <span className="text-primary-600 mr-2 mt-1">▸</span>
                        <span><strong>Platform Differentiation:</strong> Absci's zero-shot generative AI platform represents a step-function improvement in speed-to-clinic (12-18 months vs 3-5 years traditional), combining E. coli expression with de novo protein design</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary-600 mr-2 mt-1">▸</span>
                        <span><strong>De-risked Through Partnerships:</strong> Company has validated technology through 8 partnerships with major pharma (AbbVie, Merck, others) worth $3B+ in potential milestones, providing both validation and revenue diversification</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary-600 mr-2 mt-1">▸</span>
                        <span><strong>Attractive Risk/Reward:</strong> Current valuation of ~$520M (as of Jan 2025) implies significant upside if platform proves out in clinic, with 2025-2026 clinical readouts serving as key catalysts</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary-600 mr-2 mt-1">▸</span>
                        <span><strong>Key Risks:</strong> Clinical validation of AI-designed molecules remains unproven at scale; competitive pressure from Generate, AbCellera, and in-house pharma AI capabilities; dependency on partnership model</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-accent-100 border-l-4 border-accent-600 p-6 rounded-r-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Investment Recommendation</h3>
                    <p className="text-gray-800 text-lg font-semibold mb-2">
                      BUY - Attractive risk/reward for growth investors with 3-5 year horizon
                    </p>
                    <p className="text-gray-700 text-sm">
                      Contingent on positive clinical data readouts in 2025-2026. Price target range: $8-12/share (55-130% upside) in bull case with successful clinical validation and platform expansion.
                    </p>
                  </div>
                </section>

                {/* CONTEXT & THESIS */}
                <section id="context" className="mb-16 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Context & Thesis</h2>

                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Why AI Antibody Discovery Matters Now</h3>

                  <p className="text-gray-700 mb-4">
                    Therapeutic antibodies represent a $200B+ market and continue to be the fastest-growing class of biologics. However, traditional antibody discovery remains a significant bottleneck in drug development:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-3xl font-bold text-primary-600 mb-2">3-5 years</div>
                      <div className="text-sm text-gray-700">Traditional discovery timeline from target to IND</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-3xl font-bold text-primary-600 mb-2">$50-100M</div>
                      <div className="text-sm text-gray-700">Average cost to develop one clinical candidate</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-3xl font-bold text-primary-600 mb-2">~5-10%</div>
                      <div className="text-sm text-gray-700">Hit rate from discovery to Phase 1</div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">
                    The incumbent approaches—hybridoma technology, phage display, and transgenic mouse platforms—have served the industry for decades but face inherent limitations in speed, diversity, and cost. More importantly, these methods are retrospective: they select from existing sequences rather than designing novel antibodies from first principles.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">The Generative AI Opportunity</h3>

                  <p className="text-gray-700 mb-4">
                    Generative AI represents a paradigm shift from "select and optimize" to "design and validate." By learning the underlying rules of protein structure and function, AI models can propose novel antibody sequences that have never existed in nature but are predicted to have desired properties.
                  </p>

                  <p className="text-gray-700 mb-6">
                    <strong>Investment Thesis:</strong> We are at an inflection point where generative AI will commoditize early-stage antibody discovery, dramatically compressing timelines and reducing costs. The value will accrue to platforms that can demonstrate three things:
                  </p>

                  <ol className="space-y-3 mb-6 list-decimal list-inside">
                    <li className="text-gray-700 pl-2">
                      <strong className="text-gray-900">Clinical Validation:</strong> AI-designed molecules must succeed in human trials
                    </li>
                    <li className="text-gray-700 pl-2">
                      <strong className="text-gray-900">Manufacturing Scale:</strong> Platforms must enable production economics that support commercial viability
                    </li>
                    <li className="text-gray-700 pl-2">
                      <strong className="text-gray-900">Sustainable Moat:</strong> Technology differentiation that prevents commoditization as AI becomes ubiquitous
                    </li>
                  </ol>

                  <p className="text-gray-700">
                    Absci is positioned at the intersection of all three, with a unique E. coli expression system providing both speed and cost advantages, and an expanding partnership network de-risking clinical validation.
                  </p>
                </section>

                {/* TECHNICAL DEEP DIVE */}
                <section id="technical-analysis" className="mb-16 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Technical Deep Dive</h2>

                  <div id="platform-overview" className="mb-12 scroll-mt-24">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">Platform Overview: How Absci's System Works</h3>

                    <p className="text-gray-700 mb-4">
                      Absci's platform combines three key technologies that together create a differentiated approach to antibody discovery:
                    </p>

                    <div className="space-y-6 mb-8">
                      <div className="border-l-4 border-primary-500 pl-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">1. Zero-Shot Generative AI</h4>
                        <p className="text-gray-700 mb-2">
                          Unlike supervised learning models that require vast training data, Absci's approach uses self-supervised learning on protein sequence databases combined with physics-based constraints. The model learns the "grammar" of functional antibodies and can generate novel sequences without having seen similar examples.
                        </p>
                        <p className="text-gray-700 text-sm italic">
                          <strong>My Assessment:</strong> Having worked with generative models for protein design at Generate Biomedicines, this is a genuine technical achievement. The challenge isn't just generating sequences—it's generating sequences that fold correctly, express well, and maintain function. Absci's integration with their E. coli expression system provides a crucial validation loop.
                        </p>
                      </div>

                      <div className="border-l-4 border-accent-500 pl-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">2. E. coli Expression Platform</h4>
                        <p className="text-gray-700 mb-2">
                          While most antibody platforms use mammalian cell expression (CHO cells), Absci has developed proprietary E. coli strains that can properly fold and glycosylate antibodies. This provides a 10-100x cost advantage and enables rapid iteration cycles (days vs weeks).
                        </p>
                        <p className="text-gray-700 text-sm italic">
                          <strong>My Assessment:</strong> This is where Absci has a genuine technical moat. E. coli expression of antibodies has been a long-standing challenge due to glycosylation requirements and disulfide bond formation. If their system truly works at scale, it's a significant competitive advantage both for discovery speed and eventual manufacturing economics.
                        </p>
                      </div>

                      <div className="border-l-4 border-yellow-500 pl-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">3. Integrated Screening & Validation</h4>
                        <p className="text-gray-700 mb-2">
                          The platform includes high-throughput screening capabilities to rapidly test thousands of AI-generated candidates. This closed-loop system allows continuous model improvement based on experimental validation.
                        </p>
                        <p className="text-gray-700 text-sm italic">
                          <strong>My Assessment:</strong> This feedback loop is critical. Many AI platforms struggle because their models don't learn from experimental failures. Absci's integration of wet-lab validation directly into their training pipeline is a structural advantage.
                        </p>
                      </div>
                    </div>

                    <InteractiveChart
                      title="Discovery Timeline Comparison: Traditional vs. Absci"
                      subtitle="Months to reach each milestone"
                      source="Company presentations, industry benchmarks"
                      fullWidth
                    >
                      <BarChart
                        data={timelineData}
                        xKey="stage"
                        bars={[
                          { key: "traditional", name: "Traditional Discovery", color: "#94a3b8" },
                          { key: "absci", name: "Absci Platform", color: "#3b82f6" },
                        ]}
                        yAxisLabel="Months"
                        layout="horizontal"
                      />
                    </InteractiveChart>
                  </div>

                  <div id="competitive-landscape" className="mb-12 scroll-mt-24">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">Competitive Technology Landscape</h3>

                    <p className="text-gray-700 mb-6">
                      The AI antibody discovery space is becoming increasingly crowded, but meaningful differentiation exists. Key competitors include:
                    </p>

                    <InteractiveChart
                      title="Competitive Platform Comparison"
                      subtitle="Speed, cost, and validation status across key players"
                      source="Company data, SEC filings, analyst research"
                      fullWidth
                    >
                      <CompetitiveMatrix
                        data={competitiveData}
                        metrics={[
                          { key: "speed", label: "Speed to Candidate", type: "rating" },
                          { key: "cost", label: "Cost Efficiency", type: "rating" },
                          { key: "hitRate", label: "Predicted Hit Rate", type: "rating" },
                          { key: "validation", label: "Clinical Stage", type: "text" },
                          { key: "partnerships", label: "Pharma Partnerships", type: "text" },
                        ]}
                      />
                    </InteractiveChart>

                    <div className="my-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Expert Analysis: Competitive Positioning</h4>
                      <div className="space-y-3 text-gray-700">
                        <p>
                          <strong>vs. Generate Biomedicines:</strong> Generate has the more sophisticated AI model (diffusion-based vs transformer-based), but Absci has the manufacturing advantage through E. coli. Generate's mammalian cell-based approach will face higher COGS at commercial scale.
                        </p>
                        <p>
                          <strong>vs. AbCellera:</strong> AbCellera has clinical validation (bebtelovimab approved for COVID-19) but relies on natural immune repertoires rather than de novo design. Their approach is faster to initial candidates but less flexible for difficult targets.
                        </p>
                        <p>
                          <strong>vs. In-house Pharma AI:</strong> The real competitive threat. Companies like AbbVie and Amgen are building internal AI capabilities. However, the capital intensity and technical risk of building a platform from scratch favors partnering in the near term.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div id="scientific-validation" className="mb-12 scroll-mt-24">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">Scientific Validation</h3>

                    <p className="text-gray-700 mb-4">
                      <strong>Published Data:</strong> Absci has published peer-reviewed research demonstrating proof-of-concept for their E. coli antibody expression system and AI-guided design. Key findings include:
                    </p>

                    <ul className="space-y-2 mb-6 list-disc list-inside">
                      <li className="text-gray-700">Successful expression of functional IgG antibodies in E. coli with comparable binding affinity to mammalian-expressed versions</li>
                      <li className="text-gray-700">AI-designed antibodies showing 70%+ success rate in binding validation assays</li>
                      <li className="text-gray-700">Demonstration of correct disulfide bond formation and basic glycosylation patterns</li>
                    </ul>

                    <p className="text-gray-700 mb-4">
                      <strong>Clinical Pipeline:</strong> As of January 2025, Absci has 2 wholly-owned programs in Phase 1 clinical trials, with 6 additional partnership programs in preclinical development. The first clinical readout is expected in Q2 2025.
                    </p>

                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
                      <p className="text-gray-800">
                        <strong>Critical Assessment:</strong> The proof will be in clinical outcomes. While preclinical data is encouraging, AI-designed biologics have yet to demonstrate superior clinical performance compared to traditionally discovered molecules. The 2025-2026 readouts will be make-or-break catalysts for the platform thesis.
                      </p>
                    </div>
                  </div>
                </section>

                {/* MARKET ANALYSIS */}
                <section id="market-analysis" className="mb-16 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Market Analysis</h2>

                  <p className="text-gray-700 mb-6">
                    The addressable market for AI-powered antibody discovery sits at the intersection of two large, growing markets: therapeutic antibodies ($200B+) and AI drug discovery platforms (growing at 35% CAGR).
                  </p>

                  <InteractiveChart
                    title="AI Drug Discovery Market Projected to Reach $28B by 2030"
                    subtitle="Total market and AI-enabled segment ($ billions)"
                    source="Frost & Sullivan, BCC Research, company analysis"
                    fullWidth
                  >
                    <LineChart
                      data={marketGrowthData}
                      xKey="year"
                      lines={[
                        { key: "marketSize", name: "Total Antibody Discovery Market", color: "#94a3b8" },
                        { key: "aiEnabled", name: "AI-Enabled Discovery", color: "#3b82f6" },
                      ]}
                      yAxisLabel="Market Size ($B)"
                    />
                  </InteractiveChart>

                  <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">Market Segmentation</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">TAM: $200B+</h4>
                      <p className="text-gray-700 text-sm">
                        Total addressable market = Global therapeutic antibody market. Absci could theoretically serve any antibody development program.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">SAM: $20B by 2030</h4>
                      <p className="text-gray-700 text-sm">
                        Serviceable addressable market = AI-enabled antibody discovery. Assumes 10% of discovery programs adopt AI platforms by 2030.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">SOM: $1-2B by 2030</h4>
                      <p className="text-gray-700 text-sm">
                        Serviceable obtainable market = Absci's realistic market share assuming 5-10% of AI discovery market and successful platform validation.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Growth Drivers</h4>
                      <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside">
                        <li>Oncology pipeline expansion</li>
                        <li>Autoimmune disease prevalence</li>
                        <li>AI adoption acceleration</li>
                        <li>Biosimilar competition</li>
                      </ul>
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Partnership Landscape</h3>

                  <InteractiveChart
                    title="Partnership Deal Economics: Absci Leading in Total Value"
                    subtitle="Number of partnerships and aggregate deal value ($M)"
                    source="Company press releases, SEC filings"
                    fullWidth
                  >
                    <BarChart
                      data={partnershipData}
                      xKey="company"
                      bars={[
                        { key: "partnerships", name: "Number of Partnerships", color: "#14b8a6" },
                        { key: "avgDealSize", name: "Avg Deal Size ($M)", color: "#3b82f6" },
                      ]}
                    />
                  </InteractiveChart>

                  <p className="text-gray-700 mt-6">
                    Absci's 8 partnerships with major pharma (AbbVie, Merck, EQRx, others) represent over $3.2B in potential milestone payments. This provides:
                  </p>

                  <ul className="space-y-2 my-4 list-disc list-inside">
                    <li className="text-gray-700"><strong>Revenue Diversification:</strong> Less dependency on any single program succeeding</li>
                    <li className="text-gray-700"><strong>Market Validation:</strong> Blue-chip pharma partners validate the technology</li>
                    <li className="text-gray-700"><strong>Clinical Data Generation:</strong> Multiple shots on goal for demonstrating platform capabilities</li>
                    <li className="text-gray-700"><strong>Strategic Optionality:</strong> Potential for expanded partnerships or acquisition interest</li>
                  </ul>
                </section>

                {/* FINANCIAL ASSESSMENT */}
                <section id="financial-assessment" className="mb-16 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Financial Assessment</h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Market Cap</div>
                      <div className="text-2xl font-bold text-gray-900">$520M</div>
                      <div className="text-xs text-gray-500">As of Jan 2025</div>
                    </div>
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Cash Position</div>
                      <div className="text-2xl font-bold text-gray-900">$180M</div>
                      <div className="text-xs text-gray-500">Q3 2024</div>
                    </div>
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Burn Rate</div>
                      <div className="text-2xl font-bold text-gray-900">$45M/Q</div>
                      <div className="text-xs text-gray-500">Quarterly average</div>
                    </div>
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Runway</div>
                      <div className="text-2xl font-bold text-gray-900">~4 qtrs</div>
                      <div className="text-xs text-gray-500">Without new financing</div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Revenue Model</h3>

                  <p className="text-gray-700 mb-4">
                    Absci operates a hybrid business model with three revenue streams:
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="bg-gray-50 p-5 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">1. Platform Partnerships ($20-50M upfront, $200-500M milestones)</h4>
                      <p className="text-gray-700 text-sm">
                        Pharma partners pay upfront fees for platform access plus milestone payments tied to development and commercial success. This is currently the primary revenue driver.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">2. Proprietary Pipeline (potential $1B+ per product)</h4>
                      <p className="text-gray-700 text-sm">
                        Wholly-owned programs that could generate full commercial revenues if successful. High risk but highest upside potential.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">3. Royalties (2-5% on net sales)</h4>
                      <p className="text-gray-700 text-sm">
                        Long-term revenue from partnered products that reach commercial launch. This becomes meaningful only post-2028.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Path to Profitability</h3>

                  <p className="text-gray-700 mb-4">
                    Current consensus estimates (based on analyst reports and company guidance):
                  </p>

                  <ul className="space-y-2 mb-6 list-disc list-inside">
                    <li className="text-gray-700">
                      <strong>2025E:</strong> Revenue $45-60M (primarily partnership upfronts), net loss $160-180M
                    </li>
                    <li className="text-gray-700">
                      <strong>2026E:</strong> Revenue $80-110M (milestone payments begin), net loss $140-160M
                    </li>
                    <li className="text-gray-700">
                      <strong>2027E:</strong> Revenue $130-170M, net loss $100-120M (assuming positive clinical readouts)
                    </li>
                    <li className="text-gray-700">
                      <strong>2028-2030:</strong> Path to profitability through combination of partnership milestones, royalties, and potential product revenues
                    </li>
                  </ul>

                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg mb-8">
                    <h4 className="font-semibold text-gray-900 mb-2">Financing Risk</h4>
                    <p className="text-gray-700">
                      With ~4 quarters of runway, Absci will likely need to raise additional capital in 2025. The terms of this financing will depend heavily on clinical data readouts. Positive data could enable favorable terms or strategic partnerships; negative data could result in significant dilution or force asset sales.
                    </p>
                  </div>

                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Valuation Analysis</h3>

                  <p className="text-gray-700 mb-4">
                    Three valuation approaches suggest current pricing offers significant upside:
                  </p>

                  <div className="overflow-x-auto mb-8">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Approach</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Methodology</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Valuation Range</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Implied Price</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">Comparable Companies</td>
                          <td className="px-6 py-4 text-sm text-gray-700">EV/Revenue multiples (AI biotech peers)</td>
                          <td className="px-6 py-4 text-sm text-gray-700">$650-900M</td>
                          <td className="px-6 py-4 text-sm text-gray-700">$6.50-9.00</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">Sum-of-the-Parts</td>
                          <td className="px-6 py-4 text-sm text-gray-700">Platform value + pipeline value (rNPV)</td>
                          <td className="px-6 py-4 text-sm text-gray-700">$800-1,200M</td>
                          <td className="px-6 py-4 text-sm text-gray-700">$8.00-12.00</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">DCF (10-year)</td>
                          <td className="px-6 py-4 text-sm text-gray-700">Discounted cash flows (15% WACC)</td>
                          <td className="px-6 py-4 text-sm text-gray-700">$700-1,100M</td>
                          <td className="px-6 py-4 text-sm text-gray-700">$7.00-11.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-gray-700">
                    <strong>Current Price: ~$5.20</strong> (as of Jan 2025) implies significant skepticism about clinical success and/or platform scalability. The valuation gap represents the market's probability-weighted assessment of technology risk.
                  </p>
                </section>

                {/* RISK ANALYSIS */}
                <section id="risks" className="mb-16 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Risk Analysis</h2>

                  <div className="space-y-6">
                    <div className="border-l-4 border-red-500 pl-6 py-2">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded mr-2">HIGH</span>
                        Clinical Validation Risk
                      </h4>
                      <p className="text-gray-700 mb-2">
                        AI-designed biologics have not yet proven superior efficacy or safety compared to traditionally discovered molecules in human trials. If early clinical programs fail, it undermines the entire platform thesis.
                      </p>
                      <p className="text-gray-700 text-sm italic">
                        <strong>Mitigation:</strong> Diversified pipeline with 8 partnership programs provides multiple shots on goal. However, systemic platform issues could affect all programs.
                      </p>
                    </div>

                    <div className="border-l-4 border-red-500 pl-6 py-2">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded mr-2">HIGH</span>
                        Financing Risk
                      </h4>
                      <p className="text-gray-700 mb-2">
                        With ~$180M cash and $45M/quarter burn, company needs additional capital within 12 months. Equity financing at current valuations would be highly dilutive.
                      </p>
                      <p className="text-gray-700 text-sm italic">
                        <strong>Mitigation:</strong> Partnership milestones could provide non-dilutive financing; strategic partnerships or asset sales offer alternative funding paths.
                      </p>
                    </div>

                    <div className="border-l-4 border-orange-500 pl-6 py-2">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded mr-2">MEDIUM</span>
                        Competitive Pressure
                      </h4>
                      <p className="text-gray-700 mb-2">
                        Generate Biomedicines (well-funded private company) and in-house pharma AI capabilities pose significant competition. If partners develop internal capabilities, partnership model is at risk.
                      </p>
                      <p className="text-gray-700 text-sm italic">
                        <strong>Mitigation:</strong> E. coli manufacturing moat provides differentiation; speed to clinic creates switching costs for partners already engaged.
                      </p>
                    </div>

                    <div className="border-l-4 border-orange-500 pl-6 py-2">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded mr-2">MEDIUM</span>
                        Manufacturing Scale-Up Risk
                      </h4>
                      <p className="text-gray-700 mb-2">
                        E. coli expression at commercial scale (multi-ton quantities) has never been demonstrated for therapeutic antibodies. Manufacturing issues could negate cost advantages.
                      </p>
                      <p className="text-gray-700 text-sm italic">
                        <strong>Mitigation:</strong> Company is building out commercial-scale manufacturing capabilities; partnerships with CDMOs provide backup options.
                      </p>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-6 py-2">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded mr-2">LOW</span>
                        Regulatory Risk
                      </h4>
                      <p className="text-gray-700 mb-2">
                        FDA has not issued specific guidance on AI-designed biologics, but antibodies are well-established therapeutic modality with clear regulatory pathway.
                      </p>
                      <p className="text-gray-700 text-sm italic">
                        <strong>Mitigation:</strong> Antibodies face lower regulatory hurdle than novel modalities; AI is used in discovery only, not manufacturing.
                      </p>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-6 py-2">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded mr-2">LOW</span>
                        Key Personnel Risk
                      </h4>
                      <p className="text-gray-700 mb-2">
                        Loss of key scientific or executive talent could impact platform development and partnership relationships.
                      </p>
                      <p className="text-gray-700 text-sm italic">
                        <strong>Mitigation:</strong> Platform is now institutionalized with large technical team; retention packages in place for key personnel.
                      </p>
                    </div>
                  </div>
                </section>

                {/* INVESTMENT RECOMMENDATION */}
                <section id="recommendation" className="mb-16 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Investment Recommendation</h2>

                  <div className="bg-gradient-to-r from-accent-50 to-primary-50 border-2 border-accent-500 p-8 rounded-lg mb-8">
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-accent-700 mb-2">BUY</div>
                      <div className="text-xl text-gray-800">Attractive Risk/Reward for Growth Investors</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Price Target</h4>
                        <div className="text-2xl font-bold text-primary-700">$8-12/share</div>
                        <div className="text-sm text-gray-600">55-130% upside from current $5.20</div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Time Horizon</h4>
                        <div className="text-2xl font-bold text-primary-700">3-5 years</div>
                        <div className="text-sm text-gray-600">Through clinical validation phase</div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Investment Rationale</h3>

                  <ol className="space-y-4 mb-8 list-decimal list-inside">
                    <li className="text-gray-700 pl-2">
                      <strong className="text-gray-900">Compelling Risk/Reward:</strong> Current valuation of $520M implies significant skepticism already priced in. Bull case of $1B+ valuation (based on successful platform validation) offers 100%+ upside, while downside is limited by cash position and partnership assets.
                    </li>
                    <li className="text-gray-700 pl-2">
                      <strong className="text-gray-900">Multiple Catalysts in Next 18 Months:</strong> Q2 2025 clinical readout, potential partnership announcements, and commercial manufacturing validation provide clear inflection points.
                    </li>
                    <li className="text-gray-700 pl-2">
                      <strong className="text-gray-900">Genuine Technical Differentiation:</strong> E. coli manufacturing platform provides sustainable competitive advantage if validated at scale. This is not just "AI for antibodies"—it's a fundamentally different production system.
                    </li>
                    <li className="text-gray-700 pl-2">
                      <strong className="text-gray-900">De-risked Through Partnerships:</strong> 8 pharma partnerships provide validation, diversification, and capital efficiency. Even if proprietary pipeline fails, platform partnerships offer meaningful value.
                    </li>
                    <li className="text-gray-700 pl-2">
                      <strong className="text-gray-900">Market Timing:</strong> We're at the early stages of AI adoption in drug discovery. Being early to a validated platform positions investors for long-term structural growth.
                    </li>
                  </ol>

                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Key Catalysts to Monitor</h3>

                  <div className="space-y-3 mb-8">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="font-semibold text-gray-900 mb-1">Q2 2025: First Clinical Data Readout</div>
                      <div className="text-sm text-gray-700">Success here validates platform and could drive 50%+ share price appreciation</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="font-semibold text-gray-900 mb-1">H2 2025: Additional Partnership Announcements</div>
                      <div className="text-sm text-gray-700">New partnerships de-risk financing needs and provide market validation</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="font-semibold text-gray-900 mb-1">2026: Commercial Manufacturing Validation</div>
                      <div className="text-sm text-gray-700">Demonstration of E. coli production at multi-kg scale proves manufacturing moat</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="font-semibold text-gray-900 mb-1">Ongoing: Partnership Milestone Achievements</div>
                      <div className="text-sm text-gray-700">Near-term revenue visibility reduces financing risk</div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Scenario Analysis</h3>

                  <div className="overflow-x-auto mb-8">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Scenario</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Probability</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">2027E Valuation</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Return</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Key Assumptions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr className="bg-green-50">
                          <td className="px-6 py-4 text-sm font-semibold text-green-900">Bull Case</td>
                          <td className="px-6 py-4 text-sm text-gray-700">25%</td>
                          <td className="px-6 py-4 text-sm text-gray-700">$1.5-2.0B</td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-700">+190-285%</td>
                          <td className="px-6 py-4 text-sm text-gray-700">Multiple clinical successes, platform broadly adopted, manufacturing scaled</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">Base Case</td>
                          <td className="px-6 py-4 text-sm text-gray-700">40%</td>
                          <td className="px-6 py-4 text-sm text-gray-700">$800-1,100M</td>
                          <td className="px-6 py-4 text-sm font-semibold text-primary-700">+55-110%</td>
                          <td className="px-6 py-4 text-sm text-gray-700">Mixed clinical results, selective partnership adoption, manufacturing challenges addressed</td>
                        </tr>
                        <tr className="bg-orange-50">
                          <td className="px-6 py-4 text-sm font-semibold text-orange-900">Bear Case</td>
                          <td className="px-6 py-4 text-sm text-gray-700">35%</td>
                          <td className="px-6 py-4 text-sm text-gray-700">$300-450M</td>
                          <td className="px-6 py-4 text-sm font-semibold text-orange-700">-40 to -15%</td>
                          <td className="px-6 py-4 text-sm text-gray-700">Clinical failures, manufacturing issues, competitive pressure forces platform pivots</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-gray-700 mb-4">
                    <strong>Expected Value:</strong> 25% × 240% + 40% × 80% + 35% × (-25%) = <strong className="text-accent-700">+83% expected return</strong>
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Who Should Invest?</h3>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
                    <p className="text-gray-800 mb-4">
                      This investment is appropriate for:
                    </p>
                    <ul className="space-y-2 text-gray-700 list-disc list-inside">
                      <li><strong>Growth investors</strong> with 3-5 year time horizons who can tolerate 40% downside risk for 100%+ upside potential</li>
                      <li><strong>Biotech specialists</strong> who can evaluate technical and clinical risk and monitor catalysts closely</li>
                      <li><strong>Thematic AI investors</strong> seeking exposure to AI drug discovery with public market liquidity</li>
                      <li><strong>Patient capital</strong> willing to hold through near-term volatility as clinical data emerges</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
                    <p className="text-gray-800 mb-4">
                      This investment is <strong>NOT</strong> appropriate for:
                    </p>
                    <ul className="space-y-2 text-gray-700 list-disc list-inside">
                      <li>Conservative investors seeking capital preservation</li>
                      <li>Short-term traders (high volatility expected around clinical readouts)</li>
                      <li>Investors who cannot monitor biotech news and adjust positions based on clinical data</li>
                      <li>Those seeking current income (no dividend, cash-burn model)</li>
                    </ul>
                  </div>
                </section>

                {/* Disclaimer */}
                <div className="mt-12 p-6 bg-gray-100 rounded-lg text-sm text-gray-600">
                  <p className="font-semibold mb-2">Disclaimer</p>
                  <p>
                    This analysis is for educational and demonstration purposes only and does not constitute investment advice.
                    All data and projections are based on publicly available information as of January 2025. Investors should
                    conduct their own due diligence and consult with financial advisors before making investment decisions.
                    The author may or may not hold positions in the securities discussed.
                  </p>
                </div>
              </div>

              {/* Project Navigation */}
              <ProjectNav prevProject={prevProject} nextProject={nextProject} />
            </article>
          </div>
        </div>
      </Section>
    </>
  );
}
