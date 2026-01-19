/**
 * useReviewExtractions - Hook for human review workflow
 *
 * Uses the new review_queue_view and record_review_* RPCs
 * Returns ReviewExtractionDTO shape for the UI
 */

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type {
  ReviewExtractionDTO,
  ReviewEvidence,
  ReviewLineage,
  ReviewSnapshot,
  ReviewConfidence,
  ReviewLatestDecision,
  ReviewEpistemics,
  RejectionCategory,
  RecordReviewDecisionParams,
  RecordReviewEditParams,
} from '../types/review'
import type { Json } from '../types/database'

// =============================================================================
// TYPES
// =============================================================================

interface UseReviewExtractionsResult {
  // Data
  extractions: ReviewExtractionDTO[]
  currentExtraction: ReviewExtractionDTO | null

  // Loading states
  loading: boolean
  loadingDetail: boolean
  error: string | null

  // Actions
  fetchExtractions: (filters?: ExtractionFilters) => Promise<void>
  fetchExtractionById: (id: string) => Promise<ReviewExtractionDTO | null>
  recordDecision: (params: RecordReviewDecisionParams) => Promise<string>
  recordEdit: (params: RecordReviewEditParams) => Promise<string>
  refresh: () => Promise<void>
}

interface ExtractionFilters {
  status?: string
  ecosystem?: string
  candidateType?: string
  limit?: number
  organizationId?: string  // Filter by source_organization_id for tenant isolation
}

// =============================================================================
// PARSING HELPERS
// =============================================================================

/**
 * Parse the JSONB evidence field into typed structure
 */
function parseEvidence(raw: Json | null): ReviewEvidence {
  const evidence = raw as Record<string, unknown> | null
  return {
    raw_text: (evidence?.raw_text as string) || '',
    byte_offset: (evidence?.byte_offset as number) || null,
    byte_length: (evidence?.byte_length as number) || null,
    checksum: (evidence?.checksum as string) || null,
    rationale_summary: {
      signals_observed: ((evidence?.rationale_summary as Record<string, unknown>)?.signals_observed as string[]) || [],
      comparisons_made: ((evidence?.rationale_summary as Record<string, unknown>)?.comparisons_made as string[]) || [],
      uncertainty_factors: ((evidence?.rationale_summary as Record<string, unknown>)?.uncertainty_factors as string[]) || [],
    },
    duplicate_check: {
      exact_matches: ((evidence?.duplicate_check as Record<string, unknown>)?.exact_matches as string[]) || [],
      similar_entities: ((evidence?.duplicate_check as Record<string, unknown>)?.similar_entities as Array<{ id: string; name: string; similarity: number }>) || [],
      recommendation: ((evidence?.duplicate_check as Record<string, unknown>)?.recommendation as 'create_new' | 'merge_with' | 'needs_review') || 'create_new',
    },
  }
}

/**
 * Parse the JSONB lineage field
 */
function parseLineage(raw: Json | null): ReviewLineage {
  const lineage = raw as Record<string, unknown> | null
  return {
    verified: (lineage?.verified as boolean) || false,
    confidence: (lineage?.confidence as number) || 0,
    verified_at: (lineage?.verified_at as string) || null,
  }
}

/**
 * Parse the JSONB snapshot field
 */
function parseSnapshot(raw: Json | null): ReviewSnapshot {
  const snapshot = raw as Record<string, unknown> | null
  return {
    snapshot_id: (snapshot?.snapshot_id as string) || null,
    source_url: (snapshot?.source_url as string) || null,
    source_type: (snapshot?.source_type as string) || null,
    context_excerpt: (snapshot?.context_excerpt as string) || null,
    captured_at: (snapshot?.captured_at as string) || null,
  }
}

/**
 * Parse the JSONB confidence field
 */
function parseConfidence(raw: Json | null): ReviewConfidence {
  const confidence = raw as Record<string, unknown> | null
  return {
    score: (confidence?.score as number) || 0,
    reason: (confidence?.reason as string) || '',
  }
}

/**
 * Parse the JSONB latest_decision field
 */
