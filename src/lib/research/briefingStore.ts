import { create } from 'zustand';
import type { BriefingView } from './sseTypes.js';

const STORAGE_KEY = 'lumina:research:briefings:v1';
const SAVED_AT_KEY = 'lumina:research:briefings-savedAt:v1';

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

function loadSavedAt(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(SAVED_AT_KEY);
    if (stored) return JSON.parse(stored) as Record<string, number>;
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

function saveSavedAt(savedAt: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVED_AT_KEY, JSON.stringify(savedAt));
  } catch {
    // ignore
  }
}

/** Exported for tests: the initial persisted state. */
export function loadState(): { briefings: Record<string, BriefingView>; savedAt: Record<string, number> } {
  return { briefings: loadBriefings(), savedAt: loadSavedAt() };
}

interface BriefingStore {
  briefings: Record<string, BriefingView>;
  savedAt: Record<string, number>;
  setBriefing(runId: string, b: BriefingView): void;
  getBriefing(runId: string): BriefingView | undefined;
  removeBriefing(runId: string): void;
}

export const useBriefingStore = create<BriefingStore>()((set, get) => ({
  ...loadState(),
  setBriefing: (runId, b) =>
    set((s) => {
      const briefings = { ...s.briefings, [runId]: b };
      const savedAt = { ...s.savedAt, [runId]: Date.now() };
      saveBriefings(briefings);
      saveSavedAt(savedAt);
      return { briefings, savedAt };
    }),
  getBriefing: (runId) => get().briefings[runId],
  removeBriefing: (runId) =>
    set((s) => {
      if (!(runId in s.briefings)) return s;
      const { [runId]: _drop, ...briefings } = s.briefings;
      const { [runId]: _dropAt, ...savedAt } = s.savedAt;
      saveBriefings(briefings);
      saveSavedAt(savedAt);
      return { briefings, savedAt };
    }),
}));
