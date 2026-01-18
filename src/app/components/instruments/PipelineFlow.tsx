/**
 * PipelineFlow - Extraction Pipeline Visualization
 *
 * Shows the flow of data through the extraction pipeline:
 * Sources → Extraction → Validation → Promotion → Library
 *
 * Uses REAL DATA from get_pipeline_stats() RPC.
 * Animated particles flow through the pipes to show activity.
 * Stage colors indicate health/throughput.
 */

import { useState, useEffect } from "react";
import { Github, FileText, Cpu, Users, CheckCircle, Database, Loader2, AlertCircle, GitBranch } from "lucide-react";
import { usePipelineStats } from "@/hooks/useMissionControlData";

interface PipelineFlowProps {
  className?: string;
}

// Stage metadata (icons, colors) - counts come from real data
const STAGE_META: Record<string, {
  name: string;
  icon: React.ReactNode;
}> = {
  sources: {
    name: "Sources",
    icon: <div className="flex gap-0.5"><Github className="w-3 h-3" /><FileText className="w-3 h-3" /></div>,
  },
  extraction: {
    name: "Extract",
    icon: <Cpu className="w-4 h-4" />,
  },
  validation: {
    name: "Validate",
    icon: <Users className="w-4 h-4" />,
  },
  promotion: {
    name: "Promote",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  library: {
    name: "Library",
    icon: <Database className="w-4 h-4" />,
  },
};

// Stage order for rendering
const STAGE_ORDER = ["sources", "extraction", "validation", "promotion", "library"];

function getStatusFromActivity(count: number, itemsThisHour: number): "healthy" | "degraded" | "blocked" {
  // If items are flowing this hour, it's healthy
  if (itemsThisHour > 0) return "healthy";
  // If there's a queue but no flow, it's degraded
  if (count > 10) return "degraded";
  // Otherwise healthy (could be idle)
  return "healthy";
}

function getStatusColor(status: "healthy" | "degraded" | "blocked"): string {
  switch (status) {
    case "healthy": return "#22c55e";
    case "degraded": return "#f59e0b";
    case "blocked": return "#ef4444";
  }
}

function getStatusBg(status: "healthy" | "degraded" | "blocked"): string {
  switch (status) {
    case "healthy": return "bg-[#22c55e]/10 border-[#22c55e]/30";
    case "degraded": return "bg-[#f59e0b]/10 border-[#f59e0b]/30";
    case "blocked": return "bg-[#ef4444]/10 border-[#ef4444]/30";
  }
}

// Animated particle component
function Particle({ delay, duration }: { delay: number; duration: number }) {
  return (
    <div
      className="absolute w-1.5 h-1.5 rounded-full bg-[#06b6d4] opacity-80"
      style={{
        animation: `flowParticle ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

export function PipelineFlow({ className = "" }: PipelineFlowProps) {
  const { stages: rawStages, loading, error } = usePipelineStats();
  const [particles, setParticles] = useState<{ id: number; delay: number; duration: number }[]>([]);

  // Generate particles on mount
  useEffect(() => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      delay: i * 0.5,
      duration: 4,
    }));
    setParticles(newParticles);
  }, []);

  // Transform raw stages into ordered array with metadata
  const stages = STAGE_ORDER.map(stageId => {
    const rawStage = rawStages.find(s => s.stage === stageId);
    const meta = STAGE_META[stageId];
    const count = rawStage?.count || 0;
    const itemsThisHour = rawStage?.items_this_hour || 0;

    return {
      id: stageId,
      name: meta?.name || stageId,
      icon: meta?.icon || <GitBranch className="w-4 h-4" />,
      count,
      itemsToday: rawStage?.items_today || 0,
      itemsThisHour,
      status: getStatusFromActivity(count, itemsThisHour),
    };
  });

  // Loading state
  if (loading && rawStages.length === 0) {
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

  return (
    <div className={`relative h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#334155]">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#06b6d4]" />
          <span className="text-sm font-medium text-[#e2e8f0]">Pipeline</span>
        </div>
        <span className="text-xs text-[#64748b]">
          {stages.reduce((sum, s) => sum + s.itemsThisHour, 0)}/hr
        </span>
      </div>

      {/* CSS for particle animation */}
      <style>{`
        @keyframes flowParticle {
          0% { left: 0%; opacity: 0; }
          5% { opacity: 0.8; }
          95% { opacity: 0.8; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 4px currentColor; }
          50% { box-shadow: 0 0 12px currentColor; }
        }
      `}</style>

      {/* Pipeline stages */}
      <div className="flex-1 flex items-center justify-between px-3 py-2">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center flex-1">
            {/* Stage node */}
            <div className="flex flex-col items-center">
              <div
                className={`relative w-10 h-10 rounded-lg border flex items-center justify-center ${getStatusBg(stage.status)}`}
                style={{ color: getStatusColor(stage.status) }}
              >
                {stage.icon}
                {/* Queue count badge */}
                {stage.count > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#06b6d4] text-[#0f172a] text-[10px] font-bold flex items-center justify-center">
                    {stage.count > 99 ? "99+" : stage.count}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-[#94a3b8] mt-1">{stage.name}</span>
              <span className="text-[9px] text-[#64748b]">
                {stage.itemsThisHour}/hr
              </span>
            </div>

            {/* Connector pipe with flowing particles */}
            {index < stages.length - 1 && (
              <div className="flex-1 h-1 mx-1 relative overflow-hidden">
                {/* Pipe background */}
                <div className="absolute inset-0 bg-[#334155] rounded-full" />
                {/* Pipe fill based on activity */}
                <div
                  className="absolute inset-y-0 left-0 bg-[#06b6d4]/30 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(100, (stage.itemsThisHour / 10) * 100)}%`,
                  }}
                />
                {/* Animated particles - only show if there's flow */}
                {stage.itemsThisHour > 0 && (
                  <div className="absolute inset-0">
                    {particles.slice(0, Math.min(particles.length, Math.ceil(stage.itemsThisHour / 2))).map((p) => (
                      <Particle key={p.id} delay={p.delay + index * 0.3} duration={p.duration} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 py-2 border-t border-[#334155]">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
          <span className="text-[10px] text-[#64748b]">Flowing</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
          <span className="text-[10px] text-[#64748b]">Queued</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
          <span className="text-[10px] text-[#64748b]">Blocked</span>
        </div>
      </div>
    </div>
  );
}
