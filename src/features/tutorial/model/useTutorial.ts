import { useEffect, useMemo, useState } from 'react';
import type { TutorialContext, TutorialStep } from './types';

interface UseTutorialParams {
  steps: TutorialStep[];
  context: TutorialContext;
}

export const useTutorial = ({ steps, context }: UseTutorialParams) => {
  const [open, setOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [waitingForAction, setWaitingForAction] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);

  const currentStep = steps[currentStepIndex] ?? null;
  const requiresAction = currentStep?.requiresAction !== false;
  const isCurrentStepDone = useMemo(
    () => (currentStep ? currentStep.condition(context) : false),
    [currentStep, context]
  );

  const isLastStep = currentStepIndex === steps.length - 1;
  const canGoNext = true;

  useEffect(() => {
    if (!waitingForAction || !requiresAction || !isCurrentStepDone) return;
    if (isLastStep) {
      setOpen(false);
      setWaitingForAction(false);
      setCompletedOpen(true);
      return;
    }
    setCurrentStepIndex((prev) => prev + 1);
    setOpen(true);
    setWaitingForAction(false);
  }, [waitingForAction, requiresAction, isCurrentStepDone, isLastStep]);

  const next = () => {
    if (!currentStep) return;
    if (!requiresAction) {
      if (isLastStep) {
        setOpen(false);
        setCompletedOpen(true);
      } else {
        setCurrentStepIndex((prev) => prev + 1);
      }
      return;
    }
    setOpen(false);
    setWaitingForAction(true);
  };

  const close = () => {
    setOpen(false);
    setWaitingForAction(false);
  };
  const start = (stepIndex = 0) => {
    const safeStepIndex = Math.max(0, Math.min(stepIndex, steps.length - 1));
    setCurrentStepIndex(safeStepIndex);
    setWaitingForAction(false);
    setCompletedOpen(false);
    setOpen(true);
  };
  const restart = () => {
    setCurrentStepIndex(0);
    setWaitingForAction(false);
    setCompletedOpen(false);
    setOpen(false);
  };

  return {
    open,
    currentStep,
    currentStepIndex,
    totalSteps: steps.length,
    completedOpen,
    isFinish: false,
    canGoNext,
    next,
    start,
    close,
    closeCompleted: () => setCompletedOpen(false),
    restart,
  };
};
