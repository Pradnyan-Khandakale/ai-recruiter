"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";

export function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // TODO: Load the analytics payload from the API and store the error message on failure.
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Analytics</h1>
        <p className="text-slate-600">Candidate statistics, shortlist rate, completion rate, and agent metrics.</p>
      </div>
      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-slate-500">Candidates</p><p className="text-3xl font-bold">{analytics?.candidate_count || 0}</p></Card>
        <Card><p className="text-sm text-slate-500">Shortlist rate</p><p className="text-3xl font-bold">{analytics?.shortlist_rate || 0}%</p></Card>
        <Card><p className="text-sm text-slate-500">Completion rate</p><p className="text-3xl font-bold">{analytics?.workflow_completion_rate || 0}%</p></Card>
      </div>
      <Card>
        <h2 className="mb-4 text-lg font-bold">Agent execution metrics</h2>
        <div className="space-y-2">
          {(analytics?.agent_execution_metrics || []).map((item) => (
            <div key={item._id} className="flex items-center justify-between border-b border-slate-100 py-2">
              <span className="font-semibold">{item._id}</span>
              <span>{item.executions}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
