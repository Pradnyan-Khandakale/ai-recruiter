function normalizeRole(role) {
  return String(role || "").toLowerCase().trim() === "admin" ? "admin" : "recruiter";
}

module.exports = { normalizeRole };
