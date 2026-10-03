"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { useRecruitmentStore } from "@/store/recruitmentStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Overview() {
  const { jobs, candidates, workflows, analytics, refreshDashboard } = useRecruitmentStore();
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      await refreshDashboard();
    } catch (err) {
      setError(err?.message || "Failed to load dashboard metrics");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Recruiter dashboard</h1>
          <p className="text-slate-600">Create jobs, monitor AI workflows, and approve checkpoints.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RefreshCw size={18} />Refresh</Button>
          <Link className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800" href="/dashboard/jobs/create"><Plus size={18} />Create job</Link>
        </div>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm text-slate-500">Jobs</p><p className="text-3xl font-bold">{jobs.length}</p></Card>
        <Card><p className="text-sm text-slate-500">Candidates</p><p className="text-3xl font-bold">{candidates.length}</p></Card>
        <Card><p className="text-sm text-slate-500">Workflows</p><p className="text-3xl font-bold">{workflows.length}</p></Card>
        <Card><p className="text-sm text-slate-500">Completion</p><p className="text-3xl font-bold">{analytics?.workflow_completion_rate || 0}%</p></Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-bold">Recent workflows</h2>
        <div className="space-y-3">
          {workflows.slice(0, 5).map(({ workflow }) => (
            <div key={workflow._id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="font-semibold">{workflow.candidate_id?.name || "Candidate"}</p>
                <p className="text-sm text-slate-500">{workflow.current_state}</p>
              </div>
              <Badge>{workflow.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
