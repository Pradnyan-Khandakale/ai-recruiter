"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart3,
  Briefcase,
  Users,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [includeArchived, setIncludeArchived] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (selectedJob) params.job_id = selectedJob;
      if (!includeArchived) params.include_archived = "false";

      const res = await api.analytics(params);
      if (res?.success && res.data) {
        setAnalytics(res.data);
      } else if (res?.data) {
        setAnalytics(res.data);
      } else {
        setAnalytics(null);
      }
    } catch (err) {
      setError(err?.message || "Failed to load recruiter analytics");
    } finally {
      setLoading(false);
    }
  }, [selectedJob, includeArchived]);

  useEffect(() => {
    async function loadJobsList() {
      try {
        const res = await api.listJobs();
        const items = res?.data?.jobs || res?.data || [];
        if (Array.isArray(items)) setJobs(items);
      } catch {
        // Soft fail on filter options
      }
    }
    loadJobsList();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const appStatus = analytics?.applications?.by_status || {
    applied: 0,
    reviewed: 0,
    shortlisted: 0,
    rejected: 0
  };

  const wfStatus = analytics?.workflows?.by_status || {
    pending: 0,
    running: 0,
    waiting_approval: 0,
    completed: 0,
    failed: 0
  };

  const totalApps = analytics?.applications?.total_applications || 0;
  const shortlistRate = analytics?.shortlist_rate ?? 0;
  const completionRate = analytics?.workflow_completion_rate ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Recruiter Analytics</h1>
          <p className="text-sm text-slate-600">
            Real-time pipeline metrics, conversion rates, and autonomous AI agent execution telemetry.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
            aria-label="Filter by job"
          >
            <option value="">All Jobs</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title} {j.status === "archived" ? "(Archived)" : ""}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded border-slate-300 text-blue-600"
            />
            Include Archived
          </label>

          <Button variant="outline" size="sm" onClick={loadAnalytics} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin mr-1.5" : "mr-1.5"} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            Retry
          </Button>
        </div>
      )}

      {loading && !analytics ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">
          <RefreshCw size={24} className="mx-auto mb-3 animate-spin text-slate-400" />
          <p className="text-sm font-medium">Aggregating recruiter analytics from database...</p>
        </div>
      ) : !analytics || (analytics.jobs?.total_jobs === 0 && totalApps === 0) ? (
        <Card className="p-12 text-center text-slate-500">
          <BarChart3 size={32} className="mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-800">No recruitment data recorded yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Create and publish jobs to begin tracking application funnels, candidate shortlists, and agent metrics.
          </p>
        </Card>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Jobs Managed</span>
                <Briefcase size={18} className="text-blue-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {analytics.jobs?.total_jobs || 0}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="text-emerald-700 font-semibold">{analytics.jobs?.published_jobs || 0} published</span>
                <span>·</span>
                <span>{analytics.jobs?.archived_jobs || 0} archived</span>
              </div>
            </Card>

            <Card className="space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Applications</span>
                <Users size={18} className="text-indigo-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{totalApps}</div>
              <div className="text-xs text-slate-500">
                Across {analytics.candidates?.total_candidates || 0} unique candidate profiles
              </div>
            </Card>

            <Card className="space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Shortlist Rate</span>
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-800">{shortlistRate}%</div>
              <div className="text-xs text-slate-500">
                {appStatus.shortlisted || 0} of {totalApps} applicants passed AI threshold
              </div>
            </Card>

            <Card className="space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Workflow Completion</span>
                <Cpu size={18} className="text-purple-500" />
              </div>
              <div className="text-3xl font-extrabold text-purple-800">{completionRate}%</div>
              <div className="text-xs text-slate-500">
                {wfStatus.completed || 0} completed · {wfStatus.waiting_approval || 0} awaiting approval
              </div>
            </Card>
          </div>

          {/* Funnel & Workflow Distributions */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Application Funnel */}
            <Card className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">Application Status Distribution</h2>
              <div className="space-y-3">
                {[
                  { label: "Applied (Pending Review)", count: appStatus.applied || 0, color: "bg-blue-500" },
                  { label: "Reviewed", count: appStatus.reviewed || 0, color: "bg-indigo-500" },
                  { label: "Shortlisted", count: appStatus.shortlisted || 0, color: "bg-emerald-500" },
                  { label: "Rejected", count: appStatus.rejected || 0, color: "bg-rose-500" }
                ].map((item) => {
                  const pct = totalApps > 0 ? Math.round((item.count / totalApps) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                        <span>{item.label}</span>
                        <span>
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Workflow States */}
            <Card className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">Workflow Execution Status</h2>
              <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase text-slate-500">Completed</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-800">{wfStatus.completed || 0}</div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase text-slate-500">Waiting Approval</div>
                  <div className="mt-1 text-2xl font-bold text-amber-800">{wfStatus.waiting_approval || 0}</div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase text-slate-500">Running</div>
                  <div className="mt-1 text-2xl font-bold text-blue-800">{wfStatus.running || 0}</div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase text-slate-500">Failed</div>
                  <div className="mt-1 text-2xl font-bold text-rose-800">{wfStatus.failed || 0}</div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase text-slate-500">Pending</div>
                  <div className="mt-1 text-2xl font-bold text-slate-600">{wfStatus.pending || 0}</div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase text-slate-500">Total</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">
                    {analytics.workflows?.total_workflows || 0}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Applications by Job */}
          {Array.isArray(analytics.applications?.by_job) && analytics.applications.by_job.length > 0 && (
            <Card className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">Applications by Job</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Job Title</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Total Apps</th>
                      <th className="py-2.5 px-3 text-right">Shortlisted</th>
                      <th className="py-2.5 px-3 text-right">Rejected</th>
                      <th className="py-2.5 px-3 text-right">Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {analytics.applications.by_job.map((row) => (
                      <tr key={row.job_id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{row.title}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant={row.job_status === "published" ? "success" : "default"}>
                            {row.job_status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">{row.total_applications}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-800 font-semibold">{row.shortlisted}</td>
                        <td className="py-2.5 px-3 text-right text-rose-800 font-semibold">{row.rejected}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">{row.pending}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* AI Agent Execution Telemetry */}
          <Card className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">AI Agent Execution Metrics</h2>
            {analytics.agent_execution_metrics?.length === 0 ? (
              <p className="text-xs text-slate-500">No agent telemetry logged yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {analytics.agent_execution_metrics.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {item._id.replace("_", " ")}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="text-emerald-700 font-medium">✓ {item.success_count || 0} passed</span>
                        {item.failed_count > 0 && (
                          <span className="text-rose-700 font-medium">✗ {item.failed_count} failed</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-slate-900">{item.executions}</div>
                      <div className="text-[10px] text-slate-500 uppercase">runs</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
