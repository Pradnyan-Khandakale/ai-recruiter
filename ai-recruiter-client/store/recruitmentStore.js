"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export const useRecruitmentStore = create((set) => ({
  jobs: [],
  candidates: [],
  workflows: [],
  analytics: null,
  async refreshDashboard() {
    const [jobs, candidates, workflows, analytics] = await Promise.allSettled([
      api.listJobs(),
      api.listCandidates(),
      api.listWorkflows(),
      api.analytics()
    ]);
    set({
      jobs: Array.isArray(jobs.value) ? jobs.value : [],
      candidates: Array.isArray(candidates.value) ? candidates.value : [],
      workflows: Array.isArray(workflows.value) ? workflows.value : [],
      analytics: analytics.value || null
    });
  }
}));
