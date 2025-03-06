import { initialMenuStep } from "./steps/initialMenuStep";

const initialStep = initialMenuStep;

const steps = {
  [initialMenuStep.id]: initialMenuStep,
};

export function getStep(stepId?: string) {
  if (!stepId) {
    return initialStep;
  }
  return steps[stepId];
}
