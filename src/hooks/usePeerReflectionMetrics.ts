/**
 * Peer Reflection Metrics Hook
 *
 * Read-only hook for fetching peer reflection analyzer metrics.
 * This hook ONLY reads data - it never writes to any tables.
 *
 * Metrics computed:
 * - Confidence calibration (claimed vs actual acceptance)
 * - Rejection trends by type and ecosystem
 * - Lineage verification failures
 * - Extraction volume over time
 * - Reviewer patterns for baseline
 */

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// =============================================================================
// Types
// =============================================================================

export interface ConfidenceCalibration {
  ecosystem: string
  week: string
  extraction_count: number
  avg_claimed_confidence: number
  actual_acceptance_rate: number
  calibration_error: number
  confidence_stddev: number | null
}

export interface RejectionTrend {
  ecosystem: string
  candidate_type: string
  week: string
  rejection_count: number
  total_count: number
  rejection_rate: number
  top_rejection_reason: string | null
}

export interface LineageFailure {
  extraction_id: string
  candidate_key: string
  candidate_type: string
  ecosystem: string
  confidence_score: number | null
  created_at: string
  status: string
  lineage_verified: boolean | null
  lineage_confidence: number | null
  raw_evidence: string | null
  snapshot_id: string | null
  source_url: string | null
  fetch_timestamp: string | null
}

export interface ExtractionVolume {
  ecosystem: string
  day: string
  total_extractions: number
  pending_count: number
  accepted_count: number
  rejected_count: number
  avg_confidence: number | null
}

export interface ReviewerPattern {
  reviewer_id: string
  week: string
  decisions_made: number
  approvals: number
  rejections: number
  approval_rate: number
  avg_approved_confidence: number | null
  avg_rejected_confidence: number | null
}

export interface EntityTypePerformance {
  candidate_type: string
  ecosystem: string
  total_extractions: number
  accepted_count: number
  rejected_count: number
  acceptance_rate: number | null
  avg_confidence: number | null
  avg_accepted_confidence: number | null
  avg_rejected_confidence: number | null
}

export interface CalibrationDriftAlert {
  ecosystem: string
  week: string
  extraction_count: number
  calibration_error: number
  alert_level: 'critical' | 'warning' | 'ok'
  drift_direction: 'over_confident' | 'under_confident' | 'well_calibrated'
}

export interface PeerReflectionMetricsSummary {
  total_extractions: number
  total_accepted: number
  total_rejected: number
  overall_acceptance_rate: number
  avg_calibration_error: number
  lineage_failure_count: number
  active_drift_alerts: number
  timestamp: string
}

export interface MetricsFilter {
  ecosystem?: string
  startDate?: string
  endDate?: string
  candidateType?: string
}

// =============================================================================
// Hook
// =============================================================================

