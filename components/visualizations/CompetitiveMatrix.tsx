"use client";

interface CompetitiveMatrixProps {
  data: {
    company: string;
    [key: string]: string | number;
  }[];
  metrics: {
    key: string;
    label: string;
    type?: "text" | "rating" | "number";
  }[];
}

export default function CompetitiveMatrix({ data, metrics }: CompetitiveMatrixProps) {
  const renderCell = (value: string | number, type: string = "text") => {
    if (type === "rating") {
      // Render stars for ratings (assumes value is 1-5)
      const rating = typeof value === "number" ? value : parseFloat(value as string);
      return (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-4 h-4 ${
                i < rating ? "text-yellow-400" : "text-gray-300"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      );
    }

    if (type === "number") {
      return <span className="font-mono text-sm">{value}</span>;
    }

    return <span className="text-sm">{value}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
            >
              Company
            </th>
            {metrics.map((metric) => (
              <th
                key={metric.key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
              >
                {metric.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {row.company}
              </td>
              {metrics.map((metric) => (
                <td
                  key={metric.key}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                >
                  {renderCell(row[metric.key], metric.type)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
