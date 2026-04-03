import type { NextApiRequest, NextApiResponse } from "next";
import { clearManageSession } from "../../src/manage/auth";

export default async function manageMinyanLogout(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  await clearManageSession(req, res);
  res.setHeader("Location", "/manage-minyan");
  return res.status(302).send("");
}
