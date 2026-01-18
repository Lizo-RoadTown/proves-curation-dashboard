/**
 * useMissionControlData - Hooks for Mission Control instruments
 *
 * These hooks fetch SHARED data for Mission Control (all organizations visible).
 * Mission Control is a read-only, shared awareness room.
 *
 * Uses RPC functions created in migration 034:
 * - get_all_orgs_activity() for Heat Map
 * - get_pipeline_stats() for Pipeline Flow
 */

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// =============================================================================
// TYPES
// =============================================================================

export interface OrgActivity {
  org_id: string
  org_name: string
  org_slug: string
  org_color: string
  pending_reviews: number
  approvals_today: number
  rejections_today: number
  last_promotion: string | null
  total_contributed: number
}

export interface PipelineStageStats {
  stage: string
  count: number
  items_today: number
  items_this_hour: number
}

// =============================================================================
// HEAT MAP HOOK - All Organizations Activity
// =============================================================================

interface UseOrgActivityResult {
  organizations: OrgActivity[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useOrgActivity(): UseOrgActivityResult {
  const [organizations, setOrganizations] = useState<OrgActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('get_all_orgs_activity')

      if (rpcError) throw rpcError

      setOrganizations((data || []) as OrgActivity[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch org activity'
      setError(message)
      console.error('Error fetching org activity:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()

    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  return {
    organizations,
    loading,
    error,
    refresh,
  }
}

// =============================================================================
// PIPELINE STATS HOOK - Flow Visualization
// =============================================================================

interface UsePipelineStatsResult {
  stages: PipelineStageStats[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function usePipelineStats(): UsePipelineStatsResult {
  const [stages, setStages] = useState<PipelineStageStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('get_pipeline_stats')

      if (rpcError) throw rpcError

      setStages((data || []) as PipelineStageStats[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pipeline stats'
      setError(message)
      console.error('Error fetching pipeline stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()

    // Refresh every 15 seconds for live updates
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  return {
    stages,
    loading,
    error,
    refresh,
  }
}

// =============================================================================
// VALIDATION STATS HOOK - Today's Review Activity
// =============================================================================

interface ValidationStats {
  pendingReviews: number
  approvalsToday: number
  rejectionsToday: number
  avgReviewTimeMs: number | null
  lastPromotion: string | null
}

interface UseValidationStatsResult {
  stats: ValidationStats | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useValidationStats(): UseValidationStatsResult {
  const [stats, setStats] = useState<ValidationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Aggregate from staging_extractions
      const { data, error: fetchError } = await supabase
        .from('staging_extractions')
        .select('status, reviewed_at, created_at')

      if (fetchError) throw fetchError

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const pending = data?.filter(e => e.status === 'pending').length || 0
      const approvedToday = data?.filter(e =>
        e.status === 'accepted' &&
        e.reviewed_at &&
        new Date(e.reviewed_at) >= today
      ).length || 0
      const rejectedToday = data?.filter(e =>
        e.status === 'rejected' &&
        e.reviewed_at &&
        new Date(e.reviewed_at) >= today
      ).length || 0

      // Find last promotion
      const promotedItems = data?.filter(e =>
        e.status === 'accepted' && e.reviewed_at
      ).sort((a, b) =>
        new Date(b.reviewed_at!).getTime() - new Date(a.reviewed_at!).getTime()
      )

      const lastPromotion = promotedItems?.[0]?.reviewed_at || null

      // Calculate average review time (for items reviewed today)
      const reviewedToday = data?.filter(e =>
        e.reviewed_at &&
        new Date(e.reviewed_at) >= today &&
        e.created_at
      ) || []

      let avgReviewTimeMs: number | null = null
      if (reviewedToday.length > 0) {
        const totalMs = reviewedToday.reduce((sum, e) => {
          const created = new Date(e.created_at).getTime()
          const reviewed = new Date(e.reviewed_at!).getTime()
          return sum + (reviewed - created)
        }, 0)
        avgReviewTimeMs = totalMs / reviewedToday.length
      }

      setStats({
        pendingReviews: pending,
        approvalsToday: approvedToday,
        rejectionsToday: rejectedToday,
        avgReviewTimeMs,
        lastPromotion,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch validation stats'
      setError(message)
      console.error('Error fetching validation stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  return {
    stats,
    loading,
    error,
    refresh,
  }
}
