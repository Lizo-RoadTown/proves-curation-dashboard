/**
 * MissionControlView - Shared Live Awareness Room
 *
 * A read-only, shared, live space for situational awareness across all teams.
 * Not a workspace - a place to watch the system breathe.
 *
 * Layout: 4-pane grid
 * ┌─────────────────────────────────────┬──────────────┐
 * │                                     │  Pipelines   │
 * │   Knowledge Graph + Heat Overlay    │  (5 unis)    │
 * │         (largest pane)              ├──────────────┤
 * │                                     │   Agents     │
 * │                                     │  (6 types)   │
 * └─────────────────────────────────────┴──────────────┘
 *
 * Each panel is its own rendering context:
 * - Graph3D: Knowledge graph with heat overlay
 * - PipelinePanel: 5 university pipelines (3D streams)
 * - AgentAvatarPanel: 6 agent classes (3D motion-encoded)
 *
 * Rules:
 * - No editing, no forms
 * - No personalization (same view for everyone)
 * - Ambient awareness: slow animations, subtle pulses
 * - All data from validated graph only (not tenant staging)
 */

import { useState, useEffect } from "react";
import { Graph3D } from "@/app/components/Graph3D";
import { PipelinePanel } from "./PipelinePanel";
import { AgentAvatarPanel } from "./AgentAvatarPanel";

export function MissionControlView() {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Update timestamp every second
  useEffect(() => {
    const interval = setInterval(() => setLastUpdate(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // These would come from Supabase realtime subscriptions
  // For now, using defaults defined in the panel components

  return (
    <div className="h-full bg-[#0f172a] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#334155]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
            </span>
            <span className="text-sm font-medium text-[#e2e8f0]">MISSION CONTROL</span>
          </div>
          <span className="text-xs text-[#64748b]">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* 4-Pane Grid */}
      <div className="flex-1 grid grid-cols-[1fr_360px] grid-rows-2 gap-1 p-1">
        {/* Knowledge Graph - spans both rows on left */}
        <div className="row-span-2 bg-[#0f172a] rounded-lg overflow-hidden border border-[#334155]">
          <Graph3D
            height={window.innerHeight - 70}
            className="w-full h-full border-0 rounded-none"
            enableHeatOverlay={true}
          />
        </div>

        {/* Pipeline Panel - top right (5 universities) */}
        <div className="bg-[#0f172a] rounded-lg overflow-hidden border border-[#334155]">
          <PipelinePanel pipelines={[]} />
        </div>

        {/* Agent Avatar Panel - bottom right (6 agent classes) */}
        <div className="bg-[#0f172a] rounded-lg overflow-hidden border border-[#334155]">
          <AgentAvatarPanel agents={[]} />
        </div>
      </div>
    </div>
  );
}
