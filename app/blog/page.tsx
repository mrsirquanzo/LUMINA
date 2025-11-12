import { Metadata } from 'next';
import Link from 'next/link';
import { getAllBlogPosts } from '@/lib/mdx';
import Section from '@/components/shared/Section';

export const metadata: Metadata = {
  title: 'Insights & Commentary | Quan Ho',
  description: 'Curious explorations in science, business, and technology',
  keywords: ['biotech', 'AI', 'drug discovery', 'market analysis', 'commentary'],
};

export default function BlogPage() {
  const posts = getAllBlogPosts();

  const categoryStyles: Record<string, { gradient: string; color: string }> = {
    Opinion: { gradient: 'from-purple-100 to-violet-50', color: 'text-purple-600' },
    Technical: { gradient: 'from-indigo-100 to-blue-50', color: 'text-indigo-600' },
    Market: { gradient: 'from-amber-100 to-orange-50', color: 'text-amber-600' },
    Research: { gradient: 'from-blue-100 to-blue-50', color: 'text-blue-600' },
    Company: { gradient: 'from-green-100 to-emerald-50', color: 'text-green-600' },
    Trends: { gradient: 'from-teal-100 to-cyan-50', color: 'text-teal-600' },
  };

  return (
    <Section>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Insights & Commentary
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Curious explorations in science, business, and technology
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const { slug, title, description, category, publishedDate, readingTime } = post.frontmatter;
              const styles = categoryStyles[category] || categoryStyles.Opinion;

              return (
                <Link
                  key={slug}
                  href={`/blog/${slug}`}
                  className="group"
                >
                  <div className="card hover:border-gray-300 border-2 border-transparent transition-all h-full flex flex-col">
                    {/* Category Badge */}
                    <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${styles.gradient} px-3 py-1.5 rounded-full mb-4 self-start`}>
                      <span className={`text-xs font-semibold uppercase tracking-wide ${styles.color}`}>
                        {category}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors">
                      {title}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-700 mb-4 leading-relaxed flex-grow">
                      {description}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
                      <span>{new Date(publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>{readingTime}</span>
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
              );
            })}
          </div>
        )}
      </div>
    </Section>
  );
}
