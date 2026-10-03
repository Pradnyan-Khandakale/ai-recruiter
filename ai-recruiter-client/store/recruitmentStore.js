"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export const useRecruitmentStore = create((set) => ({
  jobs: [],
  candidates: [],
  workflows: [],
  analytics: null,
  async refreshDashboard() {
    try {
      const [jobsRes, candidatesRes, workflowsRes, analyticsRes] = await Promise.allSettled([
        api.listJobs(),
        api.listCandidates(),
        api.listWorkflows(),
        api.analytics()
      ]);
      set({
        jobs: jobsRes.status === "fulfilled" && Array.isArray(jobsRes.value) ? jobsRes.value : [],
        candidates: candidatesRes.status === "fulfilled" && Array.isArray(candidatesRes.value) ? candidatesRes.value : [],
        workflows: workflowsRes.status === "fulfilled" && Array.isArray(workflowsRes.value) ? workflowsRes.value : [],
        analytics: analyticsRes.status === "fulfilled" ? analyticsRes.value : null
      });
    } catch {
      set({ jobs: [], candidates: [], workflows: [], analytics: null });
    }
  }
}));
