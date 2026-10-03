function normalizeRole(role) {
  // TODO: Map any stored role onto the supported "admin" or "recruiter" values.
  return "recruiter";
}

module.exports = { normalizeRole };
