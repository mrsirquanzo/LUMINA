import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  cloneGateState,
  computeCascade,
  computeMetrics,
  gatesEqual,
  type GateState,
  type GatingData,
} from './model';
import { GatingContext, type GatingContextValue } from './gatingStore';

export function GatingProvider({ url, children }: { url?: string; children: ReactNode }) {
  const [data, setData] = useState<GatingData | null>(null);
  const [gates, setGateState] = useState<GateState | null>(null);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load gate events (${response.status})`);
        return response.json() as Promise<GatingData>;
      })
      .then((nextData) => {
        setData(nextData);
        setGateState(cloneGateState(nextData.defaults));
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Flow gating data failed to load', error);
        }
      });
    return () => controller.abort();
  }, [url]);

  const setGates = useCallback((update: (current: GateState) => GateState) => {
    setGateState((current) => current ? update(current) : current);
  }, []);

  const resetGates = useCallback(() => {
    if (data) setGateState(cloneGateState(data.defaults));
  }, [data]);

  const value = useMemo<GatingContextValue | null>(() => {
    if (!data || !gates) return null;
    const cascade = computeCascade(data, gates);
    return {
      data,
      gates,
      cascade,
      metrics: computeMetrics(data, cascade),
      isDefault: gatesEqual(gates, data.defaults),
      setGates,
      resetGates,
    };
  }, [data, gates, resetGates, setGates]);

  return <GatingContext.Provider value={value}>{children}</GatingContext.Provider>;
}
