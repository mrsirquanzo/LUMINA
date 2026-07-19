import { createContext, useContext } from 'react';
import type { GateCascade, GateState, GatingData, FlowMetrics } from './model';

export interface GatingContextValue {
  data: GatingData;
  gates: GateState;
  cascade: GateCascade;
  metrics: FlowMetrics;
  isDefault: boolean;
  setGates: (update: (current: GateState) => GateState) => void;
  resetGates: () => void;
}

export const GatingContext = createContext<GatingContextValue | null>(null);

export function useGating() {
  return useContext(GatingContext);
}
