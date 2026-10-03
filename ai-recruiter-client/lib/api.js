const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken() {
  // TODO: Read the saved token from localStorage or the recruitment_token cookie.
  return "";
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  // TODO: Attach the JSON content type (except for FormData) and the bearer token, call
  // TODO: `${API_URL}${path}`, throw an ApiError when the response or payload reports a
  // TODO: failure, and return payload.data.
  return null;
}

export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/auth/me"),
  createJob: (payload) => request("/jobs", { method: "POST", body: JSON.stringify(payload) }),
  listJobs: () => request("/jobs"),
  getJob: (id) => request(`/jobs/${id}`),
  listCandidates: () => request("/candidates"),
  uploadCandidate: (formData) => request("/candidates/upload", { method: "POST", body: formData }),
  listWorkflows: () => request("/workflow"),
  approveWorkflow: (workflow_id, approved) => request("/workflow/approve", {
    method: "POST",
    body: JSON.stringify({ workflow_id, approved })
  }),
  retryWorkflow: (workflow_id) => request("/workflow/retry", {
    method: "POST",
    body: JSON.stringify({ workflow_id })
  }),
  analytics: () => request("/analytics")
};
