/**
 * AgentAvatars - Agent Health Visualization
 *
 * Shows 5-6 agent types as animated avatars.
 * Motion encodes health status:
 * - Healthy: Smooth, rhythmic pulse
 * - Degraded: Irregular, slower movement
 * - Error: Shaking/vibrating, red glow
 *
 * Agent Types:
 * 1. Crawler - Fetches from sources (spider icon)
 * 2. Extractor - Extracts entities (pickaxe/gem icon)
 * 3. Validator - AI validation (brain/shield icon)
 * 4. Reviewer - Human review queue (eye icon)
 * 5. Promoter - Promotes to library (rocket icon)
 * 6. Indexer - Updates search index (search icon)
 */

import { useState, useEffect } from "react";
import { Bug, Gem, Brain, Eye, Rocket, Search } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  type: "crawler" | "extractor" | "validator" | "reviewer" | "promoter" | "indexer";
  health: "healthy" | "degraded" | "error";
  trustScore: number;
  itemsProcessed: number;
  lastActivity: string;
  currentTask?: string;
}

interface AgentAvatarsProps {
  className?: string;
}

// Mock agent data
const AGENTS: Agent[] = [
  {
    id: "crawler-1",
    name: "Crawler",
    type: "crawler",
    health: "healthy",
    trustScore: 0.96,
    itemsProcessed: 1247,
    lastActivity: "2s ago",
    currentTask: "Scanning PROVES docs",
  },
  {
    id: "extractor-1",
    name: "Extractor",
    type: "extractor",
    health: "healthy",
    trustScore: 0.94,
    itemsProcessed: 892,
    lastActivity: "1s ago",
    currentTask: "Processing entity batch",
  },
  {
    id: "validator-1",
    name: "Validator",
    type: "validator",
    health: "degraded",
    trustScore: 0.88,
    itemsProcessed: 634,
    lastActivity: "5s ago",
    currentTask: "Checking duplicates",
  },
  {
    id: "reviewer-1",
    name: "Reviewer",
    type: "reviewer",
    health: "healthy",
    trustScore: 0.91,
    itemsProcessed: 423,
    lastActivity: "3s ago",
    currentTask: "Queue: 12 items",
  },
  {
    id: "promoter-1",
    name: "Promoter",
    type: "promoter",
    health: "healthy",
    trustScore: 0.97,
    itemsProcessed: 387,
    lastActivity: "8s ago",
    currentTask: "Idle",
  },
  {
    id: "indexer-1",
    name: "Indexer",
    type: "indexer",
    health: "error",
    trustScore: 0.72,
    itemsProcessed: 156,
    lastActivity: "45s ago",
    currentTask: "Rebuilding index...",
  },
];

function getAgentIcon(type: Agent["type"]) {
  switch (type) {
    case "crawler": return Bug;
    case "extractor": return Gem;
    case "validator": return Brain;
    case "reviewer": return Eye;
    case "promoter": return Rocket;
    case "indexer": return Search;
  }
}

function getHealthColor(health: Agent["health"]): string {
  switch (health) {
    case "healthy": return "#22c55e";
    case "degraded": return "#f59e0b";
    case "error": return "#ef4444";
  }
}

function getHealthAnimation(health: Agent["health"]): string {
  switch (health) {
    case "healthy": return "animate-pulse-healthy";
    case "degraded": return "animate-pulse-degraded";
    case "error": return "animate-shake-error";
  }
}

export function AgentAvatars({ className = "" }: AgentAvatarsProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  return (
    <div className={`relative ${className}`}>
      {/* CSS for health animations */}
      <style>{`
        @keyframes pulse-healthy {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
          }
        }
        @keyframes pulse-degraded {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          25% {
            transform: scale(0.98);
            opacity: 0.8;
          }
          75% {
            transform: scale(1.02);
            opacity: 0.9;
          }
        }
        @keyframes shake-error {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-pulse-healthy {
          animation: pulse-healthy 2s ease-in-out infinite;
        }
        .animate-pulse-degraded {
          animation: pulse-degraded 1.5s ease-in-out infinite;
        }
        .animate-shake-error {
          animation: shake-error 0.5s ease-in-out infinite;
        }
      `}</style>

      {/* Agent grid */}
      <div className="grid grid-cols-3 gap-3 p-2 h-full">
        {AGENTS.map((agent) => {
          const Icon = getAgentIcon(agent.type);
          const healthColor = getHealthColor(agent.health);
          const animation = getHealthAnimation(agent.health);

          return (
            <div
              key={agent.id}
              className={`relative flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all
                ${selectedAgent?.id === agent.id ? "bg-[#334155]" : "bg-[#0f172a] hover:bg-[#1e293b]"}`}
              onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
            >
              {/* Avatar circle with health animation */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${animation}`}
                style={{
                  backgroundColor: `${healthColor}20`,
                  border: `2px solid ${healthColor}`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: healthColor }} />
              </div>

              {/* Agent name */}
              <span className="text-[10px] text-[#94a3b8] mt-1">{agent.name}</span>

              {/* Trust score bar */}
              <div className="w-full h-1 bg-[#334155] rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${agent.trustScore * 100}%`,
                    backgroundColor: healthColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected agent detail panel */}
      {selectedAgent && (
        <div className="absolute bottom-0 left-0 right-0 bg-[#0f172a] border-t border-[#334155] p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getHealthColor(selectedAgent.health) }}
              />
              <span className="text-xs font-medium text-[#e2e8f0]">{selectedAgent.name}</span>
              <span className="text-[10px] text-[#64748b]">
                Trust: {Math.round(selectedAgent.trustScore * 100)}%
              </span>
            </div>
            <div className="text-[10px] text-[#64748b]">
              {selectedAgent.itemsProcessed} processed · {selectedAgent.lastActivity}
            </div>
          </div>
          {selectedAgent.currentTask && (
            <div className="text-[10px] text-[#06b6d4] mt-1 truncate">
              {selectedAgent.currentTask}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
