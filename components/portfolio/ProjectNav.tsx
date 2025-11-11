import Link from "next/link";
import { Project } from "@/lib/types";

interface ProjectNavProps {
  prevProject?: Project;
  nextProject?: Project;
}

export default function ProjectNav({ prevProject, nextProject }: ProjectNavProps) {
  return (
    <div className="border-t border-gray-200 pt-8 mt-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Previous Project */}
        <div>
          {prevProject && (
            <Link
              href={`/portfolio/${prevProject.slug}`}
              className="group flex items-center text-left"
            >
              <svg
                className="w-5 h-5 text-primary-600 mr-2 group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <div>
                <div className="text-sm text-gray-600 mb-1">Previous</div>
                <div className="text-primary-600 font-medium group-hover:text-primary-700">
                  {prevProject.title.split(":")[0]}
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Back to Portfolio */}
        <div className="flex items-center justify-center">
          <Link
            href="/portfolio"
            className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
          >
            Back to Portfolio
          </Link>
        </div>

        {/* Next Project */}
        <div className="flex justify-end">
          {nextProject && (
            <Link
              href={`/portfolio/${nextProject.slug}`}
              className="group flex items-center text-right"
            >
              <div>
                <div className="text-sm text-gray-600 mb-1">Next</div>
                <div className="text-primary-600 font-medium group-hover:text-primary-700">
                  {nextProject.title.split(":")[0]}
                </div>
              </div>
              <svg
                className="w-5 h-5 text-primary-600 ml-2 group-hover:translate-x-1 transition-transform"
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
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
