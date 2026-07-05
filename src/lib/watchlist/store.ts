import { create } from 'zustand';
import { formatTargetDisplayName } from '../targetNaming.js';

const KEY = 'lumina:intelligence:trackedTargets:v1';
const CAP = 8;

function normalize(list: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of list) {
    const t = formatTargetDisplayName(String(raw)).trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

/** Exported for tests + store init: read + normalize the persisted targets. */
export function loadTargets(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? normalize(parsed as string[]).slice(-CAP) : [];
  } catch {
    return [];
  }
}

function persist(targets: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(targets));
  } catch {
    // ignore
  }
}

interface WatchlistStore {
  targets: string[];
  add(target: string): void;
  remove(target: string): void;
  seedIfEmpty(defaults: string[]): void;
}

export const useWatchlistStore = create<WatchlistStore>()((set, get) => ({
  targets: loadTargets(),
  add: (target) =>
    set(() => {
      // remove any case-insensitive dupe, append the new one, keep the 8 most recent
      const targets = normalize([...get().targets, target]).slice(-CAP);
      persist(targets);
      return { targets };
    }),
  remove: (target) =>
    set(() => {
      const k = formatTargetDisplayName(String(target)).trim().toLowerCase();
      const targets = get().targets.filter((t) => t.toLowerCase() !== k);
      persist(targets);
      return { targets };
    }),
  seedIfEmpty: (defaults) =>
    set(() => {
      if (get().targets.length > 0) return {};
      const targets = normalize(defaults).slice(-CAP);
      persist(targets);
      return { targets };
    }),
}));
