'use client';

import { useState } from 'react';
import CategoryFilter, { ProjectCategory } from '@/components/ai-projects/CategoryFilter';
import AIProjectCard from '@/components/ai-projects/AIProjectCard';
import { MDXContent } from '@/lib/mdx';

interface AIProjectsClientProps {
  projects: MDXContent[];
}

export default function AIProjectsClient({ projects }: AIProjectsClientProps) {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('ai-agent');

  // Filter projects based on active category
  const filteredProjects = (activeCategory === 'ai-agent'
    ? projects.filter(project =>
        project.frontmatter.projectType === 'ai-agent' ||
        project.frontmatter.projectType === 'multi-agent'
      )
    : projects.filter(project => project.frontmatter.projectType === activeCategory)
  ).sort((a, b) => {
    // Sort featured projects first
    if (a.frontmatter.featured && !b.frontmatter.featured) return -1;
    if (!a.frontmatter.featured && b.frontmatter.featured) return 1;
    return 0;
  });

  return (
    <>
      {/* Category Filter */}
      <CategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Project Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <AIProjectCard
              key={project.frontmatter.slug}
              project={project}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            🧪 Brewing in the design lab
          </p>
        </div>
      )}
    </>
  );
}
