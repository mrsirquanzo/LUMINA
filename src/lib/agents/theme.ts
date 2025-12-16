import type { AgentType } from '../multiAgentTypes';

export type AgentThemeKey = AgentType | 'sonny' | 'synthesis';

export interface AgentTheme {
  key: AgentThemeKey;
  /** Background gradient for card overlays */
  gradient: string;
  /** Subtle border tint */
  border: string;
  /** Accent color for headings/icons */
  accentText: string;
  /** Accent color for small pill badges */
  badgeBg: string;
  badgeText: string;
  /** Accent gradient for progress bars / highlights */
  accentGradient: string;
}

const THEMES: Record<AgentThemeKey, AgentTheme> = {
  sonny: {
    key: 'sonny',
    gradient: 'from-purple-500/25 via-blue-500/15 to-cyan-500/20',
    border: 'border-purple-500/20',
    accentText: 'text-purple-300',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-200',
    accentGradient: 'from-purple-500 via-blue-500 to-cyan-400',
  },
  target_biology: {
    key: 'target_biology',
    gradient: 'from-emerald-500/20 via-emerald-400/10 to-cyan-500/15',
    border: 'border-emerald-500/20',
    accentText: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-200',
    accentGradient: 'from-emerald-500 to-cyan-400',
  },
  clinical: {
    key: 'clinical',
    gradient: 'from-blue-500/20 via-indigo-500/10 to-cyan-500/15',
    border: 'border-blue-500/20',
    accentText: 'text-blue-300',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-200',
    accentGradient: 'from-blue-500 to-cyan-400',
  },
  patent: {
    key: 'patent',
    gradient: 'from-purple-500/20 via-fuchsia-500/10 to-indigo-500/15',
    border: 'border-purple-500/20',
    accentText: 'text-purple-300',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-200',
    accentGradient: 'from-purple-500 to-fuchsia-400',
  },
  financial: {
    key: 'financial',
    gradient: 'from-green-500/20 via-emerald-500/10 to-teal-500/15',
    border: 'border-green-500/18',
    accentText: 'text-green-300',
    badgeBg: 'bg-green-500/15',
    badgeText: 'text-green-200',
    accentGradient: 'from-green-500 to-emerald-400',
  },
  regulatory: {
    key: 'regulatory',
    gradient: 'from-orange-500/20 via-amber-500/10 to-yellow-500/15',
    border: 'border-orange-500/18',
    accentText: 'text-orange-300',
    badgeBg: 'bg-orange-500/15',
    badgeText: 'text-orange-200',
    accentGradient: 'from-orange-500 to-yellow-400',
  },
  market_research: {
    key: 'market_research',
    gradient: 'from-teal-500/20 via-cyan-500/10 to-blue-500/15',
    border: 'border-teal-500/18',
    accentText: 'text-teal-300',
    badgeBg: 'bg-teal-500/15',
    badgeText: 'text-teal-200',
    accentGradient: 'from-teal-500 to-cyan-400',
  },
  synthesis: {
    key: 'synthesis',
    gradient: 'from-violet-500/20 via-blue-500/10 to-cyan-500/15',
    border: 'border-violet-500/18',
    accentText: 'text-violet-300',
    badgeBg: 'bg-violet-500/15',
    badgeText: 'text-violet-200',
    accentGradient: 'from-violet-500 to-cyan-400',
  },
};

export function getAgentTheme(key: AgentThemeKey): AgentTheme {
  return THEMES[key] ?? THEMES.sonny;
}

export function resolveAgentThemeKey(agentLabel: string): AgentThemeKey {
  const label = agentLabel.toLowerCase();
  if (label.includes('synthesis')) return 'synthesis';
  if (label.includes('target') || label.includes('biology')) return 'target_biology';
  if (label.includes('clinical') || label.includes('data')) return 'clinical';
  if (label.includes('patent')) return 'patent';
  if (label.includes('financial')) return 'financial';
  if (label.includes('regulatory')) return 'regulatory';
  if (label.includes('market')) return 'market_research';
  return 'sonny';
}

export function getAgentThemeFromLabel(agentLabel: string): AgentTheme {
  return getAgentTheme(resolveAgentThemeKey(agentLabel));
}


