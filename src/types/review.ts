/**
 * ReviewExtractionDTO - The contract between backend and frontend for human review
 * This matches the shape returned by review_queue_view
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Structured rejection taxonomy for analyzer feedback loop
 * Grouped into families: evidence_*, extraction_*, classification_*, source_*, other
 */
export type RejectionCategory =
  // Evidence issues
  | 'evidence_insufficient'    // Not enough supporting evidence
  | 'evidence_misquoted'       // Quote doesn't match source
  | 'evidence_outdated'        // Source is outdated/superseded
  | 'evidence_irrelevant'      // Evidence doesn't support extraction
  // Extraction accuracy
  | 'wrong_entity_type'        // Should be different entity type
  | 'duplicate_entity'         // Already exists in library
  | 'partial_extraction'       // Missing key information
  | 'hallucinated'             // Entity doesn't exist in source
  // Classification issues
  | 'wrong_ecosystem'          // Wrong ecosystem/domain assignment
  | 'wrong_frames'             // FRAMES metadata incorrect
  | 'confidence_too_high'      // AI confidence doesn't match quality
  // Source issues
  | 'source_unreliable'        // Source not authoritative
  | 'source_inaccessible'      // Cannot verify source
  // Other
  | 'other';                   // Other reason (see notes)

/**
 * Rejection category families for analyzer rollup
 */
export type RejectionFamily = 'evidence' | 'extraction' | 'classification' | 'source' | 'other';

/**
 * Maps each category to its family for analyzer grouping
 */
export const REJECTION_FAMILIES: Record<RejectionCategory, RejectionFamily> = {
  'evidence_insufficient': 'evidence',
  'evidence_misquoted': 'evidence',
  'evidence_outdated': 'evidence',
  'evidence_irrelevant': 'evidence',
  'wrong_entity_type': 'extraction',
  'duplicate_entity': 'extraction',
  'partial_extraction': 'extraction',
  'hallucinated': 'extraction',
  'wrong_ecosystem': 'classification',
  'wrong_frames': 'classification',
  'confidence_too_high': 'classification',
  'source_unreliable': 'source',
  'source_inaccessible': 'source',
  'other': 'other',
};

/**
 * Human-readable labels for rejection categories
 */
export const REJECTION_LABELS: Record<RejectionCategory, string> = {
  'evidence_insufficient': 'Not enough supporting evidence',
  'evidence_misquoted': 'Quote doesn\'t match source',
  'evidence_outdated': 'Source is outdated/superseded',
  'evidence_irrelevant': 'Evidence doesn\'t support extraction',
  'wrong_entity_type': 'Should be different entity type',
  'duplicate_entity': 'Already exists in library',
  'partial_extraction': 'Missing key information',
  'hallucinated': 'Entity doesn\'t exist in source',
  'wrong_ecosystem': 'Wrong ecosystem/domain assignment',
  'wrong_frames': 'FRAMES metadata incorrect',
  'confidence_too_high': 'AI confidence doesn\'t match quality',
  'source_unreliable': 'Source not authoritative',
  'source_inaccessible': 'Cannot verify source',
  'other': 'Other reason (see notes)',
};

/**
 * Group labels for the rejection category dropdown
 */
export const REJECTION_GROUPS: Record<RejectionFamily, { label: string; categories: RejectionCategory[] }> = {
  evidence: {
    label: 'Evidence Issues',
    categories: ['evidence_insufficient', 'evidence_misquoted', 'evidence_outdated', 'evidence_irrelevant'],
  },
  extraction: {
    label: 'Extraction Accuracy',
    categories: ['wrong_entity_type', 'duplicate_entity', 'partial_extraction', 'hallucinated'],
  },
  classification: {
    label: 'Classification Issues',
    categories: ['wrong_ecosystem', 'wrong_frames', 'confidence_too_high'],
  },
  source: {
    label: 'Source Issues',
    categories: ['source_unreliable', 'source_inaccessible'],
  },
  other: {
    label: 'Other',
    categories: ['other'],
  },
};

// =============================================================================
// DTOs
// =============================================================================

/**
 * Evidence structure for reviewer
 */
export interface ReviewEvidence {
  /** Exact quote from source document */
  raw_text: string;
  /** Byte offset in source (for "jump to quote") */
  byte_offset: number | null;
  /** Length in bytes */
  byte_length: number | null;
  /** SHA256 checksum for verification */
  checksum: string | null;

  /** Structured rationale (NOT chain-of-thought) */
  rationale_summary: {
    /** What patterns/signals the AI observed */
    signals_observed: string[];
    /** What entities/examples were compared */
    comparisons_made: string[];
    /** What uncertainties the AI noted */
    uncertainty_factors: string[];
  };

