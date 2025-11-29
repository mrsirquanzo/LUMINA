"use client";

import { useLuminaStore } from '@/lib/lumina/store';
import { ViewMode } from '@/lib/lumina/types';

export default function LuminaHeader() {
  const { activeView, setActiveView } = useLuminaStore();

  const views: { value: ViewMode; label: string }[] = [
    { value: 'scientist', label: 'Scientist' },
    { value: 'scout', label: 'Scout' },
    { value: 'vc', label: 'VC' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-amber-400 bg-clip-text text-transparent">
            LUMINA Dashboard
          </h1>
          
          {/* Segmented Control */}
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-1 border border-slate-700">
            {views.map((view) => (
              <button
                key={view.value}
                onClick={() => setActiveView(view.value)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${
                    activeView === view.value
                      ? getActiveStyles(view.value)
                      : 'text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function getActiveStyles(view: ViewMode): string {
  switch (view) {
    case 'scientist':
      return 'bg-violet-600 text-white shadow-sm';
    case 'scout':
      return 'bg-cyan-600 text-white shadow-sm';
    case 'vc':
      return 'bg-amber-600 text-white shadow-sm';
    default:
      return 'bg-gray-200 text-gray-900';
  }
}


