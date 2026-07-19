export function resolveRunTarget(prompt: string, runTarget?: string): string {
  return runTarget ?? prompt.trim();
}

export function shouldClearRunTarget(nextPrompt: string, seededPrompt?: string): boolean {
  return seededPrompt !== undefined && nextPrompt !== seededPrompt;
}

export const TARGET_PLACEHOLDER = '[target]';

export function hasUnresolvedTargetPlaceholder(prompt: string): boolean {
  return prompt.includes(TARGET_PLACEHOLDER);
}
