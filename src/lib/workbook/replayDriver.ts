import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WorkbookRun } from './types';

export type WorkbookPhase = 'reasoning' | 'assumptions' | 'awaiting-input' | 'running' | 'done';
export type PlanStepStatus = 'pending' | 'running' | 'done';

export interface RuntimePlanStep {
  id: string;
  title: string;
  figures: string[];
  interactive?: boolean;
  status: PlanStepStatus;
}

export const REPLAY_TIMINGS = {
  reasoningInitialDelay: 220,
  reasoningStagger: 620,
  assumptionsDelay: 460,
  inputDelay: 620,
  stepDurations: [780, 920, 840, 1040, 880, 960, 820, 900],
} as const;

function getReducedMotionPreference() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useWorkbookReplay(run: WorkbookRun) {
  const [phase, setPhase] = useState<WorkbookPhase>('reasoning');
  const [visibleReasoningCount, setVisibleReasoningCount] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<PlanStepStatus[]>(() =>
    run.plan.steps.map(() => 'pending'),
  );
  const [replayKey, setReplayKey] = useState(0);
  const reducedMotion = useRef(getReducedMotionPreference());

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      reducedMotion.current = media.matches;
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (phase !== 'reasoning') return;

    if (reducedMotion.current) {
      const timer = window.setTimeout(() => {
        setVisibleReasoningCount(run.reasoning.length);
        setPhase('assumptions');
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const timers: number[] = [];
    run.reasoning.forEach((_, index) => {
      timers.push(window.setTimeout(
        () => setVisibleReasoningCount(index + 1),
        REPLAY_TIMINGS.reasoningInitialDelay + index * REPLAY_TIMINGS.reasoningStagger,
      ));
    });
    timers.push(window.setTimeout(
      () => setPhase('assumptions'),
      REPLAY_TIMINGS.reasoningInitialDelay + run.reasoning.length * REPLAY_TIMINGS.reasoningStagger + REPLAY_TIMINGS.assumptionsDelay,
    ));

    return () => timers.forEach(window.clearTimeout);
  }, [phase, replayKey, run.reasoning]);

  useEffect(() => {
    if (phase !== 'assumptions') return;
    if (reducedMotion.current) {
      const timer = window.setTimeout(() => setPhase('awaiting-input'), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setPhase('awaiting-input'), REPLAY_TIMINGS.inputDelay);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'running') return;

    if (reducedMotion.current) {
      const timer = window.setTimeout(() => {
        setStepStatuses(run.plan.steps.map(() => 'done'));
        setPhase('done');
      }, 0);
      return () => window.clearTimeout(timer);
    }

    let active = true;
    let timer: number | undefined;
    let stepIndex = 0;

    const runStep = () => {
      if (!active) return;
      const activeStepIndex = stepIndex;
      setStepStatuses((statuses) => statuses.map((status, index) => (
        index === activeStepIndex ? 'running' : status
      )));

      const duration = REPLAY_TIMINGS.stepDurations[activeStepIndex % REPLAY_TIMINGS.stepDurations.length];
      timer = window.setTimeout(() => {
        if (!active) return;
        setStepStatuses((statuses) => statuses.map((status, index) => (
          index === activeStepIndex ? 'done' : status
        )));
        stepIndex = activeStepIndex + 1;
        if (stepIndex >= run.plan.steps.length) {
          setPhase('done');
          return;
        }
        runStep();
      }, duration);
    };

    runStep();
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [phase, replayKey, run.plan.steps]);

  const accept = useCallback(() => {
    setPhase((currentPhase) => currentPhase === 'awaiting-input' ? 'running' : currentPhase);
  }, []);

  const reset = useCallback(() => {
    setPhase('reasoning');
    setVisibleReasoningCount(0);
    setStepStatuses(run.plan.steps.map(() => 'pending'));
    setReplayKey((key) => key + 1);
  }, [run.plan.steps]);

  const steps = useMemo<RuntimePlanStep[]>(() => run.plan.steps.map((step, index) => ({
    ...step,
    status: stepStatuses[index] ?? 'pending',
  })), [run.plan.steps, stepStatuses]);

  const current = stepStatuses.filter((status) => status === 'done').length;

  return {
    phase,
    visibleReasoning: run.reasoning.slice(0, visibleReasoningCount),
    steps,
    current,
    total: run.plan.total,
    accept,
    reset,
    replayKey,
  };
}
