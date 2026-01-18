/**
 * CouplingCard - Engineer-friendly display of an extraction
 *
 * Presents extractions as COUPLINGS (relationships) rather than database records.
 * The coupling IS the knowledge - components are just labels.
 */

import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  ArrowRight,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Link2,
  Cpu,
  Users,
  HardDrive,
} from "lucide-react";
import type { ReviewExtractionDTO } from "@/types/review";

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Parse extraction to identify the coupling (from → to → via)
 */
function parseCoupling(payload: Record<string, unknown>): {
  from: string | null;
  to: string | null;
  via: string | null;
  flow: string | null;
  layer: "digital" | "physical" | "organizational" | null;
} {
  // Try to extract coupling information from various payload formats
  const from = (payload.from_component || payload.source_component || payload.from || payload.name) as string | null;
  const to = (payload.to_component || payload.target_component || payload.to || payload.depends_on) as string | null;
  const via = (payload.via_interface || payload.interface || payload.via || payload.port) as string | null;
  const flow = (payload.flow?.what || payload.data_flow || payload.flow) as string | null;
  const layer = (payload.relationship_layer || payload.layer) as "digital" | "physical" | "organizational" | null;

  return { from, to, via, flow, layer };
}

/**
 * Get icon for relationship layer
 */
function getLayerIcon(layer: string | null) {
  switch (layer) {
    case "digital":
      return Cpu;
    case "physical":
      return HardDrive;
    case "organizational":
      return Users;
    default:
      return Link2;
  }
}

/**
 * Get color for relationship layer
 */
function getLayerColor(layer: string | null) {
  switch (layer) {
    case "digital":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "physical":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "organizational":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

/**
 * Get coupling strength color
 */
function getStrengthColor(strength: number): string {
  if (strength >= 0.9) return "bg-red-500";
  if (strength >= 0.6) return "bg-orange-500";
  if (strength >= 0.3) return "bg-yellow-500";
  return "bg-green-500";
}

/**
 * Get confidence display
 */
function getConfidenceDisplay(score: number): { color: string; label: string } {
  if (score >= 0.8) return { color: "text-green-600 bg-green-50", label: "High confidence" };
  if (score >= 0.5) return { color: "text-yellow-600 bg-yellow-50", label: "Medium confidence" };
  return { color: "text-red-600 bg-red-50", label: "Low confidence" };
}

// =============================================================================
// COMPONENT
// =============================================================================

interface CouplingCardProps {
  extraction: ReviewExtractionDTO;
  onView: () => void;
  showDetails?: boolean;
}

/**
 * Engineer-friendly card showing what coupling was extracted
 */
export function CouplingCard({ extraction, onView, showDetails = false }: CouplingCardProps) {
  const { confidence, lineage, candidate_payload } = extraction;
  const coupling = parseCoupling(candidate_payload);
  const LayerIcon = getLayerIcon(coupling.layer);
  const confDisplay = getConfidenceDisplay(confidence.score);

  // Get coupling strength if available
  const couplingStrength = (candidate_payload.coupling_strength as number) || null;

  // Check if this is a component (node) vs coupling (edge)
  const isCoupling = coupling.from && coupling.to;
  const isComponent = !isCoupling && extraction.candidate_type === "component";

  return (
    <Card
      className="p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
      onClick={onView}
    >
      {/* Header: What type of extraction */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Layer badge */}
          {coupling.layer && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getLayerColor(coupling.layer)}`}>
              <LayerIcon className="h-3 w-3" />
              {coupling.layer}
            </span>
          )}
          {!coupling.layer && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              {isComponent ? "Component" : "Coupling"}
            </span>
          )}

          {/* Source age */}
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(extraction.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Verification status */}
        <div className="flex items-center gap-2">
          {lineage.verified ? (
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Unverified
            </Badge>
          )}
        </div>
      </div>

      {/* Main content: The coupling or component */}
      {isCoupling ? (
        <CouplingDisplay
          from={coupling.from!}
          to={coupling.to!}
          via={coupling.via}
          flow={coupling.flow}
          strength={couplingStrength}
        />
      ) : (
        <ComponentDisplay
          name={extraction.candidate_key}
          type={extraction.candidate_type}
          description={candidate_payload.description as string}
        />
      )}

      {/* Footer: Confidence and action hint */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {/* Confidence */}
          <div className={`px-2 py-1 rounded text-xs font-medium ${confDisplay.color}`}>
            {Math.round(confidence.score * 100)}% confidence
          </div>

          {/* Quick reason */}
          {showDetails && confidence.reason && (
            <span className="text-xs text-gray-500 truncate max-w-[200px]">
              {confidence.reason}
            </span>
          )}
        </div>

        <ArrowRight className="w-4 h-4 text-gray-400" />
      </div>
    </Card>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface CouplingDisplayProps {
  from: string;
  to: string;
  via: string | null;
  flow: string | null;
  strength: number | null;
}

/**
 * Visual display of a coupling (from → to)
 */
function CouplingDisplay({ from, to, via, flow, strength }: CouplingDisplayProps) {
  return (
    <div className="space-y-2">
      {/* The coupling itself */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
          {from}
        </span>
        <div className="flex items-center gap-1 text-gray-400">
          <ArrowRight className="h-4 w-4" />
          {via && (
            <span className="text-xs text-gray-500 italic">via {via}</span>
          )}
          <ArrowRight className="h-4 w-4" />
        </div>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-medium">
          {to}
        </span>
      </div>

      {/* What flows */}
      {flow && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Zap className="h-3 w-3 text-yellow-500" />
          <span>{flow}</span>
        </div>
      )}

      {/* Coupling strength */}
      {strength !== null && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Strength:</span>
          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getStrengthColor(strength)} rounded-full`}
              style={{ width: `${strength * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">{strength.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

interface ComponentDisplayProps {
  name: string;
  type: string;
  description?: string;
}

/**
 * Visual display of a component (node)
 */
function ComponentDisplay({ name, type, description }: ComponentDisplayProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-900">{name}</span>
        <span className="text-xs text-gray-400">({type})</span>
      </div>
      {description && (
        <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
      )}
    </div>
  );
}

// =============================================================================
// COMPACT VARIANT
// =============================================================================

interface CouplingCardCompactProps {
  extraction: ReviewExtractionDTO;
  onView: () => void;
  selected?: boolean;
}

/**
 * Compact version for list views
 */
export function CouplingCardCompact({ extraction, onView, selected = false }: CouplingCardCompactProps) {
  const { confidence, lineage, candidate_payload } = extraction;
  const coupling = parseCoupling(candidate_payload);
  const isCoupling = coupling.from && coupling.to;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
        selected
          ? "border-blue-400 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
      onClick={onView}
    >
      {/* Verification indicator */}
      <div className="flex-shrink-0">
        {lineage.verified ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {isCoupling ? (
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium text-gray-900 truncate">{coupling.from}</span>
            <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <span className="font-medium text-gray-900 truncate">{coupling.to}</span>
          </div>
        ) : (
          <span className="font-medium text-gray-900 truncate block">
            {extraction.candidate_key}
          </span>
        )}
        <span className="text-xs text-gray-500">
          {coupling.layer || extraction.candidate_type}
        </span>
      </div>

      {/* Confidence */}
      <div className={`px-2 py-0.5 rounded text-xs font-medium ${
        confidence.score >= 0.8 ? "bg-green-100 text-green-700" :
        confidence.score >= 0.5 ? "bg-yellow-100 text-yellow-700" :
        "bg-red-100 text-red-700"
      }`}>
        {Math.round(confidence.score * 100)}%
      </div>

      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </div>
  );
}
