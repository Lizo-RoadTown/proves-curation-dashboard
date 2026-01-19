import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Textarea } from "@/app/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { useAgentOversight, ProposalWithCapability } from "../../hooks/useAgentOversight";
import type { Database, AgentCapabilityType } from "../../types/database";

type AgentCapability = Database['public']['Tables']['agent_capabilities']['Row'];

// Trust level display with hex colors for Recharts
function getTrustLevel(score: number): { label: string; color: string; hexColor: string; description: string } {
  if (score >= 0.9) return { label: "Trusted", color: "text-green-400", hexColor: "#22c55e", description: "Auto-approves most changes" };
  if (score >= 0.7) return { label: "High", color: "text-blue-400", hexColor: "#3b82f6", description: "Minimal review needed" };
  if (score >= 0.5) return { label: "Medium", color: "text-yellow-400", hexColor: "#eab308", description: "Standard review" };
  if (score >= 0.3) return { label: "Low", color: "text-orange-400", hexColor: "#f97316", description: "Careful review needed" };
  return { label: "New", color: "text-slate-400", hexColor: "#64748b", description: "All changes need review" };
}

// Capability type display
function getCapabilityLabel(type: AgentCapabilityType): string {
  const labels: Record<AgentCapabilityType, string> = {
    prompt_update: "Prompt Updates",
    threshold_change: "Thresholds",
    method_improvement: "Methods",
    tool_configuration: "Tools",
    ontology_expansion: "Ontology",
    validation_rule: "Validation Rules",
  };
  return labels[type] || type;
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    pending: "bg-yellow-900/50 text-yellow-400 border-yellow-700",
    approved: "bg-green-900/50 text-green-400 border-green-700",
    rejected: "bg-red-900/50 text-red-400 border-red-700",
    auto_approved: "bg-blue-900/50 text-blue-400 border-blue-700",
    implemented: "bg-purple-900/50 text-purple-400 border-purple-700",
    reverted: "bg-orange-900/50 text-orange-400 border-orange-700",
  };
  const color = config[status] || "bg-slate-800 text-slate-400 border-slate-700";

  return (
    <span className={`${color} text-xs px-2 py-0.5 rounded border`}>
      {status.replace("_", " ")}
    </span>
  );
}

// Capability Gauge - cockpit style dial
function CapabilityGauge({ capability }: { capability: AgentCapability }) {
  const trust = getTrustLevel(capability.trust_score);
  const trustPercent = Math.round(capability.trust_score * 100);

  return (
    <div className="flex flex-col items-center p-2">
      <div className="relative w-16 h-16">
        <RadialBarChart
          width={64}
          height={64}
          cx={32}
          cy={32}
          innerRadius={20}
          outerRadius={30}
          startAngle={90}
          endAngle={-270}
          data={[{ value: trustPercent, fill: trust.hexColor }]}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={4} />
        </RadialBarChart>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${trust.color}`}>{trustPercent}%</span>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-1 text-center truncate max-w-[80px]">
        {getCapabilityLabel(capability.capability_type).split(' ')[0]}
      </p>
    </div>
  );
}

// Agent Cockpit Panel - shows all capabilities as gauges
function AgentCockpit({ agentName, capabilities }: { agentName: string; capabilities: AgentCapability[] }) {
  // Calculate overall agent trust (average of all capabilities)
  const avgTrust = capabilities.length > 0
    ? capabilities.reduce((sum, c) => sum + c.trust_score, 0) / capabilities.length
    : 0;
  const overallTrust = getTrustLevel(avgTrust);
  const totalProposals = capabilities.reduce((sum, c) => sum + c.total_proposals, 0);
  const totalApproved = capabilities.reduce((sum, c) => sum + c.approved_count + c.auto_approved_count, 0);

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded p-4">
      {/* Agent Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
        <div className="flex items-center gap-3">
          {/* Overall trust gauge */}
          <div className="relative w-14 h-14">
            <RadialBarChart
              width={56}
              height={56}
              cx={28}
              cy={28}
              innerRadius={18}
              outerRadius={26}
              startAngle={90}
              endAngle={-270}
              data={[{ value: Math.round(avgTrust * 100), fill: overallTrust.hexColor }]}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={4} />
            </RadialBarChart>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-bold ${overallTrust.color}`}>
                {Math.round(avgTrust * 100)}
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-200 capitalize">
              {agentName.replace(/_/g, " ")}
            </h4>
            <p className={`text-xs ${overallTrust.color}`}>{overallTrust.label}</p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>{totalProposals} proposals</div>
          <div className="text-green-400">{totalApproved} approved</div>
        </div>
      </div>

      {/* Capability Gauges Grid */}
      <div className="grid grid-cols-6 gap-1">
        {capabilities.map((cap) => (
          <CapabilityGauge key={cap.id} capability={cap} />
        ))}
      </div>
    </div>
  );
}

