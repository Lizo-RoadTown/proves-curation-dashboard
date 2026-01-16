import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database, ProposalStatus } from '../types/database'

type AgentCapability = Database['public']['Tables']['agent_capabilities']['Row']
type AgentProposal = Database['public']['Tables']['agent_proposals']['Row']
type TrustHistory = Database['public']['Tables']['agent_trust_history']['Row']

// Extended proposal with capability info
export interface ProposalWithCapability extends AgentProposal {
  capability?: AgentCapability
}

export function useAgentOversight() {
  const [capabilities, setCapabilities] = useState<AgentCapability[]>([])
  const [proposals, setProposals] = useState<ProposalWithCapability[]>([])
  const [trustHistory, setTrustHistory] = useState<TrustHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAll()

    // Subscribe to real-time changes
    const capabilitiesSub = supabase
      .channel('agent_capabilities_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_capabilities'
      }, () => fetchCapabilities())
      .subscribe()

    const proposalsSub = supabase
      .channel('agent_proposals_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_proposals'
      }, () => fetchProposals())
      .subscribe()

    return () => {
      capabilitiesSub.unsubscribe()
      proposalsSub.unsubscribe()
    }
  }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([
      fetchCapabilities(),
      fetchProposals(),
      fetchTrustHistory()
    ])
    setLoading(false)
  }

  async function fetchCapabilities() {
    try {
      const { data, error } = await supabase
        .from('agent_capabilities')
        .select('*')
        .order('agent_name')
        .order('capability_type')

      if (error) throw error
      setCapabilities(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch capabilities')
      console.error('Error fetching capabilities:', err)
    }
  }

  async function fetchProposals() {
    try {
      // Fetch proposals with their capability info
      const { data: proposalsData, error: proposalsError } = await supabase
        .from('agent_proposals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (proposalsError) throw proposalsError

      // Fetch capabilities to join
      const { data: capsData } = await supabase
        .from('agent_capabilities')
        .select('*')

      const capsMap = new Map(capsData?.map(c => [c.id, c]) || [])

      const proposalsWithCaps: ProposalWithCapability[] = (proposalsData || []).map(p => ({
        ...p,
        capability: capsMap.get(p.capability_id)
      }))

      setProposals(proposalsWithCaps)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch proposals')
      console.error('Error fetching proposals:', err)
    }
  }

  async function fetchTrustHistory() {
    try {
      const { data, error } = await supabase
        .from('agent_trust_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setTrustHistory(data || [])
    } catch (err) {
      console.error('Error fetching trust history:', err)
    }
  }

  async function approveProposal(proposalId: string, notes?: string) {
    try {
      const { error } = await supabase
        .from('agent_proposals')
        .update({
          status: 'approved' as ProposalStatus,
          reviewed_by: 'dashboard_user', // TODO: Use actual auth user
          reviewed_at: new Date().toISOString(),
          review_notes: notes || 'Approved via dashboard'
        })
        .eq('id', proposalId)

      if (error) throw error
      await fetchAll()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to approve proposal')
    }
  }

  async function rejectProposal(proposalId: string, notes?: string) {
    try {
      const { error } = await supabase
        .from('agent_proposals')
        .update({
          status: 'rejected' as ProposalStatus,
          reviewed_by: 'dashboard_user',
          reviewed_at: new Date().toISOString(),
          review_notes: notes || 'Rejected via dashboard'
        })
        .eq('id', proposalId)

      if (error) throw error
      await fetchAll()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to reject proposal')
    }
  }

  async function markImplemented(proposalId: string, details?: object) {
    try {
      const { error } = await supabase
        .from('agent_proposals')
        .update({
          status: 'implemented' as ProposalStatus,
          implemented_at: new Date().toISOString(),
          implementation_details: details || null
        })
        .eq('id', proposalId)

      if (error) throw error
      await fetchAll()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to mark as implemented')
    }
  }

  async function recordImpact(
    proposalId: string,
    successScore: number,
    actualImpact: string,
    details?: object
  ) {
    try {
      const { error } = await supabase
        .from('agent_proposals')
        .update({
          success_measured: true,
          success_score: successScore,
          actual_impact: actualImpact,
          measurement_details: details || null,
          measured_at: new Date().toISOString()
        })
        .eq('id', proposalId)

      if (error) throw error
      await fetchAll()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to record impact')
    }
  }

  async function updateCapabilitySettings(
    capabilityId: string,
    settings: {
      auto_approve_threshold?: number
      requires_review?: boolean
    }
  ) {
    try {
      const { error } = await supabase
        .from('agent_capabilities')
        .update(settings)
        .eq('id', capabilityId)

      if (error) throw error
      await fetchCapabilities()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update settings')
    }
  }

  // Computed values
  const pendingProposals = proposals.filter(p => p.status === 'pending')
  const autoApprovedProposals = proposals.filter(p => p.status === 'auto_approved')
  const implementedProposals = proposals.filter(p => p.status === 'implemented')

  const capabilitiesByAgent = capabilities.reduce((acc, cap) => {
    if (!acc[cap.agent_name]) acc[cap.agent_name] = []
    acc[cap.agent_name].push(cap)
    return acc
  }, {} as Record<string, AgentCapability[]>)

  return {
    // Data
    capabilities,
    proposals,
    trustHistory,
    loading,
    error,

    // Computed
    pendingProposals,
    autoApprovedProposals,
    implementedProposals,
    capabilitiesByAgent,

    // Actions
    approveProposal,
    rejectProposal,
    markImplemented,
    recordImpact,
    updateCapabilitySettings,
    refresh: fetchAll
  }
}
