import { WATextMessage } from "../handlers/types";
import {
  approveScheduleHookPayloadRegex,
  approveScheduleHookWord,
  initScheduleUpdateHookWord,
  rejectScheduleHookPayloadRegex,
  rejectScheduleHookWord,
  restartWordHooks,
  snoozeScheduleHookPayloadRegex,
  snoozeScheduleHookWord,
} from "./consts";
import { approveScheduleStep } from "./steps/approveScheduleStep";
import { dadJokeStep } from "./steps/dadJokeStep";
import { getUserMinyansStep } from "./steps/getUserMinyansStep";
import { initialMenuStep } from "./steps/initialMenuStep";
import { initScheduleStep } from "./steps/initScheduleStep";
import { initUpdateMinyanScheduleStep } from "./steps/initUpdateMinyanScheduleStep";
import { listAvailableMinyansStep } from "./steps/listAvailableMinyansStep";
import { processScheduleStep } from "./steps/processScheduleStep";
import { registerMinyanStep } from "./steps/registerMinyanStep";
import { rejectScheduleStep } from "./steps/rejectScheduleStep";
import { selectedMinyanStep } from "./steps/selectedMinyanStep";
import { sendScheduleStatusStep } from "./steps/sendScheduleStatusStep";
import { snoozeScheduleStep } from "./steps/snoozeScheduleStep";
import { unregisterMinyanStep } from "./steps/unregisterMinyanStep";
import { updateAdditionalMinyanAttendeesStep } from "./steps/updateAdditionalMinyanAttendeesStep";
import { updateScheduleAttendeesStep } from "./steps/updateScheduleAttendeesStep";
import { Step } from "./types";

const initialStep = initialMenuStep;

const hookWords: Record<string, Step> = {
  [initScheduleUpdateHookWord]: initUpdateMinyanScheduleStep,
};

const hookPayloadRegexes: Array<{ regex: RegExp; step: Step }> = [
  {
    regex: approveScheduleHookPayloadRegex,
    step: approveScheduleStep,
  },
  {
    regex: snoozeScheduleHookPayloadRegex,
    step: snoozeScheduleStep,
  },
  {
    regex: rejectScheduleHookPayloadRegex,
    step: rejectScheduleStep,
  },
];

restartWordHooks.forEach((word) => {
  hookWords[word] = initialMenuStep;
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
  [approveScheduleStep.id]: approveScheduleStep,
  [rejectScheduleStep.id]: rejectScheduleStep,
  [snoozeScheduleStep.id]: snoozeScheduleStep,
  [updateAdditionalMinyanAttendeesStep.id]: updateAdditionalMinyanAttendeesStep,
  [dadJokeStep.id]: dadJokeStep,
  [initUpdateMinyanScheduleStep.id]: initUpdateMinyanScheduleStep,
  [sendScheduleStatusStep.id]: sendScheduleStatusStep,
  [updateScheduleAttendeesStep.id]: updateScheduleAttendeesStep,
};

export function getStep(stepId: string): Step | undefined {
  return steps[stepId];
}

export function getInitialStep(): Step {
  return initialStep;
}

export function getHookStep(userMessage: WATextMessage): Step | undefined {
  if (userMessage.payload) {
    const hookPayloadStep = hookPayloadRegexes.find((hook) =>
      hook.regex.test(userMessage.payload!)
    );
    if (hookPayloadStep) {
      return hookPayloadStep.step;
    }
  }
  return hookWords[userMessage.message!];
}

export function getInitScheduleStep(): Step {
  return initScheduleStep;
}

export function getProcessScheduleStep(): Step {
  return processScheduleStep;
}
