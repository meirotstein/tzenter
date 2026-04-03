import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMinyanById } from "../datasource/minyansRepository";
import {
  addSchedule,
  deleteSchedule,
  getScheduleById,
  getSchedulesByMinyanId,
  updateSchedule,
} from "../datasource/scheduleRepository";
import { errorToHttpStatusCode } from "../utils";
import { requireManageSession } from "../manage/auth";
import { parseScheduleInput } from "../manage/validation";

function parseScheduleId(value: string | string[] | undefined) {
  if (!value || Array.isArray(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

const manageMinyanSchedules = async (
  req: VercelRequest,
  res: VercelResponse
) => {
  try {
    const session = await requireManageSession(req);
    const minyan = await getMinyanById(session.activeMinyanId);

    if (
      !minyan ||
      !session.minyanIdsAdminOf.includes(minyan.id) ||
      !minyan.admins?.some((admin) => admin.id === session.userId)
    ) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
      const schedules = await getSchedulesByMinyanId(minyan.id);
      return res.status(200).json({ schedules });
    }

    if (req.method === "POST") {
      const payload = parseScheduleInput(req.body || {}, minyan, {
        requireAllFields: true,
      });
      const schedule = await addSchedule({
        ...payload,
        minyan,
      });
      return res.status(201).json({ schedule });
    }

    const scheduleId = parseScheduleId(req.query.id);
    if (!scheduleId) {
      return res.status(400).json({ error: "Missing schedule id" });
    }

    const schedule = await getScheduleById(scheduleId);
    if (!schedule || schedule.minyan.id !== minyan.id) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    if (req.method === "PATCH") {
      const payload = parseScheduleInput(req.body || {}, minyan, {
        requireAllFields: false,
      });
      const updatedSchedule = await updateSchedule(schedule.id, payload);
      return res.status(200).json({ schedule: updatedSchedule });
    }

    if (req.method === "DELETE") {
      await deleteSchedule(schedule.id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    return res.status(errorToHttpStatusCode(e)).json({ error: e.message });
  }
};

module.exports = manageMinyanSchedules;
export default manageMinyanSchedules;
