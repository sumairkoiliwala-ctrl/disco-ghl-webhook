module.exports = async function handler(req, res) {
  try {
    const payload = req.body || {};

    const user = payload?.data?.user || {};
    const fields = payload?.data?.user_profile_fields || [];

    const getFieldValue = (title) => {
      const field = fields.find(
        (f) => (f.title || "").toLowerCase() === title.toLowerCase()
      );

      if (!field) return null;

      if (Array.isArray(field.selected_options) && field.options?.length) {
        const labels = field.options
          .filter((opt) => field.selected_options.includes(opt.id))
          .map((opt) => opt.label);

        if (labels.length) return labels;
      }

      return field.value ?? null;
    };

    const responseData = {
      event: payload.event || null,
      event_id: payload.event_id || null,

      user_id: user.id || null,
      email: user.email || null,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      role: user.role || null,
      status: user.status || null,
      joined_at: user.joined_at || null,

      primary_industry: getFieldValue("Primary Industry"),
      secondary_industry: getFieldValue("Secondary Industry"),
      position: getFieldValue("Position"),
      location: getFieldValue("Location"),
      community_support: getFieldValue("Community Support"),
      short_bio: getFieldValue("Short Bio"),
      local_timezone: getFieldValue("Local Timezone")
    };

    console.log("Flattened JSON for GHL:");
    console.log(JSON.stringify(responseData, null, 2));

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({
      error: true,
      message: error.message
    });
  }
};