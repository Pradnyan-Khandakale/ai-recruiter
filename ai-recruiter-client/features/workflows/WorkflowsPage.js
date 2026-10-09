"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, RotateCcw, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkflowGraph } from "./WorkflowGraph";

export function WorkflowsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    try {
      setActionLoading((prev) => ({ ...prev, [id]: "approving" }));
      await api.approveWorkflow(id, true);
      await load();
    } catch (err) {
      alert(err?.message || "Failed to approve workflow");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  }

  async function retry(id) {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: "retrying" }));
      await api.retryWorkflow(id);
      await load();
    } catch (err) {
      alert(err?.message || "Failed to retry workflow");
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
          <h1 className="text-3xl font-bold text-slate-950">Workflow monitoring</h1>
          <p className="text-slate-600">
            Execution order, node state, retry logs, and approval checkpoints.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin mr-1.5" : "mr-1.5"} />
          Refresh
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {loading && items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          Loading workflows...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          No candidate workflows active or completed yet. When candidates apply, their workflows will appear here.
        </div>
      ) : (
        <div className="space-y-5">
          {items.map(({ workflow, logs, workflow_order, node_states }) => (
            <Card key={workflow._id} className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {workflow.candidate_id?.name || "Candidate workflow"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {workflow.job_id?.title || "Job"} · Step:{" "}
                    <span className="font-semibold text-slate-700">
                      {workflow.current_state}
                    </span>
                  </p>
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
                  >
                    {workflow.status}
                  </Badge>
                  {workflow.status === "waiting_approval" && (
                    <Button
                      size="sm"
                      onClick={() => approve(workflow._id)}
                      disabled={actionLoading[workflow._id] === "approving"}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <CheckCircle2 size={15} className="mr-1.5" />
                      Approve candidate
                    </Button>
                  )}
                  {workflow.status === "failed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => retry(workflow._id)}
                      disabled={actionLoading[workflow._id] === "retrying"}
                    >
                      <RotateCcw size={15} className="mr-1.5" />
                      Retry workflow
                    </Button>
                  )}
                </div>
              </div>

              <WorkflowGraph
                workflow={workflow}
                logs={logs}
                workflowOrder={workflow_order}
                nodeStates={node_states}
              />

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Recent Step Execution Logs
                </h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {(logs || []).slice(-6).map((log) => (
                    <div
                      key={log._id || `${log.agent_name}-${log.status}`}
                      className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{log.agent_name}</span>
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
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
