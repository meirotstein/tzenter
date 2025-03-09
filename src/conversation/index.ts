import exp from "constants";
import { initialMenuStep } from "./steps/initialMenuStep";
import { Step } from "./types";

const initialStep = initialMenuStep;

const restartWordHooks = ["צענטר", "תפריט"];

const hooks: Record<string, Step> = {};

restartWordHooks.forEach((word) => {
  hooks[word] = initialMenuStep;
});

const steps = {
  [initialMenuStep.id]: initialMenuStep,
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
