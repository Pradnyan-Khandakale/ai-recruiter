"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export const useRecruitmentStore = create((set) => ({
  jobs: [],
  candidates: [],
  workflows: [],
  analytics: null,
  async refreshDashboard() {
    // TODO: Load the jobs, candidates, workflows, and analytics in parallel and store them.
  }
}));
