"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, RotateCcw, RefreshCw, AlertCircle, Sparkles, Clock, Mail, Phone, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkflowGraph } from "./WorkflowGraph";

export function WorkflowsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionFeedback, setActionFeedback] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await api.listWorkflows();
      if (res?.data?.items && Array.isArray(res.data.items)) {
        setItems(res.data.items);
      } else if (res?.data?.workflows && Array.isArray(res.data.workflows)) {
        const order = res.data.execution_order || [];
        const states = res.data.node_states || {};
        setItems(
          res.data.workflows.map((w) => ({
            workflow: w,
            logs: [],
            workflow_order: order,
            node_states: states
          }))
        );
      } else {
        setItems([]);
      }
    } catch (err) {
      setError(err?.message || "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  }, []);

  async function approve(id) {
    if (actionLoading[id]) return;
    try {
      setActionFeedback(null);
      setActionLoading((prev) => ({ ...prev, [id]: "approving" }));
      const res = await api.approveWorkflow(id, true);
      if (res?.success) {
        setActionFeedback({
          type: "success",
          message: "Candidate approved! Resuming interview planning and notification pipeline."
        });
      }
      await load();
    } catch (err) {
      setActionFeedback({
        type: "error",
        message: err?.message || "Failed to approve candidate workflow."
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  }

  async function retry(id) {
    if (actionLoading[id]) return;
    try {
      setActionFeedback(null);
      setActionLoading((prev) => ({ ...prev, [id]: "retrying" }));
      const res = await api.retryWorkflow(id);
      if (res?.success) {
        setActionFeedback({
          type: "success",
          message: "Workflow retry initiated! Re-evaluating failed steps."
        });
      }
      await load();
    } catch (err) {
      setActionFeedback({
        type: "error",
        message: err?.message || "Failed to retry workflow."
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Workflow Monitoring</h1>
          <p className="text-sm text-slate-600">
            Real-time execution status, interactive React Flow telemetry, and human-in-the-loop approval checkpoints.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} aria-label="Refresh workflow list">
          <RefreshCw size={14} className={loading ? "animate-spin mr-1.5" : "mr-1.5"} />
          Refresh
        </Button>
      </div>

      {actionFeedback && (
        <div
          className={`flex items-center justify-between rounded-md p-3.5 text-sm font-medium ${
            actionFeedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
          role="status"
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600" />
            ) : (
              <AlertCircle size={16} className="text-red-600" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs underline hover:no-underline opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">
          <RefreshCw size={24} className="mx-auto mb-3 animate-spin text-slate-400" />
          <p className="text-sm font-medium">Loading workflows...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">
          <FileText size={32} className="mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-800">No active or completed workflows</h3>
          <p className="mt-1 text-sm text-slate-500">
            When candidates submit applications for your published jobs, their automated AI pipeline will execute and display here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map(({ workflow, logs, workflow_order, node_states }) => {
            const candidate = workflow.candidate_id || {};
            const job = workflow.job_id || {};
            const matchScore = workflow.state?.matching?.match_score ?? candidate.match_score;
            const shortlisting = workflow.state?.shortlisting;
            const isEligibleForApproval = workflow.status === "waiting_approval";
            const isEligibleForRetry = workflow.status === "failed";

            return (
              <Card key={workflow._id} className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-slate-900">
                        {candidate.name || "Candidate workflow"}
                      </h2>
                      {typeof matchScore === "number" && matchScore > 0 && (
                        <Badge
                          variant={matchScore >= 80 ? "success" : matchScore >= 60 ? "warning" : "destructive"}
                          className="font-mono text-xs"
                        >
                          <Sparkles size={11} className="mr-1" />
                          Match: {matchScore}%
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Position: <strong className="text-slate-800">{job.title || "Job Position"}</strong></span>
                      {candidate.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={12} />
                          {candidate.email}
                        </span>
                      )}
                      {candidate.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} />
                          {candidate.phone}
                        </span>
                      )}
                      {workflow.created_at && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(workflow.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        workflow.status === "completed"
                          ? "success"
                          : workflow.status === "failed"
                          ? "destructive"
                          : workflow.status === "waiting_approval"
                          ? "warning"
                          : "default"
                      }
                      className="uppercase text-[11px]"
                    >
                      {workflow.status.replace("_", " ")}
                    </Badge>

                    {isEligibleForApproval && (
                      <Button
                        size="sm"
                        onClick={() => approve(workflow._id)}
                        disabled={actionLoading[workflow._id] === "approving"}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                        aria-label="Approve candidate for next stage"
                      >
                        <CheckCircle2 size={15} className="mr-1.5" />
                        {actionLoading[workflow._id] === "approving" ? "Approving..." : "Approve candidate"}
                      </Button>
                    )}

                    {isEligibleForRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retry(workflow._id)}
                        disabled={actionLoading[workflow._id] === "retrying"}
                        aria-label="Retry failed workflow step"
                      >
                        <RotateCcw size={15} className="mr-1.5" />
                        {actionLoading[workflow._id] === "retrying" ? "Retrying..." : "Retry workflow"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Workflow Graph Visualization */}
                <WorkflowGraph
                  workflow={workflow}
                  logs={logs}
                  workflowOrder={workflow_order}
                  nodeStates={node_states}
                />

                {/* Execution Logs */}
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Step Execution Logs & Telemetry
                  </h3>
                  {(!logs || logs.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No log entries available.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {logs.slice(-6).map((log) => (
                        <div
                          key={log._id || `${log.agent_name}-${log.status}-${log.retry_count}`}
                          className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between font-semibold text-slate-800">
                            <span>{log.agent_name.replace("_", " ")}</span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-bold ${
                                log.status === "success"
                                  ? "bg-green-100 text-green-800"
                                  : log.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : log.status === "waiting_approval"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {log.status}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-500">
                            Retries: {log.retry_count || 0}
                            {log.error ? ` · Error: ${log.error}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
