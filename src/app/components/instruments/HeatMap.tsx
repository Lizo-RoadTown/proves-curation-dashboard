/**
 * HeatMap - University Activity Heat Map
 *
 * Visual grid showing activity levels per university.
 * Uses REAL DATA from get_all_orgs_activity() RPC.
 *
 * Hover to see detailed stats:
 * - Pending reviews
 * - Approvals today
 * - Rejections today
 * - Last promotion timestamp
 * - Total contributed to shared library
 */

import { useState } from "react";
import { useOrgActivity } from "@/hooks/useMissionControlData";
import { Loader2, AlertCircle, Flame } from "lucide-react";

interface HeatMapProps {
  className?: string;
}

// Short name mapping for universities
const SHORT_NAMES: Record<string, string> = {
  "cal-poly-pomona": "CPP",
  "columbia-university": "CU",
  "northeastern-university": "NEU",
  "uc-santa-cruz": "UCSC",
  "texas-state-university": "TXST",
  "proves-lab": "PROVES",
};

function getShortName(slug: string, name: string): string {
  return SHORT_NAMES[slug] || name.split(" ").map(w => w[0]).join("").toUpperCase();
}

function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return "Never";
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

function calculateHeatLevel(pending: number, approvalsToday: number, rejectionsToday: number): number {
  // Heat based on activity level
  const totalActivity = pending + approvalsToday + rejectionsToday;
  if (totalActivity === 0) return 0.1;
  if (totalActivity < 5) return 0.3;
  if (totalActivity < 10) return 0.5;
  if (totalActivity < 20) return 0.7;
  if (totalActivity < 30) return 0.85;
  return 0.95;
}

function getHeatColor(level: number): string {
  // Cool to hot: blue -> cyan -> green -> yellow -> orange -> red
  if (level < 0.2) return "#1e40af"; // Deep blue (cold)
  if (level < 0.4) return "#0891b2"; // Cyan
  if (level < 0.6) return "#16a34a"; // Green
  if (level < 0.8) return "#eab308"; // Yellow
  if (level < 0.9) return "#f97316"; // Orange
  return "#dc2626"; // Red (hot)
}

export function HeatMap({ className = "" }: HeatMapProps) {
  const { organizations, loading, error } = useOrgActivity();
  const [hoveredOrg, setHoveredOrg] = useState<typeof organizations[0] | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent, org: typeof organizations[0]) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredOrg(org);
  };

  // Loading state
  if (loading && organizations.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-[#64748b]" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center h-full gap-2 ${className}`}>
        <AlertCircle className="w-6 h-6 text-[#ef4444]" />
        <span className="text-xs text-[#64748b]">Failed to load</span>
      </div>
    );
  }

  // Empty state
  if (organizations.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full gap-2 ${className}`}>
        <Flame className="w-6 h-6 text-[#64748b]" />
        <span className="text-xs text-[#64748b]">No organizations</span>
      </div>
    );
  }

  // Calculate grid columns based on org count
  const gridCols = organizations.length <= 3 ? organizations.length :
                   organizations.length <= 6 ? 3 : 4;

  return (
    <div className={`relative h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#334155]">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#f97316]" />
          <span className="text-sm font-medium text-[#e2e8f0]">Activity</span>
        </div>
        <span className="text-xs text-[#64748b]">{organizations.length} teams</span>
      </div>

      {/* Heat Map Grid */}
      <div className="flex-1 p-3">
        <div
          className="grid gap-2 h-full"
          style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
        >
          {organizations.map((org) => {
            const heatLevel = calculateHeatLevel(
              org.pending_reviews,
              org.approvals_today,
              org.rejections_today
            );
            const shortName = getShortName(org.org_slug, org.org_name);

            return (
              <div
                key={org.org_id}
                className="relative flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 min-h-[60px]"
                style={{
                  backgroundColor: org.org_color || getHeatColor(heatLevel),
                  opacity: 0.7 + heatLevel * 0.3,
                }}
                onMouseEnter={(e) => handleMouseMove(e, org)}
                onMouseMove={(e) => handleMouseMove(e, org)}
                onMouseLeave={() => setHoveredOrg(null)}
              >
                {/* University short name */}
                <span className="text-lg font-bold text-white drop-shadow-md">
                  {shortName}
                </span>
                {/* Activity indicator */}
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-white/80">{org.pending_reviews}</span>
                  {heatLevel > 0.7 && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredOrg && (
        <div
          className="absolute z-10 pointer-events-none"
          style={{
            left: Math.min(tooltipPosition.x + 10, 150),
            top: Math.max(tooltipPosition.y - 120, 10),
          }}
        >
          <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 shadow-xl min-w-[200px]">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#334155]">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: hoveredOrg.org_color || "#64748b" }}
              />
              <span className="text-sm font-medium text-[#e2e8f0]">
                {hoveredOrg.org_name}
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Pending reviews</span>
                <span className="text-[#f59e0b] font-medium">
                  {hoveredOrg.pending_reviews}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Approved today</span>
                <span className="text-[#22c55e] font-medium">
                  {hoveredOrg.approvals_today}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Rejected today</span>
                <span className="text-[#ef4444] font-medium">
                  {hoveredOrg.rejections_today}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Last promotion</span>
                <span className="text-[#06b6d4] font-medium">
                  {formatTimeAgo(hoveredOrg.last_promotion)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#334155]">
                <span className="text-[#64748b]">Total contributed</span>
                <span className="text-[#e2e8f0] font-medium">
                  {hoveredOrg.total_contributed}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-1 py-2 border-t border-[#334155]">
        <span className="text-[10px] text-[#64748b]">Quiet</span>
        <div className="flex h-2 rounded overflow-hidden">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((level) => (
            <div
              key={level}
              className="w-4 h-full"
              style={{ backgroundColor: getHeatColor(level) }}
            />
          ))}
        </div>
        <span className="text-[10px] text-[#64748b]">Active</span>
      </div>
    </div>
  );
}
