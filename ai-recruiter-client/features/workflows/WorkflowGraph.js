"use client";

import { useMemo } from "react";
import { ReactFlow, Background, Controls } from "@xyflow/react";

const fallbackColors = {
  running: "#2563eb",
  success: "#16a34a",
  failed: "#dc2626",
  waiting_approval: "#ca8a04",
  pending: "#64748b"
};

export function WorkflowGraph({ workflow, logs, nodeStates, workflowOrder }) {
  const { nodes, edges } = useMemo(() => {
    // TODO: Build one node per agent in the workflow order, colour it from the latest log
    // TODO: status (falling back to the workflow status and the pending colour), and
    // TODO: connect the nodes in sequence, animating the edge into the current state.
    return { nodes: [], edges: [] };
  }, [workflow, logs, nodeStates, workflowOrder]);

  return (
    <div className="h-[420px] rounded-lg border border-slate-200 bg-white">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
