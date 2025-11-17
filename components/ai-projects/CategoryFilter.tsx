'use client';

export type ProjectCategory = 'ai-agent' | 'design';

interface CategoryFilterProps {
  activeCategory: ProjectCategory;
  onCategoryChange: (category: ProjectCategory) => void;
}

export default function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  const categories: { value: ProjectCategory; label: string }[] = [
    { value: 'ai-agent', label: 'AI Agents' },
    { value: 'design', label: 'Design Work' },
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center mb-12">
      {categories.map((category) => {
        const isActive = activeCategory === category.value;
        return (
          <button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all duration-200
              ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
              }
            `}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