function parseLatestDecision(raw: Json | null): ReviewLatestDecision | null {
  if (!raw) return null
  const decision = raw as Record<string, unknown>
  return {
    decision_id: decision.decision_id as string,
    decision: decision.decision as string,
    decided_by: decision.decided_by as string,
    decided_at: decision.decided_at as string,
    rejection_category: (decision.rejection_category as RejectionCategory) || null,
    decision_reason: (decision.decision_reason as string) || null,
    human_confidence_override: (decision.human_confidence_override as number) || null,
    confidence_override_reason: (decision.confidence_override_reason as string) || null,
    source_flagged: (decision.source_flagged as boolean) || false,
    source_flag_reason: (decision.source_flag_reason as string) || null,
  }
}

/**
 * Parse the JSONB epistemics field (7 Knowledge Capture Questions)
 */
function parseEpistemics(raw: Json | null): ReviewEpistemics | null {
  if (!raw) return null
  const ep = raw as Record<string, unknown>

  const observer = ep.observer as Record<string, unknown> | null
  const pattern = ep.pattern as Record<string, unknown> | null
  const dependencies = ep.dependencies as Record<string, unknown> | null
  const conditions = ep.conditions as Record<string, unknown> | null
  const temporal = ep.temporal as Record<string, unknown> | null
  const authorship = ep.authorship as Record<string, unknown> | null
  const transferability = ep.transferability as Record<string, unknown> | null

  return {
    observer: {
      id: (observer?.id as string) || null,
      type: (observer?.type as string) || null,
      contact_mode: (observer?.contact_mode as string) || null,
      contact_strength: (observer?.contact_strength as number) || null,
    },
    pattern: {
      storage: (pattern?.storage as string) || null,
      representation_media: (pattern?.representation_media as string[]) || null,
      signal_type: (pattern?.signal_type as string) || null,
    },
    dependencies: {
      entities: (dependencies?.entities as string[]) || null,
      sequence_role: (dependencies?.sequence_role as string) || null,
    },
    conditions: {
      validity_conditions: (conditions?.validity_conditions as Record<string, unknown>) || null,
      assumptions: (conditions?.assumptions as string[]) || null,
      scope: (conditions?.scope as string) || null,
    },
    temporal: {
      observed_at: (temporal?.observed_at as string) || null,
      valid_from: (temporal?.valid_from as string) || null,
      valid_to: (temporal?.valid_to as string) || null,
      refresh_trigger: (temporal?.refresh_trigger as string) || null,
      staleness_risk: (temporal?.staleness_risk as number) || null,
    },
    authorship: {
      author_id: (authorship?.author_id as string) || null,
      intent: (authorship?.intent as string) || null,
      uncertainty_notes: (authorship?.uncertainty_notes as string) || null,
    },
    transferability: {
      reenactment_required: (transferability?.reenactment_required as boolean) || null,
      practice_interval: (transferability?.practice_interval as string) || null,
      skill_transferability: (transferability?.skill_transferability as string) || null,
    },
    domain: (ep.domain as string) || null,
  }
}

/**
 * Transform raw view row into ReviewExtractionDTO
 */
function transformRowToDTO(row: Record<string, unknown>): ReviewExtractionDTO {
  return {
    extraction_id: row.extraction_id as string,
    candidate_type: row.candidate_type as string,
    candidate_key: row.candidate_key as string,
    ecosystem: row.ecosystem as string | null,
    status: row.status as string,
    created_at: row.created_at as string,
    candidate_payload: (row.candidate_payload as Record<string, unknown>) || {},
    evidence: parseEvidence(row.evidence as Json),
    lineage: parseLineage(row.lineage as Json),
    snapshot: parseSnapshot(row.snapshot as Json),
    confidence: parseConfidence(row.confidence as Json),
    latest_decision: parseLatestDecision(row.latest_decision as Json),
    edit_count: (row.edit_count as number) || 0,
    epistemics: parseEpistemics(row.epistemics as Json),
    provenance: {
      source_organization: null, // TODO: Join with organizations table
      submitted_by: null,
      verified_by: null,
      verified_at: null,
      sharing_status: 'pending_review',
    },
  }
}

