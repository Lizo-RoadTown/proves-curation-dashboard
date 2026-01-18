/**
 * useCurrentOrganization - Hook for user's organization context
 *
 * Uses get_user_organizations() RPC to fetch the current user's
 * organization memberships. Returns the primary org by default.
 *
 * For Admin views, all queries MUST be scoped to the current org.
 */

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// =============================================================================
// TYPES
// =============================================================================

export interface UserOrganization {
  org_id: string
  org_name: string
  org_slug: string
  org_color: string
  user_role: 'admin' | 'lead' | 'engineer' | 'researcher' | 'member'
  is_primary: boolean
}

export interface OrganizationStats {
  our_sources: number
  our_pending_reviews: number
  our_verified_entities: number
  our_contributors: number
  shared_total: number
  shared_from_us: number
  shared_from_others: number
}

interface UseCurrentOrganizationResult {
  // Current organization (primary by default)
  currentOrg: UserOrganization | null

  // All user's organizations
  organizations: UserOrganization[]

  // Stats for current org
  stats: OrganizationStats | null

  // Loading states
  loading: boolean
  loadingStats: boolean
  error: string | null

  // Actions
  selectOrganization: (orgId: string) => void
  refreshStats: () => Promise<void>
}

// =============================================================================
// HOOK
// =============================================================================

export function useCurrentOrganization(): UseCurrentOrganizationResult {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<UserOrganization[]>([])
  const [currentOrg, setCurrentOrg] = useState<UserOrganization | null>(null)
  const [stats, setStats] = useState<OrganizationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch user's organizations using the RPC function
   */
  const fetchOrganizations = useCallback(async () => {
    if (!user?.id) {
      setOrganizations([])
      setCurrentOrg(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('get_user_organizations', {
        p_user_id: user.id
      })

      if (rpcError) throw rpcError

      const orgs = (data || []) as UserOrganization[]
      setOrganizations(orgs)

      // Set primary org as current, or first if no primary
      const primary = orgs.find(o => o.is_primary) || orgs[0] || null
      setCurrentOrg(primary)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch organizations'
      setError(message)
      console.error('Error fetching organizations:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  /**
   * Fetch stats for the current organization
   */
  const fetchStats = useCallback(async () => {
    if (!currentOrg?.org_id) {
      setStats(null)
      return
    }

    try {
      setLoadingStats(true)

      const { data, error: rpcError } = await supabase.rpc('get_org_stats', {
        p_organization_id: currentOrg.org_id
      })

      if (rpcError) throw rpcError

      // RPC returns array with single row
      const statsData = Array.isArray(data) ? data[0] : data
      setStats(statsData as OrganizationStats)

    } catch (err) {
      console.error('Error fetching org stats:', err)
      // Don't set error for stats failure, just log it
    } finally {
      setLoadingStats(false)
    }
  }, [currentOrg?.org_id])

  /**
   * Select a different organization
   */
  const selectOrganization = useCallback((orgId: string) => {
    const org = organizations.find(o => o.org_id === orgId)
    if (org) {
      setCurrentOrg(org)
    }
  }, [organizations])

  /**
   * Refresh stats for current org
   */
  const refreshStats = useCallback(async () => {
    await fetchStats()
  }, [fetchStats])

  // Fetch organizations when user changes
  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  // Fetch stats when current org changes
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    currentOrg,
    organizations,
    stats,
    loading,
    loadingStats,
    error,
    selectOrganization,
    refreshStats,
  }
}