  /** Duplicate detection results */
  duplicate_check: {
    /** IDs of exact matches in core_entities */
    exact_matches: string[];
    /** Similar entities with similarity scores */
    similar_entities: Array<{
      id: string;
      name: string;
      similarity: number;
    }>;
    /** AI recommendation */
    recommendation: 'create_new' | 'merge_with' | 'needs_review';
  };
}

/**
 * Lineage verification status
 */
export interface ReviewLineage {
  /** Did the quote match the source exactly? */
  verified: boolean;
  /** Confidence: 1.0 = exact, 0.85 = normalized, 0.7 = ambiguous */
  confidence: number;
  /** When verification was performed */
  verified_at: string | null;
}

/**
 * Source snapshot context
 */
export interface ReviewSnapshot {
  /** UUID of raw_snapshots row */
  snapshot_id: string | null;
  /** Original source URL */
  source_url: string | null;
  /** Type: webpage, github_file, etc. */
  source_type: string | null;
  /** Excerpt of surrounding context (NOT full payload) */
  context_excerpt: string | null;
  /** When snapshot was captured */
  captured_at: string | null;
}

/**
 * AI confidence with reason
 */
export interface ReviewConfidence {
  /** 0.0 - 1.0 */
  score: number;
  /** Short summary of why (NOT internal deliberation) */
  reason: string;
}

/**
 * Latest decision if already reviewed
 */
export interface ReviewLatestDecision {
  decision_id: string;
  decision: string;
  decided_by: string;
  decided_at: string;
  rejection_category: RejectionCategory | null;
  decision_reason: string | null;
  human_confidence_override: number | null;
  confidence_override_reason: string | null;
  source_flagged: boolean;
  source_flag_reason: string | null;
}

/**
 * Main DTO for review UI - matches review_queue_view
 */
export interface ReviewExtractionDTO {
  // Identity
  extraction_id: string;
  candidate_type: string;
  candidate_key: string;
  ecosystem: string | null;
  status: string;
  created_at: string;

  // Entity payload (editable)
  candidate_payload: Record<string, unknown>;

  // Evidence (for reviewer to verify)
  evidence: ReviewEvidence;

  // Lineage verification
  lineage: ReviewLineage;

  // Source context
  snapshot: ReviewSnapshot;

  // AI confidence (what reviewer is evaluating)
  confidence: ReviewConfidence;

  // Existing decision (if any)
  latest_decision: ReviewLatestDecision | null;

  // Edit history count
  edit_count: number;
}

// =============================================================================
// FUNCTION PARAMETERS
// =============================================================================

/**
 * Parameters for record_review_decision RPC
 */
export interface RecordReviewDecisionParams {
  p_extraction_id: string;
  p_decision: 'accept' | 'reject' | 'merge' | 'defer' | 'needs_more_evidence';
  p_reviewer_id: string;
  p_rejection_category?: RejectionCategory;
  p_decision_reason?: string;
  p_human_confidence_override?: number;
  p_confidence_override_reason?: string;
  p_source_flagged?: boolean;
  p_source_flag_reason?: string;
}

/**
 * Parameters for record_review_edit RPC
 */
export interface RecordReviewEditParams {
  p_extraction_id: string;
  p_reviewer_id: string;
  p_before_payload: Record<string, unknown>;
  p_after_payload: Record<string, unknown>;
  p_edit_reason?: string;
  p_apply_to_extraction?: boolean;
}

// =============================================================================
// UI STATE
// =============================================================================

/**
 * Local state for the review form before submission
 */
export interface ReviewFormState {
  // Current payload (may have edits)
  editedPayload: Record<string, unknown>;
  hasUnsavedEdits: boolean;

  // Decision fields
  decision: 'accept' | 'reject' | 'merge' | 'defer' | null;
  rejectionCategory: RejectionCategory | null;
  decisionReason: string;

  // Optional overrides
  confidenceOverride: number | null;
  confidenceOverrideReason: string;
  sourceFlagged: boolean;
  sourceFlagReason: string;
}

/**
 * Computed diff for UI display
 */
export interface PayloadDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: 'added' | 'removed' | 'modified';
}

/**
 * Helper to compute payload diff
 */
export function computePayloadDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): PayloadDiff[] {
  const diffs: PayloadDiff[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const oldValue = before[key];
    const newValue = after[key];

    if (!(key in before)) {
      diffs.push({ field: key, oldValue: undefined, newValue, changeType: 'added' });
    } else if (!(key in after)) {
      diffs.push({ field: key, oldValue, newValue: undefined, changeType: 'removed' });
    } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      diffs.push({ field: key, oldValue, newValue, changeType: 'modified' });
    }
  }

  return diffs;
}
