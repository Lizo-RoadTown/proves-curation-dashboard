/**
 * MissionControlView - Shared Live Awareness Room
 *
 * Read-only, shared, live space for the entire university.
 * Not a workspace - a place to watch the system.
 *
 * Four live instruments:
 * 1. Knowledge Graph (3D, primary) - verified knowledge accumulation
 * 2. Extraction Streams - pipes feeding the system
 * 3. Agent Health - robot caretakers' view
 * 4. Validation Throughput - human validators' view
 *
 * Rules:
 * - No editing, no forms
 * - No personalization (same view for everyone)
 * - Ambient awareness: slow animations, subtle pulses
 */

import { useState, useEffect } from "react";
import { Clock, Activity, Users, Database, Radio, ChevronDown } from "lucide-react";
import { Graph3D } from "@/app/components/Graph3D";

// =============================================================================
// TYPES
// =============================================================================

interface StreamStatus {
  name: string;
  type: "github" | "notion" | "discord" | "gdrive";
  itemsInQueue: number;
  lastActivity: string;
  status: "active" | "idle" | "error";
}

interface AgentStatus {
  name: string;
  health: "healthy" | "degraded" | "error";
  trustScore: number;
  lastRun: string;
  itemsProcessed: number;
}

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

  // Simulated live data (will be replaced with real-time hooks)
  const [streams] = useState<StreamStatus[]>([
    { name: "PROVES Docs", type: "github", itemsInQueue: 12, lastActivity: "2s ago", status: "active" },
    { name: "Team Notion", type: "notion", itemsInQueue: 3, lastActivity: "15s ago", status: "active" },
    { name: "Discord Chat", type: "discord", itemsInQueue: 0, lastActivity: "1m ago", status: "idle" },
    { name: "Shared Drive", type: "gdrive", itemsInQueue: 0, lastActivity: "5m ago", status: "idle" },
  ]);

  const [agents] = useState<AgentStatus[]>([
    { name: "Extractor-A", health: "healthy", trustScore: 0.94, lastRun: "3s ago", itemsProcessed: 247 },
    { name: "Extractor-B", health: "healthy", trustScore: 0.91, lastRun: "5s ago", itemsProcessed: 183 },
    { name: "Validator-1", health: "healthy", trustScore: 0.88, lastRun: "2s ago", itemsProcessed: 156 },
  ]);

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

  const getStatusColor = (status: "active" | "idle" | "error" | "healthy" | "degraded") => {
    switch (status) {
      case "active":
      case "healthy":
        return "bg-[#22c55e]";
      case "idle":
        return "bg-[#64748b]";
      case "degraded":
        return "bg-[#f59e0b]";
      case "error":
        return "bg-[#ef4444]";
    }
  };

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

      {/* Main Grid - 2x2 layout */}
      <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[calc(100%-3rem)]">
        {/* 1. Knowledge Graph (Top Left - Primary, largest) */}
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

        {/* 2. Extraction Streams (Top Right) */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#334155]">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#06b6d4]" />
              <span className="text-sm font-medium text-[#e2e8f0]">Extraction Streams</span>
            </div>
            <span className="text-xs text-[#64748b]">
              {streams.reduce((sum, s) => sum + s.itemsInQueue, 0)} in queue
            </span>
          </div>
          <div className="p-3 space-y-2 overflow-y-auto h-[calc(100%-2.5rem)]">
            {streams.map((stream) => (
              <div
                key={stream.name}
                className="flex items-center justify-between p-2 bg-[#0f172a] rounded"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${getStatusColor(stream.status)} ${
                      stream.status === "active" ? "animate-pulse" : ""
                    }`}
                  />
                  <div>
                    <div className="text-sm text-[#e2e8f0]">{stream.name}</div>
                    <div className="text-xs text-[#64748b]">{stream.lastActivity}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#e2e8f0]">{stream.itemsInQueue}</div>
                  <div className="text-xs text-[#64748b]">queued</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Right - Split into Agent Health + Validation */}
        <div className="grid grid-cols-2 gap-4">
          {/* 3. Agent Health */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#334155]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#06b6d4]" />
                <span className="text-sm font-medium text-[#e2e8f0]">Agents</span>
              </div>
            </div>
            <div className="p-2 space-y-1.5 overflow-y-auto h-[calc(100%-2.25rem)]">
              {agents.map((agent) => (
                <div
                  key={agent.name}
                  className="flex items-center justify-between p-2 bg-[#0f172a] rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(agent.health)}`} />
                    <span className="text-xs text-[#e2e8f0]">{agent.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#64748b]">
                      {Math.round(agent.trustScore * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Validation Throughput */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#334155]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#06b6d4]" />
                <span className="text-sm font-medium text-[#e2e8f0]">Validation</span>
              </div>
            </div>
            <div className="p-3 space-y-2 h-[calc(100%-2.25rem)]">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-[#0f172a] rounded text-center">
                  <div className="text-lg font-semibold text-[#e2e8f0]">
                    {validation.pendingReviews}
                  </div>
                  <div className="text-xs text-[#64748b]">pending</div>
                </div>
                <div className="p-2 bg-[#0f172a] rounded text-center">
                  <div className="text-lg font-semibold text-[#22c55e]">
                    {validation.approvalsToday}
                  </div>
                  <div className="text-xs text-[#64748b]">approved</div>
                </div>
              </div>
              <div className="p-2 bg-[#0f172a] rounded flex items-center justify-between">
                <span className="text-xs text-[#64748b]">Last promotion</span>
                <span className="text-xs text-[#e2e8f0]">{validation.lastPromotion}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
