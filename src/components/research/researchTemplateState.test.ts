import { describe, expect, it } from 'vitest';
import { resolveRunTarget, shouldClearRunTarget } from './researchTemplateState';

describe('template run target state', () => {
  it.each([
    ['TROP2', 'Run a full due-diligence dossier on TROP2'],
    ['CDCP1', 'Map the competitive landscape for CDCP1'],
    ['TACSTD2', 'Analyze TACSTD2 (TROP2) as a target'],
  ])('submits canonical target %s while the template prompt is unchanged', (target, prompt) => {
    expect(resolveRunTarget(prompt, target)).toBe(target);
  });

  it('submits edited text after the seeded prompt changes', () => {
    const seededPrompt = 'Run a full due-diligence dossier on TROP2';
    const editedPrompt = 'Compare TROP2 expression across ovarian cancer subtypes';

    expect(shouldClearRunTarget(editedPrompt, seededPrompt)).toBe(true);
    expect(resolveRunTarget(editedPrompt)).toBe(editedPrompt);
  });

  it('keeps the canonical target when the seeded prompt is unchanged', () => {
    const prompt = 'Map the competitive landscape for CDCP1';

    expect(shouldClearRunTarget(prompt, prompt)).toBe(false);
    expect(resolveRunTarget(prompt, 'CDCP1')).toBe('CDCP1');
  });
});
