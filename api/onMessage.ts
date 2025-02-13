module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  console.log(req.body);
  
  res.json({ status: "Message received" });
};