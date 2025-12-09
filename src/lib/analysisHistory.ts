// Analysis History Management using localStorage

export interface AnalysisRecord {
  id: string;
  timestamp: number;
  query: string;
  mode: 'fast' | 'thorough';
  agents: string[];
  synthesis: string;
  cost: number;
  isDemo: boolean;
}

const STORAGE_KEY = 'multi_agent_analysis_history';
const MAX_HISTORY_ITEMS = 50; // Keep last 50 analyses

/**
 * Save an analysis to history
 */
export function saveAnalysisToHistory(record: Omit<AnalysisRecord, 'id' | 'timestamp'>): void {
  try {
    const history = getAnalysisHistory();

    const newRecord: AnalysisRecord = {
      ...record,
      id: generateId(),
      timestamp: Date.now(),
    };

    // Add to beginning of array
    history.unshift(newRecord);

    // Keep only MAX_HISTORY_ITEMS most recent
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Failed to save analysis to history:', error);
  }
}

/**
 * Get all analysis history
 */
export function getAnalysisHistory(): AnalysisRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load analysis history:', error);
    return [];
  }
}

/**
 * Get a single analysis by ID
 */
export function getAnalysisById(id: string): AnalysisRecord | null {
  const history = getAnalysisHistory();
  return history.find(record => record.id === id) || null;
}

/**
 * Delete an analysis from history
 */
export function deleteAnalysis(id: string): void {
  try {
    const history = getAnalysisHistory();
    const filtered = history.filter(record => record.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete analysis:', error);
  }
}

/**
 * Clear all history
 */
export function clearAnalysisHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear analysis history:', error);
  }
}

/**
 * Export history as JSON
 */
export function exportHistoryAsJSON(): string {
  const history = getAnalysisHistory();
  return JSON.stringify(history, null, 2);
}

/**
 * Import history from JSON
 */
export function importHistoryFromJSON(json: string): boolean {
  try {
    const imported = JSON.parse(json);
    if (!Array.isArray(imported)) {
      throw new Error('Invalid format: expected array');
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
    return true;
  } catch (error) {
    console.error('Failed to import history:', error);
    return false;
  }
}

/**
 * Get history statistics
 */
export function getHistoryStats() {
  const history = getAnalysisHistory();

  return {
    totalAnalyses: history.length,
    totalCost: history.reduce((sum, record) => sum + record.cost, 0),
    demoCount: history.filter(r => r.isDemo).length,
    liveCount: history.filter(r => !r.isDemo).length,
    fastModeCount: history.filter(r => r.mode === 'fast').length,
    thoroughModeCount: history.filter(r => r.mode === 'thorough').length,
    oldestTimestamp: history.length > 0 ? Math.min(...history.map(r => r.timestamp)) : null,
    newestTimestamp: history.length > 0 ? Math.max(...history.map(r => r.timestamp)) : null,
  };
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
