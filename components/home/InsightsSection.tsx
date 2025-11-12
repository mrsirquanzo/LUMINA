import Link from "next/link";
import Section from "@/components/shared/Section";
import Button from "@/components/shared/Button";

export default function InsightsSection() {
  const posts = [
    {
      slug: "ai-drug-discovery-hype",
      title: "Separating Hype from Reality in AI Drug Discovery",
      excerpt: "Recent headlines claim AI will revolutionize drug development overnight. Here's what the data actually shows about timelines and success rates.",
      category: "Opinion",
      date: "Jan 15, 2025",
      readingTime: "4 min",
      gradient: "from-purple-100 to-violet-50",
      categoryColor: "text-purple-600",
    },
    {
      slug: "tcr-vs-car-t",
      title: "TCR vs CAR-T: Understanding the Mechanisms",
      excerpt: "Breaking down the technical differences between TCR and CAR-T therapies and why it matters for investment decisions.",
      category: "Technical",
      date: "Jan 12, 2025",
      readingTime: "6 min",
      gradient: "from-indigo-100 to-blue-50",
      categoryColor: "text-indigo-600",
    },
    {
      slug: "biotech-ma-trends",
      title: "Why Biotech M&A is Accelerating in 2025",
      excerpt: "Analysis of recent deals and what's driving the current wave of consolidation in the sector.",
      category: "Market",
      date: "Jan 10, 2025",
      readingTime: "5 min",
      gradient: "from-amber-100 to-orange-50",
      categoryColor: "text-amber-600",
    },
  ];

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

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group"
            >
              <div className="card hover:border-gray-300 border-2 border-transparent transition-all h-full flex flex-col">
                {/* Category Badge */}
                <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${post.gradient} px-3 py-1.5 rounded-full mb-4 self-start`}>
                  <span className={`text-xs font-semibold uppercase tracking-wide ${post.categoryColor}`}>
                    {post.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-700 mb-4 leading-relaxed flex-grow">
                  {post.excerpt}
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
                  <span>{post.date}</span>
                  <span>{post.readingTime} read</span>
                </div>

                {/* Read More */}
                <div className="flex items-center text-primary-600 font-medium mt-3 group-hover:text-primary-700">
                  Read More
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center">
          <Button href="/blog" variant="secondary">
            View All Insights
          </Button>
        </div>
      </div>
    </Section>
  );
}
