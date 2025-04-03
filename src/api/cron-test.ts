import type { VercelRequest, VercelResponse } from "@vercel/node";

module.exports = async (req: VercelRequest, res: VercelResponse) => {
  console.log("cron test started");
  return res.status(200).send({ status: "ok" });
};
