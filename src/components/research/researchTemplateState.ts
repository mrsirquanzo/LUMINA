export function resolveRunTarget(prompt: string, runTarget?: string): string {
  return runTarget ?? prompt.trim();
}

export function shouldClearRunTarget(nextPrompt: string, seededPrompt?: string): boolean {
  return seededPrompt !== undefined && nextPrompt !== seededPrompt;
}
