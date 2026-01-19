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
import {
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAgentOversight, ProposalWithCapability } from "../../hooks/useAgentOversight";
import type { Database, AgentCapabilityType } from "../../types/database";

type AgentCapability = Database['public']['Tables']['agent_capabilities']['Row'];

// Trust level display
function getTrustLevel(score: number): { label: string; color: string; description: string } {
  if (score >= 0.9) return { label: "Trusted", color: "text-green-400", description: "Auto-approves most changes" };
  if (score >= 0.7) return { label: "High", color: "text-blue-400", description: "Minimal review needed" };
  if (score >= 0.5) return { label: "Medium", color: "text-yellow-400", description: "Standard review" };
  if (score >= 0.3) return { label: "Low", color: "text-orange-400", description: "Careful review needed" };
  return { label: "New", color: "text-slate-400", description: "All changes need review" };
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

// Trust score card for a capability
function CapabilityCard({ capability }: { capability: AgentCapability }) {
  const [expanded, setExpanded] = useState(false);
  const trust = getTrustLevel(capability.trust_score);
  const successRate = capability.total_proposals > 0
    ? ((capability.approved_count + capability.auto_approved_count) / capability.total_proposals * 100).toFixed(0)
    : "N/A";

  return (
    <div className="p-3 bg-slate-900/50 border border-slate-700 rounded">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-slate-200">{getCapabilityLabel(capability.capability_type)}</span>
            <span className={`text-xs ${trust.color}`}>{trust.label}</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-slate-500 rounded-full"
              style={{ width: `${capability.trust_score * 100}%` }}
            />
          </div>
          <div className="text-xs text-slate-500">
            {trust.description}
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-500 hover:text-slate-300 p-1"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-700 space-y-2 text-xs text-slate-400">
          <div className="grid grid-cols-2 gap-2">
            <div>Trust Score: <span className="font-mono text-slate-300">{(capability.trust_score * 100).toFixed(1)}%</span></div>
            <div>Success Rate: <span className="font-mono text-slate-300">{successRate}%</span></div>
            <div>Total Proposals: <span className="font-mono text-slate-300">{capability.total_proposals}</span></div>
            <div>Approved: <span className="font-mono text-green-400">{capability.approved_count}</span></div>
            <div>Auto-approved: <span className="font-mono text-blue-400">{capability.auto_approved_count}</span></div>
            <div>Rejected: <span className="font-mono text-red-400">{capability.rejected_count}</span></div>
            <div>Successful: <span className="font-mono text-purple-400">{capability.successful_implementations}</span></div>
            <div>Failed: <span className="font-mono text-orange-400">{capability.failed_implementations}</span></div>
          </div>
          <div className="pt-2 text-slate-500">
            Auto-approve threshold: {(capability.auto_approve_threshold * 100).toFixed(0)}% |
            Review required: {capability.requires_review ? "Yes" : "No"}
          </div>
        </div>
      )}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Agent Oversight</h2>
        <p className="text-sm text-slate-400">
          Review agent self-improvement proposals and monitor trust levels
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
          <p className="text-2xl font-medium text-slate-100">{pendingProposals.length}</p>
          <p className="text-sm text-slate-400">Pending Review</p>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
          <p className="text-2xl font-medium text-slate-100">{autoApprovedProposals.length}</p>
          <p className="text-sm text-slate-400">Auto-Approved</p>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
          <p className="text-2xl font-medium text-slate-100">{capabilities.length}</p>
          <p className="text-sm text-slate-400">Capabilities Tracked</p>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
          <p className="text-2xl font-medium text-slate-100">{agents.length}</p>
          <p className="text-sm text-slate-400">Active Agents</p>
        </div>
      </div>

      {/* Trust Dashboard by Agent */}
      <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
        <h3 className="text-sm font-medium text-slate-200 mb-4">Trust Levels by Agent</h3>
        {agents.length === 0 ? (
          <p className="text-slate-400 text-sm">No agents registered yet</p>
        ) : (
          <div className="space-y-6">
            {agents.map((agentName) => (
              <div key={agentName}>
                <h4 className="text-sm font-medium text-slate-300 mb-3 capitalize">
                  {agentName.replace("_", " ")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {capabilitiesByAgent[agentName].map((cap) => (
                    <CapabilityCard key={cap.id} capability={cap} />
                  ))}
                </div>
              </div>
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
