/**
 * MissionControlView - Shared Live Awareness Room
 *
 * Read-only, shared, live space for the entire university.
 * Not a workspace - a place to watch the system.
 *
 * Five live instruments:
 * 1. Knowledge Graph (3D, primary) - verified knowledge accumulation
 * 2. Heat Map - university activity with hover stats
 * 3. Pipeline Flow - extraction pipeline visualization
 * 4. Agent Avatars - robot caretakers with motion-encoded health
 * 5. Validation Stats - human validators' view
 *
 * Rules:
 * - No editing, no forms
 * - No personalization (same view for everyone)
 * - Ambient awareness: slow animations, subtle pulses
 */

import { useState, useEffect } from "react";
import { Database, Users } from "lucide-react";
import { Graph3D } from "@/app/components/Graph3D";
import { HeatMap, PipelineFlow, AgentAvatars } from "@/app/components/instruments";

// =============================================================================
// TYPES
// =============================================================================

interface ValidationStats {
  pendingReviews: number;
  approvalsToday: number;
  rejectionsToday: number;
  avgReviewTime: string;
  lastPromotion: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MissionControlView() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [depthFilter, setDepthFilter] = useState<1 | 2 | 3>(2);
  const [showCandidates, setShowCandidates] = useState(false);

  const [validation] = useState<ValidationStats>({
    pendingReviews: 23,
    approvalsToday: 47,
    rejectionsToday: 8,
    avgReviewTime: "2m 14s",
    lastPromotion: "45s ago",
  });

  // Update timestamp every second
  useEffect(() => {
    const interval = setInterval(() => setLastUpdate(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full bg-[#0f172a] p-4 overflow-hidden">
      {/* Header - Stream Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
            </span>
            <span className="text-sm font-medium text-[#e2e8f0]">LIVE</span>
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

      {/* Main Grid - 3 columns, 2 rows */}
      <div className="grid grid-cols-3 grid-rows-2 gap-4 h-[calc(100%-3rem)]">
        {/* 1. Knowledge Graph (Left column, spans both rows) */}
        <div className="row-span-2 bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#334155]">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#06b6d4]" />
              <span className="text-sm font-medium text-[#e2e8f0]">Knowledge Graph</span>
            </div>
            <span className="text-xs text-[#64748b]">1,247 nodes · 3,891 links</span>
          </div>
          <div className="h-[calc(100%-2.5rem)]">
            <Graph3D />
          </div>
        </div>

        {/* 2. Heat Map (Top middle) */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
          <HeatMap />
        </div>

        {/* 3. Pipeline Flow (Top right) */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
          <PipelineFlow />
        </div>

        {/* 4. Agent Avatars (Bottom middle) */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
          <AgentAvatars />
        </div>

        {/* 5. Validation Stats (Bottom right) */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#334155]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#06b6d4]" />
              <span className="text-sm font-medium text-[#e2e8f0]">Validation</span>
            </div>
            <span className="text-xs text-[#64748b]">Today's stats</span>
          </div>
          <div className="p-4 space-y-3 h-[calc(100%-2.5rem)]">
            {/* Main stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-[#0f172a] rounded-lg text-center">
                <div className="text-2xl font-semibold text-[#f59e0b]">
                  {validation.pendingReviews}
                </div>
                <div className="text-xs text-[#64748b] mt-1">Pending</div>
              </div>
              <div className="p-3 bg-[#0f172a] rounded-lg text-center">
                <div className="text-2xl font-semibold text-[#22c55e]">
                  {validation.approvalsToday}
                </div>
                <div className="text-xs text-[#64748b] mt-1">Approved</div>
              </div>
              <div className="p-3 bg-[#0f172a] rounded-lg text-center">
                <div className="text-2xl font-semibold text-[#ef4444]">
                  {validation.rejectionsToday}
                </div>
                <div className="text-xs text-[#64748b] mt-1">Rejected</div>
              </div>
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#0f172a] rounded-lg flex items-center justify-between">
                <span className="text-xs text-[#64748b]">Avg review time</span>
                <span className="text-sm font-medium text-[#e2e8f0]">{validation.avgReviewTime}</span>
              </div>
              <div className="p-3 bg-[#0f172a] rounded-lg flex items-center justify-between">
                <span className="text-xs text-[#64748b]">Last promotion</span>
                <span className="text-sm font-medium text-[#06b6d4]">{validation.lastPromotion}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="p-3 bg-[#0f172a] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#64748b]">Approval rate</span>
                <span className="text-xs text-[#22c55e]">
                  {Math.round((validation.approvalsToday / (validation.approvalsToday + validation.rejectionsToday)) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-[#334155] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#22c55e] to-[#06b6d4] rounded-full transition-all duration-500"
                  style={{
                    width: `${(validation.approvalsToday / (validation.approvalsToday + validation.rejectionsToday)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
