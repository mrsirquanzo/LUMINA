import type { FigureSpec } from '../../../shared/figures.js';

/**
 * Where a tool hands a figure to the run it is executing inside.
 *
 * Tools are called by the engine deep inside `produceBriefing`, with no handle
 * on the run or its event stream. Rather than thread a context argument through
 * the engine's tool interface (which lives in sonny-core and is not ours to
 * change), the worker installs a sink here before starting the run.
 *
 * A module-level singleton is safe because one worker thread serves exactly one
 * run; the module graph is not shared across runs.
 */
type FigureSink = (figure: FigureSpec) => void;

let sink: FigureSink | null = null;

export function setFigureSink(fn: FigureSink | null): void {
  sink = fn;
}

/**
 * Publish a figure to the active run. A no-op when no run is listening, so
 * tools stay callable from tests and one-off scripts.
 *
 * Never throws: a figure is an enrichment of the trail, and must not be able to
 * fail the tool call that produced the underlying evidence.
 */
export function emitFigure(figure: FigureSpec): void {
  if (!sink) return;
  try {
    sink(figure);
  } catch {
    // Swallowed by design - see above.
  }
}