// Proposal card
function ProposalCard({
  proposal,
  onApprove,
  onReject,
}: {
  proposal: ProposalWithCapability;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, notes?: string) => Promise<void>;
}) {
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReview = async () => {
    setSubmitting(true);
    try {
      if (reviewAction === "approve") {
        await onApprove(proposal.id, reviewNotes);
      } else {
        await onReject(proposal.id, reviewNotes);
      }
      setShowReviewDialog(false);
      setReviewNotes("");
    } catch (err) {
      console.error("Review failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="p-4 bg-slate-900/50 border border-slate-700 rounded">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-slate-200">{proposal.title}</h4>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <span>{proposal.capability?.agent_name || "Unknown agent"}</span>
              <span>·</span>
              <span>{proposal.capability ? getCapabilityLabel(proposal.capability.capability_type) : "Unknown"}</span>
            </div>
          </div>
          <StatusBadge status={proposal.status} />
        </div>

        <p className="text-sm text-slate-400 mb-3">{proposal.rationale}</p>

        {proposal.predicted_impact && (
          <div className="text-sm bg-slate-800/50 border border-slate-700 p-2 rounded mb-3">
            <span className="font-medium text-slate-300">Expected impact:</span>{" "}
            <span className="text-slate-400">{proposal.predicted_impact}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {new Date(proposal.created_at).toLocaleDateString()} at{" "}
            {new Date(proposal.created_at).toLocaleTimeString()}
          </span>

          {proposal.status === "pending" && (
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 text-sm text-red-400 border border-red-900/50 rounded hover:bg-red-900/30 transition-colors"
                onClick={() => {
                  setReviewAction("reject");
                  setShowReviewDialog(true);
                }}
              >
                Reject
              </button>
              <button
                className="px-3 py-1.5 text-sm text-green-400 border border-green-900/50 rounded hover:bg-green-900/30 transition-colors"
                onClick={() => {
                  setReviewAction("approve");
                  setShowReviewDialog(true);
                }}
              >
                Approve
              </button>
            </div>
          )}

          {proposal.status === "auto_approved" && (
            <span className="text-xs text-blue-400">
              Auto-approved (high trust)
            </span>
          )}
        </div>
      </div>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="bg-slate-900 border border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              {reviewAction === "approve" ? "Approve" : "Reject"} Proposal
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {reviewAction === "approve"
                ? "This will approve the agent's proposed change and increase their trust score."
                : "This will reject the proposal and decrease the agent's trust score."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 p-3 rounded text-sm">
              <strong className="text-slate-200">{proposal.title}</strong>
              <p className="text-slate-400 mt-1">{proposal.rationale}</p>
            </div>

            <Textarea
              placeholder="Add review notes (optional)..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
              className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
            />
          </div>

          <DialogFooter>
            <button
              className="px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded hover:bg-slate-800 transition-colors"
              onClick={() => setShowReviewDialog(false)}
            >
              Cancel
            </button>
            <button
              onClick={handleReview}
              disabled={submitting}
              className={`px-4 py-2 text-sm rounded transition-colors flex items-center ${
                reviewAction === "approve"
                  ? "bg-green-900/50 text-green-400 border border-green-800 hover:bg-green-900/70"
                  : "bg-red-900/50 text-red-400 border border-red-800 hover:bg-red-900/70"
              } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {reviewAction === "approve" ? "Approve" : "Reject"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Main component
export function AgentOversight() {
  const {
    capabilities,
    proposals,
    pendingProposals,
    autoApprovedProposals,
    capabilitiesByAgent,
    loading,
    error,
    approveProposal,
    rejectProposal,
  } = useAgentOversight();

  const [filterAgent, setFilterAgent] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
        <h3 className="text-slate-200 font-medium">Error loading agent oversight</h3>
        <p className="text-slate-400 text-sm mt-1">{error}</p>
      </div>
    );
  }

  const agents = Object.keys(capabilitiesByAgent);

  const filteredProposals = proposals.filter((p) => {
    if (filterAgent !== "all" && p.capability?.agent_name !== filterAgent) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  // Calculate overall fleet stats
  const overallTrust = capabilities.length > 0
    ? capabilities.reduce((sum, c) => sum + c.trust_score, 0) / capabilities.length
    : 0;
  const overallTrustLevel = getTrustLevel(overallTrust);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Agent Oversight</h2>
        <p className="text-sm text-slate-400">
          Monitor agent trust levels and review self-improvement proposals
        </p>
      </div>

      {/* Fleet Overview Gauges */}
      <div className="grid grid-cols-4 gap-6">
        {/* Overall Fleet Trust */}
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded flex items-center gap-4">
          <div className="relative w-20 h-20">
            <RadialBarChart
              width={80}
              height={80}
              cx={40}
              cy={40}
              innerRadius={26}
              outerRadius={38}
              startAngle={90}
              endAngle={-270}
              data={[{ value: Math.round(overallTrust * 100), fill: overallTrustLevel.hexColor }]}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={6} />
            </RadialBarChart>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${overallTrustLevel.color}`}>
                {Math.round(overallTrust * 100)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-300">Fleet Trust</p>
            <p className={`text-xs ${overallTrustLevel.color}`}>{overallTrustLevel.label}</p>
          </div>
        </div>

        {/* Pending Review */}
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded flex items-center gap-4">
          <div className="relative w-20 h-20">
            <RadialBarChart
              width={80}
              height={80}
              cx={40}
              cy={40}
              innerRadius={26}
              outerRadius={38}
              startAngle={90}
              endAngle={-270}
              data={[{ value: Math.min(pendingProposals.length * 20, 100), fill: pendingProposals.length > 0 ? "#f59e0b" : "#22c55e" }]}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={6} />
            </RadialBarChart>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${pendingProposals.length > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                {pendingProposals.length}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-300">Pending</p>
            <p className="text-xs text-slate-500">{pendingProposals.length === 0 ? "All clear" : "Need review"}</p>
          </div>
        </div>

        {/* Auto-Approved */}
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded flex items-center gap-4">
          <div className="relative w-20 h-20">
            <RadialBarChart
              width={80}
              height={80}
              cx={40}
              cy={40}
              innerRadius={26}
              outerRadius={38}
              startAngle={90}
              endAngle={-270}
              data={[{ value: Math.min(autoApprovedProposals.length * 10, 100), fill: "#3b82f6" }]}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={6} />
            </RadialBarChart>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-blue-400">{autoApprovedProposals.length}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-300">Auto-Approved</p>
            <p className="text-xs text-slate-500">High trust ops</p>
          </div>
        </div>

        {/* Active Agents */}
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded flex items-center gap-4">
          <div className="relative w-20 h-20">
            <RadialBarChart
              width={80}
              height={80}
              cx={40}
              cy={40}
              innerRadius={26}
              outerRadius={38}
              startAngle={90}
              endAngle={-270}
              data={[{ value: Math.min(agents.length * 25, 100), fill: "#8b5cf6" }]}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={6} />
            </RadialBarChart>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-purple-400">{agents.length}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-300">Agents</p>
            <p className="text-xs text-slate-500">{capabilities.length} capabilities</p>
          </div>
        </div>
      </div>

      {/* Agent Cockpits */}
      <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
        <h3 className="text-sm font-medium text-slate-200 mb-4">Agent Trust Cockpit</h3>
        {agents.length === 0 ? (
          <p className="text-slate-400 text-sm">No agents registered yet</p>
        ) : (
          <div className="space-y-4">
            {agents.map((agentName) => (
              <AgentCockpit
                key={agentName}
                agentName={agentName}
                capabilities={capabilitiesByAgent[agentName]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Proposals Section */}
      <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-200">Agent Proposals</h3>
          <div className="flex gap-2">
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="text-sm bg-slate-900 border border-slate-700 text-slate-300 rounded px-3 py-1.5"
            >
              <option value="all">All Agents</option>
              {agents.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm bg-slate-900 border border-slate-700 text-slate-300 rounded px-3 py-1.5"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="auto_approved">Auto-Approved</option>
              <option value="implemented">Implemented</option>
            </select>
          </div>
        </div>

        {filteredProposals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">No proposals found</p>
            <p className="text-slate-500 text-xs mt-1">
              Agents will propose improvements as they learn from extractions
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onApprove={approveProposal}
                onReject={rejectProposal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
