/**
 * MissionControlView - Shared Live Awareness Room
 *
 * Layout:
 * ┌──────────┬─────────────────────────────────┬──────────┐
 * │ Sources  │                                 │ Sources  │
 * │   IN     │      Knowledge Graph            │   OUT    │
 * │ (pipes)  │                                 │ (pipes)  │
 * ├──────────┴─────────────────────────────────┴──────────┤
 * │             Agents (row of 6 colored orbs)            │
 * └───────────────────────────────────────────────────────┘
 *
 * - Left: Inbound pipelines (5 universities feeding data in)
 * - Center: Knowledge graph (the brain)
 * - Right: Outbound pipelines (data flowing out)
 * - Bottom: 6 agent orbs showing health through motion
 */

import { useState, useEffect } from "react";
import { Graph3D } from "@/app/components/Graph3D";
import { PipelineColumn } from "./PipelineColumn";
import { AgentOrbs } from "./AgentOrbs";

export function MissionControlView() {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLastUpdate(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full bg-[#0f172a] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#334155]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
            </span>
            <span className="text-sm font-medium text-[#e2e8f0]">MISSION CONTROL</span>
          </div>
          <span className="text-xs text-[#64748b]">
            {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Main content: Pipes | Graph | Pipes */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Sources IN */}
        <div className="w-20 border-r border-[#334155] flex flex-col">
          <div className="text-[9px] text-center text-[#64748b] py-1 border-b border-[#334155]">IN</div>
          <PipelineColumn direction="in" />
        </div>

        {/* Center: Knowledge Graph */}
        <div className="flex-1 min-w-0">
          <Graph3D
            height={window.innerHeight - 150}
            className="w-full h-full border-0 rounded-none"
            enableHeatOverlay={false}
          />
        </div>

        {/* Right: Sources OUT */}
        <div className="w-20 border-l border-[#334155] flex flex-col">
          <div className="text-[9px] text-center text-[#64748b] py-1 border-b border-[#334155]">OUT</div>
          <PipelineColumn direction="out" />
        </div>
      </div>

      {/* Bottom: Agent Orbs */}
      <div className="h-24 border-t border-[#334155]">
        <AgentOrbs />
      </div>
    </div>
  );
}
