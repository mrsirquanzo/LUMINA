import { AgentType } from './multiAgentTypes';

// Force deployment - all fixes applied

export interface CustomAgentTeam {
  id: string;
  name: string;
  description: string;
  agents: AgentType[];
  mode: 'fast' | 'thorough';
  isDefault?: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'custom_agent_teams';

// Default/preset teams
export const DEFAULT_TEAMS: CustomAgentTeam[] = [
  {
    id: 'full-diligence',
    name: 'Full Due Diligence',
    description: 'All 6 agents for comprehensive analysis',
    agents: ['clinical', 'patent', 'financial', 'regulatory', 'market_research'],
    mode: 'thorough',
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: 'core-trio',
    name: 'Core Trio',
    description: 'Essential clinical, patent, and financial analysis',
    agents: ['clinical', 'patent', 'financial'],
    mode: 'thorough',
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: 'commercial-focus',
    name: 'Commercial Focus',
    description: 'Market and financial perspective',
    agents: ['market_research', 'financial'],
    mode: 'fast',
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: 'technical-deep-dive',
    name: 'Technical Deep Dive',
    description: 'Clinical and regulatory assessment',
    agents: ['clinical', 'regulatory'],
    mode: 'thorough',
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: 'ip-valuation',
    name: 'IP & Valuation',
    description: 'Patent and financial analysis',
    agents: ['patent', 'financial'],
    mode: 'fast',
    isDefault: true,
    createdAt: Date.now(),
  },
];

/**
 * Get all agent teams (defaults + custom)
 */
export function getAgentTeams(): CustomAgentTeam[] {
  const custom = getCustomTeams();
  return [...DEFAULT_TEAMS, ...custom];
}

/**
 * Get only custom (user-created) teams
 */
export function getCustomTeams(): CustomAgentTeam[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load custom teams:', error);
    return [];
  }
}

/**
 * Save a custom agent team
 */
export function saveCustomTeam(team: Omit<CustomAgentTeam, 'id' | 'createdAt' | 'isDefault'>): CustomAgentTeam {
  try {
    const customTeams = getCustomTeams();

    const newTeam: CustomAgentTeam = {
      ...team,
      id: generateId(),
      createdAt: Date.now(),
      isDefault: false,
    };

    customTeams.push(newTeam);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTeams));

    return newTeam;
  } catch (error) {
    console.error('Failed to save custom team:', error);
    throw error;
  }
}

/**
 * Update an existing custom team
 */
export function updateCustomTeam(id: string, updates: Partial<CustomAgentTeam>): boolean {
  try {
    const customTeams = getCustomTeams();
    const index = customTeams.findIndex(t => t.id === id);

    if (index === -1) return false;

    customTeams[index] = { ...customTeams[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTeams));

    return true;
  } catch (error) {
    console.error('Failed to update custom team:', error);
    return false;
  }
}

/**
 * Delete a custom team
 */
export function deleteCustomTeam(id: string): boolean {
  try {
    const customTeams = getCustomTeams();
    const filtered = customTeams.filter(t => t.id !== id);

    if (filtered.length === customTeams.length) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete custom team:', error);
    return false;
  }
}

/**
 * Get a team by ID
 */
export function getTeamById(id: string): CustomAgentTeam | null {
  const allTeams = getAgentTeams();
  return allTeams.find(t => t.id === id) || null;
}

/**
 * Agent metadata for UI
 */
export const AGENT_INFO: Record<AgentType, { name: string; icon: string; description: string; color: string }> = {
  clinical: {
    name: 'Clinical Analyst',
    icon: '🔬',
    description: 'Trial data, efficacy, safety analysis',
    color: 'blue',
  },
  patent: {
    name: 'Patent Expert',
    icon: '⚖️',
    description: 'IP strength, FTO, patent landscape',
    color: 'purple',
  },
  financial: {
    name: 'Financial Analyst',
    icon: '💰',
    description: 'Valuations, financials, deal structures',
    color: 'green',
  },
  regulatory: {
    name: 'Regulatory Expert',
    icon: '📋',
    description: 'FDA/EMA pathways, compliance, timelines',
    color: 'orange',
  },
  market_research: {
    name: 'Market Research',
    icon: '📊',
    description: 'Market size, pricing, competitive landscape',
    color: 'teal',
  },
  target_biology: {
    name: 'Target Biology Expert',
    icon: '🧬',
    description: 'Genetic validation, druggability, mechanism of action',
    color: 'indigo',
  },
};

/**
 * Validate agent team configuration
 */
export function validateTeam(agents: AgentType[]): { valid: boolean; error?: string } {
  if (agents.length === 0) {
    return { valid: false, error: 'At least one agent must be selected' };
  }

  if (agents.length > 6) {
    return { valid: false, error: 'Maximum 6 agents allowed' };
  }

  const uniqueAgents = new Set(agents);
  if (uniqueAgents.size !== agents.length) {
    return { valid: false, error: 'Duplicate agents detected' };
  }

  return { valid: true };
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
