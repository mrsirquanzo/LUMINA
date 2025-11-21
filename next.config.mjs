import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],

  // Webpack configuration for puppeteer
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark puppeteer packages as external for server builds
      config.externals = [...(config.externals || []), 'puppeteer-core', '@sparticuz/chromium'];
    } else {
      // Prevent puppeteer from being bundled in client builds
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'puppeteer-core': false,
        '@sparticuz/chromium': false,
      };
    }
    return config;
  },

  // Experimental features for serverless deployment
  experimental: {
    outputFileTracingIncludes: {
      '/api/export-chat': ['./node_modules/@sparticuz/chromium/**/*'],
      '/api/deliverables/generate': ['./node_modules/@sparticuz/chromium/**/*'],
    },
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm, remarkFrontmatter],
    rehypePlugins: [
      rehypeSlug,
      // Remove autolink headings to prevent hyperlinked headings
    ],
  },
})

export default withMDX(nextConfig);
