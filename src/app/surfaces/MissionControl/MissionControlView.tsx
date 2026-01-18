/**
 * MissionControlView - Shared Live Awareness Room
 *
 * A read-only, shared, live space for situational awareness across all teams.
 * Not a workspace - a place to watch the system breathe.
 *
 * The Knowledge Graph dominates the view (full-width), with Mission Control
 * instruments layered directly into the 3D scene:
 *
 * - PipelineStreams: Animated particles flowing along curves (inbound/outbound)
 * - AgentAvatar: Single 3D object encoding health/confidence/drift/error via motion
 * - HeatVolume: Point sprites showing validation activity around nodes
 *
 * Rules:
 * - No editing, no forms
 * - No personalization (same view for everyone)
 * - Ambient awareness: slow animations, subtle pulses
 * - All data from validated graph only (not tenant staging)
 */

import { useState, useEffect } from "react";
import { Graph3D } from "@/app/components/Graph3D";

export function MissionControlView() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [depthFilter, setDepthFilter] = useState<1 | 2 | 3>(2);
  const [showCandidates, setShowCandidates] = useState(false);

  // Update timestamp every second
  useEffect(() => {
    const interval = setInterval(() => setLastUpdate(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full bg-[#0f172a] overflow-hidden flex flex-col">
      {/* Header - Stream Status */}
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

        {/* Graph density controls */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[#94a3b8]">
            <input
              type="checkbox"
              checked={!showCandidates}
              onChange={(e) => setShowCandidates(!e.target.checked)}
              className="rounded border-[#334155] bg-[#1e293b] text-[#06b6d4] focus:ring-[#06b6d4]"
            />
            Verified only
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748b]">Depth:</span>
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                onClick={() => setDepthFilter(d as 1 | 2 | 3)}
                className={`w-6 h-6 text-xs rounded ${
                  depthFilter === d
                    ? "bg-[#06b6d4] text-[#0f172a] font-semibold"
                    : "bg-[#1e293b] text-[#64748b] hover:bg-[#334155]"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Full-width Knowledge Graph with Mission Control instruments */}
      <div className="flex-1 relative">
        <Graph3D
          height={window.innerHeight - 60}
          className="w-full h-full border-0 rounded-none"
          enableMissionControl={true}
        />

        {/* Legend overlay - minimal, non-intrusive */}
        <div className="absolute bottom-4 right-4 bg-[#0f172a]/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-[#334155]">
          <div className="flex items-center gap-4 text-[10px] text-[#64748b]">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#06b6d4]"></span>
              <span>Inbound</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span>
              <span>Outbound</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span>
              <span>Agent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
