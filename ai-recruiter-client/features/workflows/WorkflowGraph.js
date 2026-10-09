"use client";

import { useMemo } from "react";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const fallbackColors = {
  running: "#2563eb",
  success: "#16a34a",
  failed: "#dc2626",
  waiting_approval: "#ca8a04",
  pending: "#64748b"
};

const specColors = {
  blue: "#2563eb",
  green: "#16a34a",
  red: "#dc2626",
  yellow: "#ca8a04"
};

export function WorkflowGraph({ workflow, logs, nodeStates, workflowOrder }) {
  const { nodes, edges } = useMemo(() => {
    const steps =
      Array.isArray(workflowOrder) && workflowOrder.length > 0
        ? workflowOrder
        : [
            "resume_parser",
            "embedding_agent",
            "matching_agent",
            "shortlisting_agent",
            "human_approval",
            "interview_agent",
            "email_agent"
          ];

    // Find the latest log status for each agent
    const latestLogMap = {};
    for (const log of logs || []) {
      latestLogMap[log.agent_name] = log;
    }

    const stateColor = (status) => {
      if (nodeStates && nodeStates[status]) {
        const colorName = nodeStates[status];
        return specColors[colorName] || colorName;
      }
      return fallbackColors[status] || fallbackColors.pending;
    };

    const newNodes = steps.map((step, idx) => {
      const log = latestLogMap[step];
      let status = "pending";

      if (log) {
        status = log.status;
      } else if (workflow?.current_state === step) {
        status =
          workflow.status === "waiting_approval"
            ? "waiting_approval"
            : workflow.status || "running";
      }

      const color = stateColor(status);
      const isCheckpoint = step === "human_approval";

      const label = step
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      return {
        id: step,
        data: {
          label: (
            <div className="text-center">
              <div className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1">
                {label}
                {isCheckpoint && (
                  <span className="text-[10px] text-amber-600" title="Approval Checkpoint">
                    ★
                  </span>
                )}
              </div>
              <div
                className="mt-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: color }}
              >
                {status.replace("_", " ")}
              </div>
              {log?.retry_count > 0 && (
                <div className="mt-1 text-[10px] font-medium text-red-600">
                  Retries: {log.retry_count}
                </div>
              )}
            </div>
          )
        },
        position: { x: idx * 170 + 20, y: 160 },
        style: {
          border: `2px solid ${color}`,
          borderRadius: 8,
          backgroundColor: "#ffffff",
          width: 140,
          padding: "8px 4px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.06)"
        }
      };
    });

    const newEdges = [];
    for (let i = 0; i < steps.length - 1; i++) {
      const source = steps[i];
      const target = steps[i + 1];
      const isTargetActive = workflow?.current_state === target && workflow?.status === "running";
      newEdges.push({
        id: `e-${source}-${target}`,
        source,
        target,
        animated: isTargetActive,
        style: {
          stroke: isTargetActive ? "#2563eb" : "#cbd5e1",
          strokeWidth: 2
        }
      });
    }

    return { nodes: newNodes, edges: newEdges };
  }, [workflow, logs, nodeStates, workflowOrder]);

  return (
    <div className="h-[360px] w-full rounded-lg border border-slate-200 bg-slate-50/50">
      <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.5} maxZoom={1.5}>
        <Background gap={16} size={1} color="#e2e8f0" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
