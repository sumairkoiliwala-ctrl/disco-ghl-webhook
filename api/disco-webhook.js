const axios = require('axios');

module.exports = async (req, res) => {
  try {
    console.log("Incoming event:", req.body);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
