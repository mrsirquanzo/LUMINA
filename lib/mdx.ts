import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const contentDirectory = path.join(process.cwd(), 'content');

export interface MDXFrontmatter {
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  publishedDate: string;
  tags: string[];
  featured?: boolean;
  thumbnail?: string;
  readingTime?: string;
  // Technical projects specific
  projectType?: 'ai-agent' | 'design';
  demoUrl?: string;
  githubUrl?: string;
  figmaUrl?: string;
  techStack?: string[];
}

export interface MDXContent {
  frontmatter: MDXFrontmatter;
  content: string;
  readingTime: string;
}

// Get all MDX files from a directory
export function getMDXFiles(directory: string): string[] {
  const fullPath = path.join(contentDirectory, directory);
  if (!fs.existsSync(fullPath)) {
    return [];
  }
  return fs.readdirSync(fullPath).filter((file) => file.endsWith('.mdx'));
}

// Read and parse an MDX file
export function getMDXContent(directory: string, slug: string): MDXContent | null {
  try {
    const fullPath = path.join(contentDirectory, directory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    const readTime = readingTime(content);

    return {
      frontmatter: {
        ...data,
        slug,
        readingTime: readTime.text,
      } as MDXFrontmatter,
      content,
      readingTime: readTime.text,
    };
  } catch (error) {
    console.error(`Error reading MDX file ${directory}/${slug}.mdx:`, error);
    return null;
  }
}

// Get all investment project contents (legacy - for backward compatibility)
export function getAllProjects(): MDXContent[] {
  const files = getMDXFiles('projects');
  return files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, '');
      return getMDXContent('projects', slug);
    })
    .filter((content): content is MDXContent => content !== null)
    .sort((a, b) => {
      // Sort by publishedDate descending
      return new Date(b.frontmatter.publishedDate).getTime() - new Date(a.frontmatter.publishedDate).getTime();
    });
}

// Get all case studies
export function getAllCaseStudies(): MDXContent[] {
  const files = getMDXFiles('case-studies');
  return files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, '');
      return getMDXContent('case-studies', slug);
    })
    .filter((content): content is MDXContent => content !== null)
    .sort((a, b) => {
      // Sort by publishedDate descending
      return new Date(b.frontmatter.publishedDate).getTime() - new Date(a.frontmatter.publishedDate).getTime();
    });
}

// Get all technical projects (legacy - for backward compatibility)
export function getAllTechnicalProjects(): MDXContent[] {
  const files = getMDXFiles('technical-projects');
  return files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, '');
      return getMDXContent('technical-projects', slug);
    })
    .filter((content): content is MDXContent => content !== null);
}

// Get all AI projects
export function getAllAIProjects(): MDXContent[] {
  const files = getMDXFiles('ai-projects');
  return files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, '');
      return getMDXContent('ai-projects', slug);
    })
    .filter((content): content is MDXContent => content !== null);
}

// Get featured projects (legacy)
export function getFeaturedProjects(): MDXContent[] {
  return getAllProjects().filter((project) => project.frontmatter.featured);
}

// Get featured case studies
export function getFeaturedCaseStudies(): MDXContent[] {
  return getAllCaseStudies().filter((project) => project.frontmatter.featured);
}

// Get technical projects by type (legacy)
export function getTechnicalProjectsByType(type: 'ai-agent' | 'design' | 'all'): MDXContent[] {
  const allProjects = getAllTechnicalProjects();
  if (type === 'all') return allProjects;
  return allProjects.filter((project) => project.frontmatter.projectType === type);
}

// Get AI projects by type
export function getAIProjectsByType(type: 'ai-agent' | 'design' | 'all'): MDXContent[] {
  const allProjects = getAllAIProjects();
  if (type === 'all') return allProjects;
  return allProjects.filter((project) => project.frontmatter.projectType === type);
}
