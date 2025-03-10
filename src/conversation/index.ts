import { getUserMinyansStep } from "./steps/getUserMinyansStep";
import { initialMenuStep } from "./steps/initialMenuStep";
import { listAvailableMinyansStep } from "./steps/listAvailableMinyansStep";
import { Step } from "./types";

const initialStep = initialMenuStep;

const restartWordHooks = ["צענטר", "תפריט"];

const hooks: Record<string, Step> = {};

restartWordHooks.forEach((word) => {
  hooks[word] = initialMenuStep;
});

const steps = {
  [initialMenuStep.id]: initialMenuStep,
  [getUserMinyansStep.id]: getUserMinyansStep,
  [listAvailableMinyansStep.id]: listAvailableMinyansStep,
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