// =============================================================================
// HOOK
// =============================================================================

export function useReviewExtractions(): UseReviewExtractionsResult {
  const [extractions, setExtractions] = useState<ReviewExtractionDTO[]>([])
  const [currentExtraction, setCurrentExtraction] = useState<ReviewExtractionDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch list of extractions from review_queue_view
   */
  const fetchExtractions = useCallback(async (filters?: ExtractionFilters) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('review_queue_view')
        .select('*')

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      } else {
        // Default to pending
        query = query.eq('status', 'pending')
      }

      if (filters?.ecosystem) {
        query = query.eq('ecosystem', filters.ecosystem)
      }

      if (filters?.candidateType) {
        query = query.eq('candidate_type', filters.candidateType)
      }

      // CRITICAL: Filter by organization for tenant isolation
      // In Admin view, this MUST be set to the user's organization
      if (filters?.organizationId) {
        query = query.eq('source_organization_id', filters.organizationId)
      }

      // Order and limit
      query = query
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 100)

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const dtos = (data || []).map(row => transformRowToDTO(row as Record<string, unknown>))
      setExtractions(dtos)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch extractions'
      setError(message)
      console.error('Error fetching extractions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Fetch single extraction by ID
   */
  const fetchExtractionById = useCallback(async (id: string): Promise<ReviewExtractionDTO | null> => {
    try {
      setLoadingDetail(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('review_queue_view')
        .select('*')
        .eq('extraction_id', id)
        .single()

      if (fetchError) throw fetchError

      const dto = transformRowToDTO(data as Record<string, unknown>)
      setCurrentExtraction(dto)
      return dto
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch extraction'
      setError(message)
      console.error('Error fetching extraction:', err)
      return null
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  /**
   * Record a review decision (accept, reject, etc.)
   */
  const recordDecision = useCallback(async (params: RecordReviewDecisionParams): Promise<string> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('record_review_decision', {
        p_extraction_id: params.p_extraction_id,
        p_decision: params.p_decision,
        p_reviewer_id: params.p_reviewer_id,
        p_rejection_category: params.p_rejection_category || null,
        p_decision_reason: params.p_decision_reason || null,
        p_human_confidence_override: params.p_human_confidence_override || null,
        p_confidence_override_reason: params.p_confidence_override_reason || null,
        p_source_flagged: params.p_source_flagged || false,
        p_source_flag_reason: params.p_source_flag_reason || null,
      })

      if (rpcError) throw rpcError

      // Refresh the list
      await fetchExtractions()

      return data as string
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record decision'
      throw new Error(message)
    }
  }, [fetchExtractions])

  /**
   * Record a payload edit (separate from decision)
   */
  const recordEdit = useCallback(async (params: RecordReviewEditParams): Promise<string> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('record_review_edit', {
        p_extraction_id: params.p_extraction_id,
        p_reviewer_id: params.p_reviewer_id,
        p_before_payload: params.p_before_payload,
        p_after_payload: params.p_after_payload,
        p_edit_reason: params.p_edit_reason || null,
        p_apply_to_extraction: params.p_apply_to_extraction ?? true,
      })

      if (rpcError) throw rpcError

      // Refresh current extraction if we're viewing it
      if (currentExtraction?.extraction_id === params.p_extraction_id) {
        await fetchExtractionById(params.p_extraction_id)
      }

      return data as string
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record edit'
      throw new Error(message)
    }
  }, [currentExtraction, fetchExtractionById])

  /**
   * Refresh the current list
   */
  const refresh = useCallback(async () => {
    await fetchExtractions()
  }, [fetchExtractions])

  // Initial fetch
  useEffect(() => {
    fetchExtractions()
  }, [fetchExtractions])

  // Subscribe to real-time changes
  useEffect(() => {
    const subscription = supabase
      .channel('staging_extractions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staging_extractions'
        },
        () => {
          fetchExtractions()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchExtractions])

  return {
    extractions,
    currentExtraction,
    loading,
    loadingDetail,
    error,
    fetchExtractions,
    fetchExtractionById,
    recordDecision,
    recordEdit,
    refresh,
  }
}
