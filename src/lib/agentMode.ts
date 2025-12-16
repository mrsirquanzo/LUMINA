export type AgentMode = 'demo' | 'live';

const STORAGE_KEY = 'lumina-agent-mode';
const UPDATED_EVENT = 'lumina-agent-mode-updated';
const REQUEST_EVENT = 'lumina-agent-mode-request';

export function getStoredAgentMode(): AgentMode {
  if (typeof window === 'undefined') return 'demo';
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === 'live' ? 'live' : 'demo';
}

export function setStoredAgentMode(mode: AgentMode): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT, { detail: { mode } }));
}

export function requestAgentMode(mode: AgentMode): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(REQUEST_EVENT, { detail: { mode } }));
}

export function onAgentModeUpdated(handler: (mode: AgentMode) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const listener = (event: Event) => {
    const custom = event as CustomEvent<{ mode: AgentMode }>;
    const mode = custom.detail?.mode;
    if (mode === 'demo' || mode === 'live') handler(mode);
  };
  window.addEventListener(UPDATED_EVENT, listener as EventListener);
  return () => window.removeEventListener(UPDATED_EVENT, listener as EventListener);
}

export function onAgentModeRequested(handler: (mode: AgentMode) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const listener = (event: Event) => {
    const custom = event as CustomEvent<{ mode: AgentMode }>;
    const mode = custom.detail?.mode;
    if (mode === 'demo' || mode === 'live') handler(mode);
  };
  window.addEventListener(REQUEST_EVENT, listener as EventListener);
  return () => window.removeEventListener(REQUEST_EVENT, listener as EventListener);
}


