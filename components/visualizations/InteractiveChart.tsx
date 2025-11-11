"use client";

import { ReactNode } from "react";

interface InteractiveChartProps {
  title: string;
  subtitle?: string;
  source?: string;
  sourceUrl?: string;
  children: ReactNode;
  fullWidth?: boolean;
}

export default function InteractiveChart({
  title,
  subtitle,
  source,
  sourceUrl,
  children,
  fullWidth = false,
}: InteractiveChartProps) {
  return (
    <div className={`my-8 ${fullWidth ? "w-full" : "max-w-4xl"} mx-auto`}>
      {/* Chart Title */}
      <div className="mb-4">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-600">{subtitle}</p>
        )}
      </div>

      {/* Chart Container */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {children}
      </div>

      {/* Source Attribution */}
      {source && (
        <p className="text-sm text-gray-600 mt-2">
          Source:{" "}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              {source}
            </a>
          ) : (
            source
          )}
        </p>
      )}
    </div>
  );
}