export function usePeerReflectionMetrics(filter?: MetricsFilter) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Metrics state
  const [confidenceCalibration, setConfidenceCalibration] = useState<ConfidenceCalibration[]>([])
  const [rejectionTrends, setRejectionTrends] = useState<RejectionTrend[]>([])
  const [lineageFailures, setLineageFailures] = useState<LineageFailure[]>([])
  const [extractionVolume, setExtractionVolume] = useState<ExtractionVolume[]>([])
  const [reviewerPatterns, setReviewerPatterns] = useState<ReviewerPattern[]>([])
  const [entityPerformance, setEntityPerformance] = useState<EntityTypePerformance[]>([])
  const [driftAlerts, setDriftAlerts] = useState<CalibrationDriftAlert[]>([])
  const [summary, setSummary] = useState<PeerReflectionMetricsSummary | null>(null)

  // =============================================================================
  // Fetch Functions (READ ONLY)
  // =============================================================================

  const fetchConfidenceCalibration = useCallback(async () => {
    try {
      let query = supabase
        .from('v_confidence_calibration')
        .select('*')
        .order('week', { ascending: false })
        .limit(52) // Last year of weeks

      if (filter?.ecosystem) {
        query = query.eq('ecosystem', filter.ecosystem)
      }

      const { data, error } = await query

      if (error) {
        // View might not exist yet - compute from staging_extractions
        console.warn('v_confidence_calibration view not available, computing from base table')
        return await computeConfidenceCalibrationFallback()
      }

      setConfidenceCalibration(data || [])
      return data
    } catch (err) {
      console.error('Error fetching confidence calibration:', err)
      return []
    }
  }, [filter?.ecosystem])

  // Fallback computation if views don't exist yet
  const computeConfidenceCalibrationFallback = async () => {
    try {
      const { data, error } = await supabase
        .from('staging_extractions')
        .select('ecosystem, created_at, confidence_score, status')
        .in('status', ['accepted', 'rejected'])
        .not('confidence_score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error

      // Group by week and ecosystem
      const grouped = new Map<string, {
        ecosystem: string
        week: string
        scores: number[]
        accepted: number
        total: number
      }>()

      for (const row of data || []) {
        const weekStart = new Date(row.created_at)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekKey = `${row.ecosystem}-${weekStart.toISOString().split('T')[0]}`

        if (!grouped.has(weekKey)) {
          grouped.set(weekKey, {
            ecosystem: row.ecosystem || 'generic',
            week: weekStart.toISOString().split('T')[0],
            scores: [],
            accepted: 0,
            total: 0
          })
        }

        const entry = grouped.get(weekKey)!
        entry.scores.push(row.confidence_score!)
        entry.total++
        if (row.status === 'accepted') entry.accepted++
      }

      const results: ConfidenceCalibration[] = Array.from(grouped.values()).map(g => ({
        ecosystem: g.ecosystem,
        week: g.week,
        extraction_count: g.total,
        avg_claimed_confidence: g.scores.reduce((a, b) => a + b, 0) / g.scores.length,
        actual_acceptance_rate: g.accepted / g.total,
        calibration_error: (g.scores.reduce((a, b) => a + b, 0) / g.scores.length) - (g.accepted / g.total),
        confidence_stddev: null
      }))

      setConfidenceCalibration(results)
      return results
    } catch (err) {
      console.error('Error computing calibration fallback:', err)
      return []
    }
  }

  const fetchRejectionTrends = useCallback(async () => {
    try {
      let query = supabase
        .from('v_rejection_trend')
        .select('*')
        .order('week', { ascending: false })
        .limit(100)

      if (filter?.ecosystem) {
        query = query.eq('ecosystem', filter.ecosystem)
      }
      if (filter?.candidateType) {
        query = query.eq('candidate_type', filter.candidateType)
      }

      const { data, error } = await query

      if (error) {
        console.warn('v_rejection_trend view not available')
        setRejectionTrends([])
        return []
      }

      setRejectionTrends(data || [])
      return data
    } catch (err) {
      console.error('Error fetching rejection trends:', err)
      return []
    }
  }, [filter?.ecosystem, filter?.candidateType])

  const fetchLineageFailures = useCallback(async () => {
    try {
      let query = supabase
        .from('v_lineage_failures')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter?.ecosystem) {
        query = query.eq('ecosystem', filter.ecosystem)
      }

      const { data, error } = await query

      if (error) {
        console.warn('v_lineage_failures view not available')
        setLineageFailures([])
        return []
      }

      setLineageFailures(data || [])
      return data
    } catch (err) {
      console.error('Error fetching lineage failures:', err)
      return []
    }
  }, [filter?.ecosystem])

  const fetchExtractionVolume = useCallback(async () => {
    try {
      let query = supabase
        .from('v_extraction_volume')
        .select('*')
        .order('day', { ascending: false })
        .limit(90) // Last 90 days

      if (filter?.ecosystem) {
        query = query.eq('ecosystem', filter.ecosystem)
      }

      const { data, error } = await query

      if (error) {
        console.warn('v_extraction_volume view not available, computing fallback')
        return await computeVolumeFallback()
      }

      setExtractionVolume(data || [])
      return data
    } catch (err) {
      console.error('Error fetching extraction volume:', err)
      return []
    }
  }, [filter?.ecosystem])

  const computeVolumeFallback = async () => {
    try {
      const { data, error } = await supabase
        .from('staging_extractions')
        .select('ecosystem, created_at, status, confidence_score')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error

      const grouped = new Map<string, ExtractionVolume>()

      for (const row of data || []) {
        const day = row.created_at.split('T')[0]
        const key = `${row.ecosystem}-${day}`

        if (!grouped.has(key)) {
          grouped.set(key, {
            ecosystem: row.ecosystem || 'generic',
            day,
            total_extractions: 0,
            pending_count: 0,
            accepted_count: 0,
            rejected_count: 0,
            avg_confidence: null
          })
        }

        const entry = grouped.get(key)!
        entry.total_extractions++
        if (row.status === 'pending') entry.pending_count++
        if (row.status === 'accepted') entry.accepted_count++
        if (row.status === 'rejected') entry.rejected_count++
      }

      const results = Array.from(grouped.values())
      setExtractionVolume(results)
      return results
    } catch (err) {
      console.error('Error computing volume fallback:', err)
      return []
    }
  }

  const fetchReviewerPatterns = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('v_reviewer_patterns')
        .select('*')
        .order('week', { ascending: false })
        .limit(100)

      if (error) {
        console.warn('v_reviewer_patterns view not available')
        setReviewerPatterns([])
        return []
      }

      setReviewerPatterns(data || [])
      return data
    } catch (err) {
      console.error('Error fetching reviewer patterns:', err)
      return []
    }
  }, [])

  const fetchEntityPerformance = useCallback(async () => {
    try {
      let query = supabase
        .from('v_entity_type_performance')
        .select('*')
        .order('total_extractions', { ascending: false })

      if (filter?.ecosystem) {
        query = query.eq('ecosystem', filter.ecosystem)
      }

      const { data, error } = await query

      if (error) {
        console.warn('v_entity_type_performance view not available')
        setEntityPerformance([])
        return []
      }

      setEntityPerformance(data || [])
      return data
    } catch (err) {
      console.error('Error fetching entity performance:', err)
      return []
    }
  }, [filter?.ecosystem])

  const fetchDriftAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('v_calibration_drift_alert')
        .select('*')
        .in('alert_level', ['critical', 'warning'])
        .order('week', { ascending: false })
        .limit(20)

      if (error) {
        console.warn('v_calibration_drift_alert view not available')
        setDriftAlerts([])
        return []
      }

      setDriftAlerts(data || [])
      return data
    } catch (err) {
      console.error('Error fetching drift alerts:', err)
      return []
    }
  }, [])

  const computeSummary = useCallback(async () => {
    try {
      // Fetch basic counts from staging_extractions
      const { data: statusCounts, error: statusError } = await supabase
        .from('staging_extractions')
        .select('status')

      if (statusError) throw statusError

      const total = statusCounts?.length || 0
      const accepted = statusCounts?.filter(r => r.status === 'accepted').length || 0
      const rejected = statusCounts?.filter(r => r.status === 'rejected').length || 0

      // Calculate average calibration error from recent data
      const avgCalibError = confidenceCalibration.length > 0
        ? confidenceCalibration.slice(0, 4).reduce((sum, c) => sum + Math.abs(c.calibration_error), 0) / Math.min(4, confidenceCalibration.length)
        : 0

      const summaryData: PeerReflectionMetricsSummary = {
        total_extractions: total,
        total_accepted: accepted,
        total_rejected: rejected,
        overall_acceptance_rate: total > 0 ? (accepted / (accepted + rejected)) * 100 : 0,
        avg_calibration_error: avgCalibError,
        lineage_failure_count: lineageFailures.length,
        active_drift_alerts: driftAlerts.filter(a => a.alert_level === 'critical').length,
        timestamp: new Date().toISOString()
      }

      setSummary(summaryData)
      return summaryData
    } catch (err) {
      console.error('Error computing summary:', err)
      return null
    }
  }, [confidenceCalibration, lineageFailures, driftAlerts])

  // =============================================================================
  // Fetch All Data
  // =============================================================================

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        fetchConfidenceCalibration(),
        fetchRejectionTrends(),
        fetchLineageFailures(),
        fetchExtractionVolume(),
        fetchReviewerPatterns(),
        fetchEntityPerformance(),
        fetchDriftAlerts()
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
    } finally {
      setLoading(false)
    }
  }, [
    fetchConfidenceCalibration,
    fetchRejectionTrends,
    fetchLineageFailures,
    fetchExtractionVolume,
    fetchReviewerPatterns,
    fetchEntityPerformance,
    fetchDriftAlerts
  ])

  // Update summary after metrics are loaded
  useEffect(() => {
    if (!loading && confidenceCalibration.length >= 0) {
      computeSummary()
    }
  }, [loading, confidenceCalibration, lineageFailures, driftAlerts, computeSummary])

  // Initial fetch
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // =============================================================================
  // Return (READ-ONLY interface)
  // =============================================================================

  return {
    // Loading state
    loading,
    error,

    // Metric data (all read-only)
    confidenceCalibration,
    rejectionTrends,
    lineageFailures,
    extractionVolume,
    reviewerPatterns,
    entityPerformance,
    driftAlerts,
    summary,

    // Refresh function
    refresh: fetchAll,

    // Individual fetch functions for lazy loading
    fetchConfidenceCalibration,
    fetchRejectionTrends,
    fetchLineageFailures,
    fetchExtractionVolume,
    fetchReviewerPatterns,
    fetchEntityPerformance,
    fetchDriftAlerts
  }
}

