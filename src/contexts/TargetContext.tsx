import { createContext, useContext, type ReactNode } from 'react';

export interface TargetData {
  id: string;
  name: string;
  indication?: string;
  dataFreshness?: string;
  // Add more target-specific data as needed
}

interface TargetContextType {
  currentTarget: TargetData | null;
  setCurrentTarget: (target: TargetData | null) => void;
}

const TargetContext = createContext<TargetContextType | undefined>(undefined);

export function TargetProvider({
  children,
  currentTarget,
  setCurrentTarget,
}: {
  children: ReactNode;
  currentTarget: TargetData | null;
  setCurrentTarget: (target: TargetData | null) => void;
}) {
  return (
    <TargetContext.Provider value={{ currentTarget, setCurrentTarget }}>
      {children}
    </TargetContext.Provider>
  );
}

export function useTarget() {
  const context = useContext(TargetContext);
  if (context === undefined) {
    throw new Error('useTarget must be used within a TargetProvider');
  }
  return context;
}
