/**
 * Target naming helpers
 *
 * Goal: keep target names consistent across the UI + storage.
 * We intentionally keep this conservative (alias-based) to avoid mangling
 * normal words (e.g. "phase-2") that may appear in search terms.
 */

const TARGET_DISPLAY_ALIASES: Record<string, string> = {
  // TROP2 (TACSTD2)
  'trop2': 'TROP2',
  'trop-2': 'TROP2',
  'trop 2': 'TROP2',
  'tacstd2': 'TROP2',

  // HER2 (ERBB2)
  'her2': 'HER2',
  'her-2': 'HER2',
  'her 2': 'HER2',
  'erbb2': 'HER2',
};

function normalizeAliasKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '');
}

/**
 * Convert a user/system-provided target-ish string into a consistent display name.
 * If the string is not recognized as a known target alias, it is returned unchanged.
 */
export function formatTargetDisplayName(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  const key = normalizeAliasKey(trimmed);
  const direct = TARGET_DISPLAY_ALIASES[key];
  if (direct) return direct;

  // Also allow matching when hyphens/spaces differ.
  const compactKey = key.replace(/[\s-]/g, '');
  const compact = TARGET_DISPLAY_ALIASES[compactKey];
  if (compact) return compact;

  return trimmed;
}

/**
 * Canonical key for comparisons/deduping. Not intended for display.
 */
export function toTargetKey(input: string): string {
  return formatTargetDisplayName(input)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
