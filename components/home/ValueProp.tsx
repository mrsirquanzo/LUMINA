import Section from "@/components/shared/Section";

export default function ValueProp() {
  const values = [
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10">
          <path d="M4 5h16M8 5v14m8-14v14M4 19h16" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ),
      title: "Translate Deep Science",
      description:
        "Transform complex R&D and clinical data into clear, actionable insights for investment decisions.",
      hover: "Examples: target evaluation briefs, assay readouts to strategy memos, clinical data synthesis",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10">
          <path d="M4 18h4V6H4v12zm6 0h4V10h-4v8zm6 0h4V4h-4v14z" fill="currentColor" />
        </svg>
      ),
      title: "Deliver Business Intelligence",
      description:
        "Build analytical frameworks for competitive intelligence, market assessment, and strategic planning.",
      hover: "Examples: competitive landscape maps, pipeline trackers, investment diligence scorecards",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
          <rect x="7" y="7" width="10" height="10" rx="2" fill="white" />
        </svg>
      ),
      title: "Build AI Agents",
      description:
        "Create intelligent systems that automate due diligence, accelerate analysis, and scale expertise.",
      hover: "Examples: data analyst agent, patent expert agent, financial analyst agent",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10">
          <path d="M5 6h14M5 12h14M5 18h14" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ),
      title: "Design Data Systems",
      description:
        "Develop interactive dashboards and visualization systems that make complex data immediately actionable.",
      hover: "Examples: interactive dashboards, data visualizations, real-time analytics",
    },
  ];

  return (
    <Section background="gray">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What I Do
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Scientist × Strategist × Builder at the intersection of biotech, data, and intelligent design
          </p>
        </div>

        {/* Value Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <div
              key={index}
              className="group card text-center hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              title={value.hover}
            >
              <div className="flex justify-center text-primary-600 mb-4">
                {value.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {value.title}
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                {value.description}
              </p>
              <div className="opacity-0 group-hover:opacity-100 mt-3 text-xs text-gray-500 transition-opacity">
                {value.hover}
              </div>
            </div>
          ))}
        </div>

        {/* Closing Statement */}
        <p className="mt-10 text-center text-gray-700 max-w-2xl mx-auto leading-relaxed">
          These capabilities work together to transform scientific complexity into strategic clarity—and strategy into scalable, intelligent systems.
        </p>
      </div>
    </Section>
  );
}
