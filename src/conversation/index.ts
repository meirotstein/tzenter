import { restartWordHooks } from "./consts";
import { getUserMinyansStep } from "./steps/getUserMinyansStep";
import { initialMenuStep } from "./steps/initialMenuStep";
import { initScheduleStep } from "./steps/initScheduleStep";
import { listAvailableMinyansStep } from "./steps/listAvailableMinyansStep";
import { processScheduleStep } from "./steps/processScheduleStep";
import { registerMinyanStep } from "./steps/registerMinyanStep";
import { selectedMinyanStep } from "./steps/selectedMinyanStep";
import { unregisterMinyanStep } from "./steps/unregisterMinyanStep";
import { Step } from "./types";

const initialStep = initialMenuStep;


const hooks: Record<string, Step> = {};

restartWordHooks.forEach((word) => {
  hooks[word] = initialMenuStep;
});

const steps = {
  [initialMenuStep.id]: initialMenuStep,
  [getUserMinyansStep.id]: getUserMinyansStep,
  [listAvailableMinyansStep.id]: listAvailableMinyansStep,
  [selectedMinyanStep.id]: selectedMinyanStep,
  [registerMinyanStep.id]: registerMinyanStep,
  [unregisterMinyanStep.id]: unregisterMinyanStep,
  [initScheduleStep.id]: initScheduleStep,
  [processScheduleStep.id]: processScheduleStep,
};

export function getStep(stepId: string): Step | undefined {
  return steps[stepId];
}

export function getInitialStep(): Step {
  return initialStep;
}

export function getHookStep(userText: string): Step | undefined {
  return hooks[userText];
}

export function getInitScheduleStep(): Step {
  return initScheduleStep;
}

export function getProcessScheduleStep(): Step {
  return processScheduleStep;
}
