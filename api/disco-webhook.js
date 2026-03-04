module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const cleanPayload = buildCleanPayload(body);

    console.log("Clean Disco payload:");
    console.log(JSON.stringify(cleanPayload, null, 2));

    let ghlResult = {
      sent: false,
      status: null,
      response: null
    };

    if (process.env.GHL_WEBHOOK_URL) {
      try {
        const ghlResponse = await fetch(process.env.GHL_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(cleanPayload)
        });

        const responseText = await ghlResponse.text();

        ghlResult = {
          sent: true,
          status: ghlResponse.status,
          response: responseText
        };

        console.log("GHL webhook response:");
        console.log(
          JSON.stringify(
            {
              status: ghlResponse.status,
              body: responseText
            },
            null,
            2
          )
        );
      } catch (ghlError) {
        console.error("GHL webhook send error:", ghlError.message);

        ghlResult = {
          sent: false,
          status: null,
          response: ghlError.message
        };
      }
    } else {
      console.log("GHL_WEBHOOK_URL is not set, skipping GHL forward.");
    }

    return res.status(200).json({
      success: true,
      forwarded_to_ghl: ghlResult.sent,
      ghl_status: ghlResult.status,
      ghl_response: ghlResult.response,
      data: cleanPayload
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({
      error: "Webhook processing failed",
      message: error.message
    });
  }
};

function buildCleanPayload(body) {
  const user = body?.data?.user || {};
  const profileFields = body?.data?.user_profile_fields || [];

  const normalizedFields = normalizeProfileFields(profileFields);

  return {
    event: body?.event || "",
    event_id: body?.event_id || "",
    user_id: user?.id || "",
    email: user?.email || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    role: user?.role || "",
    status: user?.status || "",
    joined_at: user?.joined_at || "",
    ...normalizedFields
  };
}

function normalizeProfileFields(fields) {
  const output = {};

  for (const field of fields) {
    const key = toSnakeCase(field?.title || "unknown_field");
    output[key] = getCleanFieldValue(field);
  }

  return output;
}

function getCleanFieldValue(field) {
  const type = field?.type;
  const value = field?.value;
  const options = Array.isArray(field?.options) ? field.options : [];
  const selectedOptions = Array.isArray(field?.selected_options)
    ? field.selected_options
    : [];

  if (type === "single_select") {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (selectedOptions.length > 0) {
      const labels = selectedOptions
        .map((id) => options.find((opt) => opt.id === id)?.label)
        .filter(Boolean);

      return labels[0] || "";
    }

    return "";
  }

  if (type === "multiple_select") {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (selectedOptions.length > 0) {
      const labels = selectedOptions
        .map((id) => options.find((opt) => opt.id === id)?.label)
        .filter(Boolean);

      return labels.join(", ");
    }

    return "";
  }

  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value).trim();
}

function toSnakeCase(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}