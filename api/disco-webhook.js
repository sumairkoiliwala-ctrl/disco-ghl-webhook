module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const cleanPayload = buildCleanPayload(body);

    // send to GHL
    if (!process.env.GHL_WEBHOOK_URL) {
      return res.status(500).json({ error: "Missing GHL_WEBHOOK_URL" });
    }

    await fetch(process.env.GHL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanPayload)
    });

    return res.status(200).json({ success: true, data: cleanPayload });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: true, message: error.message });
  }
};

function buildCleanPayload(body) {
  const user = body?.data?.user || {};
  const profileFields = body?.data?.user_profile_fields || [];

  const normalizedFields = normalizeProfileFields(profileFields);

  // These are the fields you always want present (even if empty)
  const defaults = {
    short_bio: "",
    local_timezone: "",
    community_support: "",
    primary_industry: "",
    secondary_industry: "",
    position: "",
    location: ""
  };

  // Force a single workflow route if you want
  // event_group is used only for GHL filtering
  const event = body?.event || "";
  const event_group =
    event === "community.user_onboarding_completed" ||
    event === "community.user_updated_profile"
      ? "profile"
      : "other";

  return {
    event,
    event_group,
    event_id: body?.event_id || "",

    user_id: user?.id || "",
    email: user?.email || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    role: user?.role || "",
    status: user?.status || "",
    joined_at: user?.joined_at || "",

    ...defaults,
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

  // single select -> string
  if (type === "single_select") {
    if (typeof value === "string" && value.trim()) return value.trim();

    if (selectedOptions.length > 0) {
      const label = options.find((o) => o.id === selectedOptions[0])?.label;
      return label || "";
    }
    return "";
  }

  // multi select -> comma-separated string
  if (type === "multiple_select") {
    if (typeof value === "string" && value.trim()) return value.trim();

    const labels = selectedOptions
      .map((id) => options.find((o) => o.id === id)?.label)
      .filter(Boolean);

    return labels.join(", ");
  }

  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value).trim();
}

function toSnakeCase(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}