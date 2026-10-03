function normalizeRole(role) {
  const normalized = String(role || "").toLowerCase().trim();
  if (normalized === "admin") {
    return "admin";
  }
  return "recruiter";
}

module.exports = { normalizeRole };
