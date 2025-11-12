import Section from "@/components/shared/Section";

export default function MockupPage() {
  return (
    <>
      {/* Header */}
      <Section background="white">
        <div className="max-w-6xl mx-auto text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Design Comparison: Experience & Background Section
          </h1>
          <p className="text-lg text-gray-600">
            Compare two design options for the reorganized experience section
          </p>
        </div>
      </Section>

      {/* Option A: Rich Formatting with Visual Hierarchy */}
      <Section background="gray">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Option A: Rich Formatting with Visual Hierarchy
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Uses varied typography, subtle dividers, and definition lists for distinction
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Section 1: Biotech R&D Leadership */}
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Biotech R&D Leadership
                </h3>

                <div className="space-y-4">
                  {/* Generate Biomedicines */}
                  <div className="pb-4 border-b border-gray-100">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                        GB
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-base">
                          Generate Biomedicines
                        </h4>
                        <p className="text-sm text-primary-600 font-medium">
                          AI-driven protein design & immunogenicity
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 ml-11">
                      Bridged biology with AI/ML teams to validate generative protein models and design immunogenicity workflows.
                    </p>
                  </div>

                  {/* Novartis */}
                  <div className="pb-4 border-b border-gray-100">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                        N
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-base">
                          Novartis
                        </h4>
                        <p className="text-sm text-primary-600 font-medium">
                          Oncology translational research
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 ml-11">
                      Designed biomarker assays, led pharmacodynamic assay transfer, and guided multi-program biomarker strategy.
                    </p>
                  </div>

                  {/* Intellia */}
                  <div className="pb-4 border-b border-gray-100">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                        I
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-base">
                          Intellia Therapeutics
                        </h4>
                        <p className="text-sm text-primary-600 font-medium">
                          CRISPR gene editing
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 ml-11">
                      Conducted CRISPR HSPC screens, analyzed editing outcomes, and supported IP filings (U.S. Patent 20200308603).
                    </p>
                  </div>

                  {/* Juno & MGH */}
                  <div>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                        J
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-base">
                          Juno Therapeutics & Massachusetts General Hospital
                        </h4>
                        <p className="text-sm text-primary-600 font-medium">
                          CAR-T & early-stage therapeutic discovery
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 ml-11">
                      Built CAR-T screening systems and NGS-based diagnostics supporting early-stage therapeutic discovery.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: AI, Data & Systems Engineering */}
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  AI, Data & Systems Engineering
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1.5">
                      AI/ML integration & agent architecture
                    </h4>
                    <p className="text-sm text-gray-700">
                      Designed and tested generative and predictive models for protein design, immunogenicity, and workflow automation.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1.5">
                      Computational analysis & data visualization
                    </h4>
                    <p className="text-sm text-gray-700">
                      <span className="inline-flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">Python</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">R</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">SQL</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">Qiagen Omicsoft</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">Tableau</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">Spotfire</span>
                      </span>
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1.5">
                      AI agent prototyping
                    </h4>
                    <p className="text-sm text-gray-700">
                      Developing portfolio-ready agents for patent analysis, business intelligence, and data-driven decision support.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1.5">
                      Prompt engineering & automation
                    </h4>
                    <p className="text-sm text-gray-700">
                      Building LLM-based agents that convert technical or IP documents into strategic insights.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Business Intelligence & Strategy */}
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

              {/* Section 4: Scientific & Technical Expertise */}
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Scientific & Technical Expertise
                </h3>

                <dl className="space-y-3">
                  <div>
                    <dt className="font-semibold text-gray-900 text-sm mb-1">
                      Therapeutic areas:
                    </dt>
                    <dd className="text-sm text-gray-700">
                      Immunology & oncology, cell & gene therapy
                    </dd>
                  </div>

                  <div>
                    <dt className="font-semibold text-gray-900 text-sm mb-1">
                      Modalities:
                    </dt>
                    <dd className="text-sm text-gray-700">
                      ADCs, TCEs, bispecifics, CRISPR, CAR-T, organ-on-chip
                    </dd>
                  </div>

                  <div>
                    <dt className="font-semibold text-gray-900 text-sm mb-1">
                      Analytical skills:
                    </dt>
                    <dd className="text-sm text-gray-700">
                      Transcriptomics, multi-omics, flow cytometry, immunogenicity assays
                    </dd>
                  </div>

                  <div>
                    <dt className="font-semibold text-gray-900 text-sm mb-1">
                      Computational tools:
                    </dt>
                    <dd className="text-sm text-gray-700">
                      RNA-seq pipelines, data visualization, AI model validation
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Option B: Clean & Consistent */}
      <Section background="white">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Option B: Clean & Consistent
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Uniform structure across all sections, simpler visual style
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Section 1: Biotech R&D Leadership */}
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Biotech R&D Leadership
                </h3>

                <div className="space-y-4">
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
                    <p className="text-sm text-gray-600 mb-1 ml-8">
                      AI-driven protein design & immunogenicity
                    </p>
                    <p className="text-sm text-gray-700 ml-8">
                      Bridged biology with AI/ML teams to validate generative protein models and design immunogenicity workflows.
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
                    <p className="text-sm text-gray-600 mb-1 ml-8">
                      Oncology translational research
                    </p>
                    <p className="text-sm text-gray-700 ml-8">
                      Designed biomarker assays, led pharmacodynamic assay transfer, and guided multi-program biomarker strategy.
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
                    <p className="text-sm text-gray-600 mb-1 ml-8">
                      CRISPR gene editing
                    </p>
                    <p className="text-sm text-gray-700 ml-8">
                      Conducted CRISPR HSPC screens, analyzed editing outcomes, and supported IP filings (U.S. Patent 20200308603).
                    </p>
                  </div>

                  {/* Juno & MGH */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-teal-600 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                        J
                      </div>
                      <h4 className="font-semibold text-gray-900 text-base">
                        Juno Therapeutics & MGH
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-1 ml-8">
                      CAR-T & early-stage therapeutic discovery
                    </p>
                    <p className="text-sm text-gray-700 ml-8">
                      Built CAR-T screening systems and NGS-based diagnostics supporting early-stage therapeutic discovery.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: AI, Data & Systems Engineering */}
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  AI, Data & Systems Engineering
                </h3>

                <ul className="space-y-2.5 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2 mt-0.5">•</span>
                    <div>
                      <span className="text-sm font-medium text-gray-900">AI/ML integration & agent architecture</span>
                      <span className="text-sm text-gray-700"> — Designed and tested generative and predictive models for protein design, immunogenicity, and workflow automation</span>
                    </div>
                  </li>
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

              {/* Section 3: Business Intelligence & Strategy */}
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

              {/* Section 4: Scientific & Technical Expertise */}
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
        </div>
      </Section>

      {/* Comparison Notes */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Key Differences
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-primary-600 mb-3">
                  Option A: Rich Formatting
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ Visual dividers between companies</li>
                  <li>✓ Color-coded emphasis for roles</li>
                  <li>✓ Tech badges for tools</li>
                  <li>✓ Definition list style for expertise</li>
                  <li>✓ More visual variety between sections</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary-600 mb-3">
                  Option B: Clean & Consistent
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ Uniform bullet-based structure</li>
                  <li>✓ Simpler typography hierarchy</li>
                  <li>✓ Em-dash style for inline descriptions</li>
                  <li>✓ Easier to scan quickly</li>
                  <li>✓ More professional/minimal aesthetic</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
