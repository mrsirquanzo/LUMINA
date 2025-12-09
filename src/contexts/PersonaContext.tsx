import { createContext, useContext, type ReactNode } from 'react';
import type { Persona } from '../types';

interface PersonaContextType {
  activePersona: Persona;
  setActivePersona: (persona: Persona) => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export function PersonaProvider({
  children,
  activePersona,
  setActivePersona,
}: {
  children: ReactNode;
  activePersona: Persona;
  setActivePersona: (persona: Persona) => void;
}) {
  return (
    <PersonaContext.Provider value={{ activePersona, setActivePersona }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
}
