import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMinyanById } from "../datasource/minyansRepository";
import { getSchedulesByMinyanId } from "../datasource/scheduleRepository";
import { errorToHttpStatusCode } from "../utils";
import {
  clearManageSession,
  exchangeManageMinyanTokenForSession,
  getManageSession,
  setManageSessionCookie,
} from "../manage/auth";
import {
  renderExpiredManageMinyanPage,
  renderManageMinyanPage,
} from "../manage/html";

const MANAGE_MINYAN_PATH = "/manage-minyan";

const manageMinyan = async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (req.method === "POST" && req.query.action === "logout") {
      await clearManageSession(req, res);
      res.setHeader("Location", MANAGE_MINYAN_PATH);
      return res.status(302).send("");
    }

    if (req.method !== "GET") {
      return res.status(405).send("Method not allowed");
    }

    const token = typeof req.query.t === "string" ? req.query.t : undefined;
    if (token) {
      const sessionId = await exchangeManageMinyanTokenForSession(token);
      if (!sessionId) {
        return res.status(401).send(renderExpiredManageMinyanPage());
      }

      setManageSessionCookie(res, sessionId);
      res.setHeader("Location", MANAGE_MINYAN_PATH);
      return res.status(302).send("");
    }

    const session = await getManageSession(req);
    if (!session) {
      return res.status(401).send(renderExpiredManageMinyanPage());
    }

    const minyan = await getMinyanById(session.activeMinyanId);
    if (!minyan) {
      return res.status(404).send(renderExpiredManageMinyanPage());
    }

    if (
      !session.minyanIdsAdminOf.includes(session.activeMinyanId) ||
      !minyan.admins?.some((admin) => admin.id === session.userId)
    ) {
      return res.status(401).send(renderExpiredManageMinyanPage());
    }

    const schedules = await getSchedulesByMinyanId(minyan.id);
    return res.status(200).send(
      renderManageMinyanPage({
        minyan,
        schedules,
        displayName: session.displayName,
      })
    );
  } catch (e: any) {
    return res.status(errorToHttpStatusCode(e)).send(e.message);
  }
};

module.exports = manageMinyan;
export default manageMinyan;
