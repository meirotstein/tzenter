import { WhatsappClient } from "../../clients/WhatsappClient";
import { getAllMinyans, getMinyanById } from "../../datasource/minyansRepository";
import { getUserByPhone } from "../../datasource/usersRepository";
import { Context } from "../context";
import { Step } from "../types";

export const selectedMinyanStep: Step = {
  id: "selectedMinyanStep",
  action: async (
    userNum: number,
    waClient: WhatsappClient,
    userText: string,
    context: Context
  ) => {
    const selectedMinyanId = (await context.getUserContext())?.context?.selectedMinyanId;
    if (!selectedMinyanId) {
      throw new Error("selectedMinyan is not defined in context");
    }
    const user = await getUserByPhone(userNum.toString());
    if (!user) {
      throw new Error("user is not defined");
    }
    const minyan = await getMinyanById(selectedMinyanId);
    if (!minyan) {
      throw new Error("minyan is not defined");
    }

    const isUserRegistered = !!user?.minyans?.find(
      (userMinyan) => userMinyan.id === selectedMinyanId
    );

    let responseText = `בחרת במניין ${minyan.name}\n\n`;

    responseText += isUserRegistered ? 
      "אתה כבר רשום למניין זה, האם אתה מעוניין להסיר את ההרשמה?" :
      "האם אתה רוצה להירשם למניין זה?";
    await waClient.sendTextMessage(userNum, responseText);
    await context.updateUserContext({ context: { isUserRegistered } });  
  },
  getNextStepId: (userText: string, context: Context) => Promise.resolve(undefined),
};
