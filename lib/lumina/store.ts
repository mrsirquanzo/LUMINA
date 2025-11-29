import { create } from 'zustand';
import { ViewMode } from './types';

interface LuminaStore {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
}

export const useLuminaStore = create<LuminaStore>((set) => ({
  activeView: 'scientist',
  setActiveView: (view) => set({ activeView: view }),
}));


