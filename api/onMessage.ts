const verifyToken = process.env.VERIFY_TOKEN;

module.exports = async (req, res) => {
  if (req.method === "GET") {
    // verification request
    console.log("verification request", req.query);
    if (
      req.query["hub.mode"] !== "subscribe" ||
      req.query["hub.verify_token"] !== process.env.VERIFY_TOKEN
    ) {
      return res.status(403).send("Validation Error");
    }
    return req.query["hub.challenge"]
      ? res.status(200).send(req.query["hub.challenge"])
      : res.status(400).send("Error");
  }

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  console.log(req.body);

  res.json({ status: "Message received" });
};
