import { create } from 'zustand';
import { ViewMode } from './types';

export type SortOption = 'name' | 'score' | 'updated' | 'modality';
export type SmartView = 'all' | 'watchlist' | 'high-conviction' | 'needs-review' | 'trending-up' | null;

interface LuminaStore {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  // Filter state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedModalities: string[];
  setSelectedModalities: (modalities: string[]) => void;
  toggleModality: (modality: string) => void;
  selectedTargets: string[];
  setSelectedTargets: (targets: string[]) => void;
  toggleTarget: (target: string) => void;
  selectedStages: string[];
  setSelectedStages: (stages: string[]) => void;
  toggleStage: (stage: string) => void;
  // Smart view state
  activeSmartView: SmartView;
  setActiveSmartView: (view: SmartView) => void;
  // Sort state
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  // Clear all filters
  clearAllFilters: () => void;
}

export const useLuminaStore = create<LuminaStore>((set) => ({
  activeView: 'scientist',
  setActiveView: (view) => set({ activeView: view }),
  // Filter state
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectedModalities: [],
  setSelectedModalities: (modalities) => set({ selectedModalities: modalities }),
  toggleModality: (modality) =>
    set((state) => ({
      selectedModalities: state.selectedModalities.includes(modality)
        ? state.selectedModalities.filter((m) => m !== modality)
        : [...state.selectedModalities, modality],
    })),
  selectedTargets: [],
  setSelectedTargets: (targets) => set({ selectedTargets: targets }),
  toggleTarget: (target) =>
    set((state) => ({
      selectedTargets: state.selectedTargets.includes(target)
        ? state.selectedTargets.filter((t) => t !== target)
        : [...state.selectedTargets, target],
    })),
  selectedStages: [],
  setSelectedStages: (stages) => set({ selectedStages: stages }),
  toggleStage: (stage) =>
    set((state) => ({
      selectedStages: state.selectedStages.includes(stage)
        ? state.selectedStages.filter((s) => s !== stage)
        : [...state.selectedStages, stage],
    })),
  // Smart view state
  activeSmartView: null,
  setActiveSmartView: (view) => set({ activeSmartView: view }),
  // Sort state
  sortBy: 'name',
  setSortBy: (sort) => set({ sortBy: sort }),
  // Clear all filters
  clearAllFilters: () =>
    set({
      searchQuery: '',
      selectedModalities: [],
      selectedTargets: [],
      selectedStages: [],
      activeSmartView: null,
    }),
}));


