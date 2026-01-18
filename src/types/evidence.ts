/**
 * Type definitions for Answer Evidence Tracking
 *
 * Tracks what sources were used to generate each answer.
 * Enables the evidence strip UI pattern.
 */

// =============================================================================
// ENUMS (matching database)
// =============================================================================

export type EvidenceSourceType = 'collective' | 'notebook';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

// =============================================================================
// DATABASE TYPES
// =============================================================================

/**
 * Conversation record from database
 */
export interface Conversation {
  id: string;
  user_id: string;
  team_id: string | null;
  title: string | null;
  scope_collective: boolean;
  scope_notebook: boolean;
  mission_filter: string | null;
  domain_filter: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/**
 * Message record from database
 */
export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

/**
 * Answer evidence record from database
 */
export interface AnswerEvidence {
  id: string;
  conversation_id: string;
  message_id: string;
  source_type: EvidenceSourceType;
  source_id: string | null;
  source_title: string;
  source_excerpt: string | null;
  source_url: string | null;
  source_metadata: Record<string, unknown> | null;
  relevance_score: number | null;
  created_at: string;
}

/**
 * Answer metadata record from database
 */
export interface AnswerMetadata {
  id: string;
  message_id: string;
  collective_source_count: number;
  notebook_source_count: number;
  confidence: ConfidenceLevel;
  freshness_days: number | null;
  model_provider: string | null;
  model_name: string | null;
  created_at: string;
}

// =============================================================================
// API TYPES
// =============================================================================

/**
 * Parameters for recording evidence
 */
export interface RecordEvidenceSource {
  type: EvidenceSourceType;
  source_id?: string;
  title: string;
  excerpt?: string;
  url?: string;
  metadata?: Record<string, unknown>;
  relevance_score?: number;
}

/**
 * Parameters for recording a complete answer with evidence
 */
export interface RecordAnswerParams {
  conversation_id: string;
  content: string;
  sources: RecordEvidenceSource[];
  confidence: ConfidenceLevel;
  freshness_days?: number;
  model_provider?: string;
  model_name?: string;
}

/**
 * Conversation with messages (for loading history)
 */
export interface ConversationWithMessages extends Conversation {
  messages: MessageWithEvidence[];
}

/**
 * Message with its evidence data
 */
export interface MessageWithEvidence extends Message {
  evidence?: AnswerEvidence[];
  metadata?: AnswerMetadata;
}

// =============================================================================
// UI TYPES (mapping to EvidenceStrip component)
// =============================================================================

/**
 * Evidence data formatted for the EvidenceStrip component
 */
export interface EvidenceStripData {
  collectiveCount: number;
  notebookCount: number;
  confidence: ConfidenceLevel;
  freshnessLabel: string;
  sources: EvidenceStripSource[];
}

/**
 * Individual source for the EvidenceStrip
 */
export interface EvidenceStripSource {
  id: string;
  type: EvidenceSourceType;
  title: string;
  sourceUrl?: string;
  sourceType?: string;
  excerpt?: string;
  capturedAt?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert database evidence to EvidenceStrip format
 */
export function toEvidenceStripData(
  evidence: AnswerEvidence[],
  metadata?: AnswerMetadata
): EvidenceStripData {
  const collectiveSources = evidence.filter(e => e.source_type === 'collective');
  const notebookSources = evidence.filter(e => e.source_type === 'notebook');

  // Format freshness label
  let freshnessLabel = 'Unknown';
  if (metadata?.freshness_days !== null && metadata?.freshness_days !== undefined) {
    if (metadata.freshness_days === 0) {
      freshnessLabel = 'Today';
    } else if (metadata.freshness_days === 1) {
      freshnessLabel = '1 day ago';
    } else {
      freshnessLabel = `${metadata.freshness_days} days ago`;
    }
  }

  return {
    collectiveCount: metadata?.collective_source_count ?? collectiveSources.length,
    notebookCount: metadata?.notebook_source_count ?? notebookSources.length,
    confidence: metadata?.confidence ?? 'medium',
    freshnessLabel,
    sources: evidence.map(e => ({
      id: e.id,
      type: e.source_type,
      title: e.source_title,
      sourceUrl: e.source_url ?? undefined,
      sourceType: (e.source_metadata as Record<string, unknown>)?.source_type as string | undefined,
      excerpt: e.source_excerpt ?? undefined,
      capturedAt: (e.source_metadata as Record<string, unknown>)?.captured_at as string | undefined,
    })),
  };
}

/**
 * Calculate confidence based on source quality
 */
export function calculateConfidence(
  collectiveCount: number,
  notebookCount: number,
  avgRelevanceScore?: number
): ConfidenceLevel {
  const totalSources = collectiveCount + notebookCount;

  // High confidence: multiple sources with good relevance
  if (totalSources >= 3 && (avgRelevanceScore ?? 0.5) >= 0.7) {
    return 'high';
  }

  // Medium confidence: some sources
  if (totalSources >= 1 && (avgRelevanceScore ?? 0.5) >= 0.4) {
    return 'medium';
  }

  // Low confidence: few or no sources, or poor relevance
  return 'low';
}
