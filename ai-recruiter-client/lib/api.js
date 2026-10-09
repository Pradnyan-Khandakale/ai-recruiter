const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("recruitment_token") || document.cookie.match(/recruitment_token=([^;]+)/)?.[1] || "";
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
  const headers = {};
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  });

  let payload = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok || (payload && payload.success === false)) {
    const message = payload?.error?.message || `Request failed with status ${response.status}`;
    const details = payload?.error?.details || null;
    throw new ApiError(message, response.status, details);
  }

  return payload ? payload.data : null;
}

export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/auth/me"),
  createJob: (payload) => request("/jobs", { method: "POST", body: JSON.stringify(payload) }),
  listJobs: (params) => request(params?.public ? "/jobs?public=true" : "/jobs"),
  getJob: (id) => request(`/jobs/${id}`),
  updateJob: (id, payload) => request(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteJob: (id) => request(`/jobs/${id}`, { method: "DELETE" }),
  archiveJob: (id) => request(`/jobs/${id}`, { method: "DELETE" }),
  listCandidates: (params) => {
    const jobId = params?.job_id || params?.jobId;
    return request(jobId ? `/candidates?job_id=${jobId}` : "/candidates");
  },
  getCandidate: (id) => request(`/candidates/${id}`),
  uploadCandidate: (formData) => request("/candidates/upload", { method: "POST", body: formData }),
  listJobApplications: (id) => request(`/jobs/${id}/applications`),
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