// =============================================================================
// Utility: Compute specific metric on demand
// =============================================================================

export async function computeMetric(
  metricName: 'confidence_calibration' | 'rejection_trend' | 'lineage_failures' | 'volume',
  filter?: MetricsFilter
): Promise<unknown> {
  switch (metricName) {
    case 'confidence_calibration': {
      let query = supabase
        .from('v_confidence_calibration')
        .select('*')
        .order('week', { ascending: false })

      if (filter?.ecosystem) query = query.eq('ecosystem', filter.ecosystem)

      const { data, error } = await query
      if (error) throw error
      return data
    }

    case 'rejection_trend': {
      let query = supabase
        .from('v_rejection_trend')
        .select('*')
        .order('week', { ascending: false })

      if (filter?.ecosystem) query = query.eq('ecosystem', filter.ecosystem)
      if (filter?.candidateType) query = query.eq('candidate_type', filter.candidateType)

      const { data, error } = await query
      if (error) throw error
      return data
    }

    case 'lineage_failures': {
      let query = supabase
        .from('v_lineage_failures')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter?.ecosystem) query = query.eq('ecosystem', filter.ecosystem)

      const { data, error } = await query
      if (error) throw error
      return data
    }

    case 'volume': {
      let query = supabase
        .from('v_extraction_volume')
        .select('*')
        .order('day', { ascending: false })

      if (filter?.ecosystem) query = query.eq('ecosystem', filter.ecosystem)

      const { data, error } = await query
      if (error) throw error
      return data
    }

    default:
      throw new Error(`Unknown metric: ${metricName}`)
  }
}

// =============================================================================
// Utility: Get evidence for a specific extraction
// =============================================================================

export async function getExtractionEvidence(extractionId: string) {
  const { data, error } = await supabase
    .from('staging_extractions')
    .select(`
      extraction_id,
      candidate_key,
      candidate_type,
      candidate_payload,
      evidence,
      confidence_score,
      status,
      ecosystem,
      created_at,
      snapshot_id,
      review_notes
    `)
    .eq('extraction_id', extractionId)
    .single()

  if (error) throw error
  return data
}

// =============================================================================
// Utility: Get related extractions for drill-down
// =============================================================================

export async function getRelatedExtractions(
  field: 'ecosystem' | 'candidate_type' | 'week',
  value: string,
  limit: number = 20
) {
  let query = supabase
    .from('staging_extractions')
    .select('extraction_id, candidate_key, candidate_type, ecosystem, confidence_score, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (field === 'ecosystem') {
    query = query.eq('ecosystem', value)
  } else if (field === 'candidate_type') {
    query = query.eq('candidate_type', value)
  } else if (field === 'week') {
    // Filter by week start date
    const weekStart = new Date(value)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    query = query
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString())
  }

  const { data, error } = await query
  if (error) throw error
  return data
}
