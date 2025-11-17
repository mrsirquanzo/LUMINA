import Section from "@/components/shared/Section";

export default function InsightsSection() {
  // Temporarily hidden - content coming soon
  // const posts = [
  //   {
  //     slug: "ai-drug-discovery-hype",
  //     title: "Separating Hype from Reality in AI Drug Discovery",
  //     excerpt: "Recent headlines claim AI will revolutionize drug development overnight. Here's what the data actually shows about timelines and success rates.",
  //     category: "Opinion",
  //     date: "Jan 15, 2025",
  //     readingTime: "4 min",
  //     gradient: "from-purple-100 to-violet-50",
  //     categoryColor: "text-purple-600",
  //   },
  //   {
  //     slug: "tcr-vs-car-t",
  //     title: "TCR vs CAR-T: Understanding the Mechanisms",
  //     excerpt: "Breaking down the technical differences between TCR and CAR-T therapies and why it matters for investment decisions.",
  //     category: "Technical",
  //     date: "Jan 12, 2025",
  //     readingTime: "6 min",
  //     gradient: "from-indigo-100 to-blue-50",
  //     categoryColor: "text-indigo-600",
  //   },
  //   {
  //     slug: "biotech-ma-trends",
  //     title: "Why Biotech M&A is Accelerating in 2025",
  //     excerpt: "Analysis of recent deals and what's driving the current wave of consolidation in the sector.",
  //     category: "Market",
  //     date: "Jan 10, 2025",
  //     readingTime: "5 min",
  //     gradient: "from-amber-100 to-orange-50",
  //     categoryColor: "text-amber-600",
  //   },
  // ];

  return (
    <Section background="gray">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Insights & Commentary
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Curious explorations in science, business, and technology
          </p>
        </div>

        {/* Placeholder with Thinking Animation */}
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 flex gap-2">
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-2xl font-semibold text-gray-800">
            More to come. Worth the wait.
          </p>
        </div>
      </div>
    </Section>
  );
}
