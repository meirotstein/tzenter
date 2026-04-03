import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMinyanById, updateMinyan } from "../datasource/minyansRepository";
import { errorToHttpStatusCode } from "../utils";
import { requireManageSession } from "../manage/auth";
import { parseMinyanUpdateInput } from "../manage/validation";

const manageMinyanDetails = async (req: VercelRequest, res: VercelResponse) => {
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
      return res.status(200).json({
        minyan: {
          id: minyan.id,
          name: minyan.name,
          city: minyan.city,
          latitude: minyan.latitude ?? null,
          longitude: minyan.longitude ?? null,
        },
      });
    }

    if (req.method === "PATCH") {
      const payload = parseMinyanUpdateInput(req.body || {});
      const updatedMinyan = await updateMinyan(minyan.id, payload);
      return res.status(200).json({ minyan: updatedMinyan });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    return res.status(errorToHttpStatusCode(e)).json({ error: e.message });
  }
};

module.exports = manageMinyanDetails;
export default manageMinyanDetails;
