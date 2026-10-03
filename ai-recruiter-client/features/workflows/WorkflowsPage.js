"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkflowGraph } from "./WorkflowGraph";

export function WorkflowsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    // TODO: Load every workflow with its logs and clear or set the error message.
  }

  async function approve(id) {
    // TODO: Approve the workflow checkpoint and reload the list.
  }

  async function retry(id) {
    // TODO: Retry the failed workflow and reload the list.
  }

  useEffect(() => {
    // TODO: Load the workflow list once when the page mounts.
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Workflow monitoring</h1>
        <p className="text-slate-600">Execution order, node state, retry logs, and approval checkpoints.</p>
      </div>
      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <div className="space-y-5">
        {items.map(({ workflow, logs, workflow_order, node_states }) => (
          <Card key={workflow._id} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{workflow.candidate_id?.name || "Candidate workflow"}</h2>
                <p className="text-sm text-slate-500">{workflow.job_id?.title || "Job"} · {workflow.current_state}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{workflow.status}</Badge>
                {workflow.status === "waiting_approval" && <Button onClick={() => approve(workflow._id)}><CheckCircle2 size={18} />Approve</Button>}
                {workflow.status === "failed" && <Button variant="outline" onClick={() => retry(workflow._id)}><RotateCcw size={18} />Retry</Button>}
              </div>
            </div>
            <WorkflowGraph workflow={workflow} logs={logs} workflowOrder={workflow_order} nodeStates={node_states} />
            <div className="grid gap-2 md:grid-cols-2">
              {(logs || []).slice(-6).map((log) => (
                <div key={log._id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <p className="font-bold">{log.agent_name}</p>
                  <p className="text-slate-500">{log.status} · retry {log.retry_count}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
