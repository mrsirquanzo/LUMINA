import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMDXContent, getAllBlogPosts } from '@/lib/mdx';
import Section from '@/components/shared/Section';
import Link from 'next/link';

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.frontmatter.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getMDXContent('blog', params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.frontmatter.title} | Quan Ho`,
    description: post.frontmatter.description,
    keywords: post.frontmatter.tags,
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getMDXContent('blog', params.slug);

  if (!post) {
    notFound();
  }

  const { frontmatter } = post;

  // Dynamically import the MDX content
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const MDXContent = require(`@/content/blog/${params.slug}.mdx`).default;

  const categoryStyles: Record<string, { gradient: string; color: string }> = {
    Opinion: { gradient: 'from-purple-100 to-violet-50', color: 'text-purple-600' },
    Technical: { gradient: 'from-indigo-100 to-blue-50', color: 'text-indigo-600' },
    Market: { gradient: 'from-amber-100 to-orange-50', color: 'text-amber-600' },
    Research: { gradient: 'from-blue-100 to-blue-50', color: 'text-blue-600' },
    Company: { gradient: 'from-green-100 to-emerald-50', color: 'text-green-600' },
    Trends: { gradient: 'from-teal-100 to-cyan-50', color: 'text-teal-600' },
  };

  const styles = categoryStyles[frontmatter.category] || categoryStyles.Opinion;

  return (
    <Section>
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8 font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Insights
        </Link>

        {/* Category Badge */}
        <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${styles.gradient} px-4 py-2 rounded-full mb-6`}>
          <span className={`text-sm font-semibold uppercase tracking-wide ${styles.color}`}>
            {frontmatter.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          {frontmatter.title}
        </h1>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-8 pb-8 border-b border-gray-200">
          <span>
            {new Date(frontmatter.publishedDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span>•</span>
          <span>{frontmatter.readingTime}</span>
        </div>

        {/* Content */}
        <article className="prose prose-lg prose-gray max-w-none
          prose-headings:font-bold prose-headings:text-gray-900
          prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
          prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
          prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-900 prose-strong:font-semibold
          prose-ul:my-6 prose-ol:my-6
          prose-li:text-gray-700 prose-li:my-2
          prose-code:text-primary-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-blockquote:border-l-4 prose-blockquote:border-primary-600 prose-blockquote:pl-4 prose-blockquote:italic
        ">
          <MDXContent />
        </article>

        {/* Tags */}
        {frontmatter.tags && frontmatter.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {frontmatter.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Back Link Bottom */}
        <div className="mt-12">
          <Link
            href="/blog"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Insights
          </Link>
        </div>
      </div>
    </Section>
  );
}
