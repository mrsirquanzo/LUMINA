'use client';

import { useState } from 'react';
import CategoryFilter, { ProjectCategory } from '@/components/technical-projects/CategoryFilter';
import TechnicalProjectCard from '@/components/technical-projects/TechnicalProjectCard';
import { MDXContent } from '@/lib/mdx';

interface TechnicalProjectsClientProps {
  projects: MDXContent[];
}

export default function TechnicalProjectsClient({ projects }: TechnicalProjectsClientProps) {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('all');

  // Filter projects based on active category
  const filteredProjects = activeCategory === 'all'
    ? projects
    : projects.filter(project => project.frontmatter.projectType === activeCategory);

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
            <TechnicalProjectCard
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
