"use client";

import { cn } from '@/lib/utils';

interface AdverseEvent {
  event: string;
  allGrade: number; // percentage
  grade3_4: number; // percentage
  related: 'Target' | 'Payload' | 'Both';
  comparator?: number; // percentage vs Padcev
}

interface AdverseEventTableProps {
  aeTable: AdverseEvent[];
}

export default function AdverseEventTable({ aeTable }: AdverseEventTableProps) {
  const getGrade34Color = (rate: number) => {
    if (rate > 5) return 'text-red-400 font-bold';
    if (rate < 5) return 'text-emerald-400';
    return 'text-amber-400';
  };

  const getRelationshipBadge = (related: string) => {
    const colors = {
      Target: 'bg-scientist-primary-500/20 text-scientist-primary-300 border-scientist-primary-500/30',
      Payload: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      Both: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    };
    return colors[related as keyof typeof colors] || 'bg-slate-700/50 text-slate-300 border-slate-600';
  };

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-6">Adverse Events</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-slate-900 z-10">
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Adverse Event
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                All Grade
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Grade 3-4
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Relationship
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                vs Padcev
              </th>
            </tr>
          </thead>
          <tbody>
            {aeTable.length > 0 ? (
              aeTable.map((event, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-slate-200 font-medium">
                    {event.event}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300 text-right">
                    {event.allGrade}%
                  </td>
                  <td className={cn('py-3 px-4 text-sm text-right', getGrade34Color(event.grade3_4))}>
                    {event.grade3_4}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border',
                        getRelationshipBadge(event.related)
                      )}
                    >
                      {event.related}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-400 text-right">
                    {event.comparator !== undefined ? `${event.comparator}%` : 'N/A'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No adverse event data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-400">
          * Grade 3-4 events in <span className="text-red-400">red</span> indicate rates &gt;5%
        </p>
      </div>
    </div>
  );
}

