import { create } from 'zustand';
import type { BriefingView } from './sseTypes.js';

const STORAGE_KEY = 'lumina:research:briefings:v1';

function loadBriefings(): Record<string, BriefingView> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Record<string, BriefingView>;
  } catch {
    // ignore
  }
  return {};
}

function saveBriefings(briefings: Record<string, BriefingView>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(briefings));
  } catch {
    // ignore
  }
}

interface BriefingStore {
  briefings: Record<string, BriefingView>;
  setBriefing(runId: string, b: BriefingView): void;
  getBriefing(runId: string): BriefingView | undefined;
}

export const useBriefingStore = create<BriefingStore>()((set, get) => ({
  briefings: loadBriefings(),
  setBriefing: (runId, b) =>
    set((s) => {
      const briefings = { ...s.briefings, [runId]: b };
      saveBriefings(briefings);
      return { briefings };
    }),
  getBriefing: (runId) => get().briefings[runId],
}));
