import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
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
  Bot,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { useAgentOversight, ProposalWithCapability } from "../../hooks/useAgentOversight";
import type { Database, AgentCapabilityType } from "../../types/database";

type AgentCapability = Database['public']['Tables']['agent_capabilities']['Row'];

// Trust level display
function getTrustLevel(score: number): { label: string; color: string; description: string } {
  if (score >= 0.9) return { label: "Trusted", color: "text-green-600", description: "Auto-approves most changes" };
  if (score >= 0.7) return { label: "High", color: "text-blue-600", description: "Minimal review needed" };
  if (score >= 0.5) return { label: "Medium", color: "text-yellow-600", description: "Standard review" };
  if (score >= 0.3) return { label: "Low", color: "text-orange-600", description: "Careful review needed" };
  return { label: "New", color: "text-gray-500", description: "All changes need review" };
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
  const config: Record<string, { color: string; icon: React.ReactNode }> = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
    approved: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
    rejected: { color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
    auto_approved: { color: "bg-blue-100 text-blue-800", icon: <Zap className="h-3 w-3" /> },
    implemented: { color: "bg-purple-100 text-purple-800", icon: <CheckCircle className="h-3 w-3" /> },
    reverted: { color: "bg-orange-100 text-orange-800", icon: <AlertTriangle className="h-3 w-3" /> },
  };
  const { color, icon } = config[status] || { color: "bg-gray-100 text-gray-800", icon: null };

  return (
    <Badge className={`${color} flex items-center gap-1`}>
      {icon}
      {status.replace("_", " ")}
    </Badge>
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
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{getCapabilityLabel(capability.capability_type)}</span>
            <span className={`text-sm ${trust.color}`}>{trust.label}</span>
          </div>
          <Progress value={capability.trust_score * 100} className="h-2 mb-2" />
          <div className="text-xs text-gray-500">
            {trust.description}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>Trust Score: <span className="font-mono">{(capability.trust_score * 100).toFixed(1)}%</span></div>
            <div>Success Rate: <span className="font-mono">{successRate}%</span></div>
            <div>Total Proposals: <span className="font-mono">{capability.total_proposals}</span></div>
            <div>Approved: <span className="font-mono text-green-600">{capability.approved_count}</span></div>
            <div>Auto-approved: <span className="font-mono text-blue-600">{capability.auto_approved_count}</span></div>
            <div>Rejected: <span className="font-mono text-red-600">{capability.rejected_count}</span></div>
            <div>Successful: <span className="font-mono text-purple-600">{capability.successful_implementations}</span></div>
            <div>Failed: <span className="font-mono text-orange-600">{capability.failed_implementations}</span></div>
          </div>
          <div className="pt-2 text-xs text-gray-500">
            Auto-approve threshold: {(capability.auto_approve_threshold * 100).toFixed(0)}% |
            Review required: {capability.requires_review ? "Yes" : "No"}
          </div>
        </div>
      )}
    </Card>
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
      <Card className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium">{proposal.title}</h4>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <Bot className="h-4 w-4" />
              <span>{proposal.capability?.agent_name || "Unknown agent"}</span>
              <span>•</span>
              <span>{proposal.capability ? getCapabilityLabel(proposal.capability.capability_type) : "Unknown"}</span>
            </div>
          </div>
          <StatusBadge status={proposal.status} />
        </div>

        <p className="text-sm text-gray-700 mb-3">{proposal.rationale}</p>

        {proposal.predicted_impact && (
          <div className="text-sm bg-blue-50 p-2 rounded mb-3">
            <span className="font-medium">Expected impact:</span> {proposal.predicted_impact}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {new Date(proposal.created_at).toLocaleDateString()} at{" "}
            {new Date(proposal.created_at).toLocaleTimeString()}
          </span>

          {proposal.status === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  setReviewAction("reject");
                  setShowReviewDialog(true);
                }}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setReviewAction("approve");
                  setShowReviewDialog(true);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </div>
          )}

          {proposal.status === "auto_approved" && (
            <Badge className="bg-blue-100 text-blue-800">
              <Zap className="h-3 w-3 mr-1" />
              Auto-approved (high trust)
            </Badge>
          )}
        </div>
      </Card>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve" : "Reject"} Proposal
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "This will approve the agent's proposed change and increase their trust score."
                : "This will reject the proposal and decrease the agent's trust score."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded text-sm">
              <strong>{proposal.title}</strong>
              <p className="text-gray-600 mt-1">{proposal.rationale}</p>
            </div>

            <Textarea
              placeholder="Add review notes (optional)..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={submitting}
              className={reviewAction === "approve" ? "bg-green-600" : "bg-red-600"}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {reviewAction === "approve" ? "Approve" : "Reject"}
            </Button>
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
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-red-800 font-medium">Error loading agent oversight</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </Card>
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
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Agent Oversight
        </h2>
        <p className="text-gray-600">
          Review agent self-improvement proposals and monitor trust levels
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{pendingProposals.length}</div>
              <div className="text-sm text-gray-500">Pending Review</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{autoApprovedProposals.length}</div>
              <div className="text-sm text-gray-500">Auto-Approved</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{capabilities.length}</div>
              <div className="text-sm text-gray-500">Capabilities Tracked</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bot className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{agents.length}</div>
              <div className="text-sm text-gray-500">Active Agents</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Trust Dashboard by Agent */}
      <div>
        <h3 className="text-lg font-medium mb-4">Trust Levels by Agent</h3>
        <div className="space-y-6">
          {agents.map((agentName) => (
            <div key={agentName}>
              <div className="flex items-center gap-2 mb-3">
                <Bot className="h-5 w-5 text-gray-500" />
                <h4 className="font-medium capitalize">{agentName.replace("_", " ")}</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {capabilitiesByAgent[agentName].map((cap) => (
                  <CapabilityCard key={cap.id} capability={cap} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proposals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Agent Proposals</h3>
          <div className="flex gap-2">
            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="auto_approved">Auto-Approved</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredProposals.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <Bot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No proposals found</p>
            <p className="text-sm mt-1">
              Agents will propose improvements as they learn from extractions
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
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
