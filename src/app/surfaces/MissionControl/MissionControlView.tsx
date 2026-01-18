/**
 * MissionControlView - Shared Live Awareness Room
 *
 * A read-only, shared, live space for situational awareness across all teams.
 * Not a workspace - a place to watch the system breathe.
 *
 * Layout: 4-pane grid
 * ┌─────────────────────────────────────┬──────────────┐
 * │                                     │  Pipelines   │
 * │         Knowledge Graph             │  (in/out)    │
 * │         (largest pane)              ├──────────────┤
 * │                                     │    Agent     │
 * │                                     │   Avatar     │
 * └─────────────────────────────────────┴──────────────┘
 *
 * Each panel is its own rendering context - NOT world-positioned in 3D space.
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

  // Mock state - would come from Supabase realtime
  const pipelineState = {
    inbound: { rate: 1.2, latencyMs: 350, status: 'healthy' as const },
    outbound: { rate: 0.8, latencyMs: 420, status: 'healthy' as const },
  };

  const agentState = {
    health: 0.95,
    confidence: 0.88,
    drift: 0.05,
    errorRate: 0.02,
  };

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
      <div className="flex-1 grid grid-cols-[1fr_320px] grid-rows-2 gap-1 p-1">
        {/* Knowledge Graph - spans both rows on left */}
        <div className="row-span-2 bg-[#0f172a] rounded-lg overflow-hidden border border-[#334155]">
          <Graph3D
            height={window.innerHeight - 70}
            className="w-full h-full border-0 rounded-none"
          />
        </div>

        {/* Pipeline Panel - top right */}
        <div className="bg-[#0f172a] rounded-lg overflow-hidden border border-[#334155]">
          <PipelinePanel
            inbound={pipelineState.inbound}
            outbound={pipelineState.outbound}
          />
        </div>

        {/* Agent Avatar Panel - bottom right */}
        <div className="bg-[#0f172a] rounded-lg overflow-hidden border border-[#334155]">
          <AgentAvatarPanel
            health={agentState.health}
            confidence={agentState.confidence}
            drift={agentState.drift}
            errorRate={agentState.errorRate}
          />
        </div>
      </div>
    </div>
  );
}
