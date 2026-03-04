const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const event = req.body;

    const userId = event?.data?.user?.id || null;

    console.log("Incoming Disco event:");
    console.log(JSON.stringify(event, null, 2));

    console.log("Extracted User ID:", userId);

    if (!userId) {
      return res.status(200).json({ success: true, message: "No user ID found" });
    }

    const discoResponse = await axios.get(
      `https://api.disco.co/v1/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.DISCO_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Full Disco User Response:");
    console.log(JSON.stringify(discoResponse.data, null, 2));

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Error:");
    console.error(error.response?.data || error.message);
    return res.status(500).json({ error: "Webhook Error" });
  }
};