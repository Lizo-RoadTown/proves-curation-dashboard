import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Extraction = Database['public']['Tables']['staging_extractions']['Row']

export function useExtractions() {
  const [extractions, setExtractions] = useState<Extraction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchExtractions()

    // Subscribe to real-time changes
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
  }, [])

  async function fetchExtractions() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('staging_extractions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setExtractions(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch extractions')
      console.error('Error fetching extractions:', err)
    } finally {
      setLoading(false)
    }
  }

  async function approveExtraction(extractionId: string, reason?: string) {
    try {
      // Call the database function to record the decision
      const { error } = await supabase.rpc('record_human_decision', {
        p_extraction_id: extractionId,
        p_action_type: 'accept',
        p_actor_id: 'dashboard_user', // TODO: Replace with actual user ID from auth
        p_reason: reason || 'Approved via dashboard'
      })

      if (error) throw error

      // Update local state
      await fetchExtractions()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to approve extraction')
    }
  }

  async function rejectExtraction(extractionId: string, reason?: string) {
    try {
      // Call the database function to record the decision
      const { error } = await supabase.rpc('record_human_decision', {
        p_extraction_id: extractionId,
        p_action_type: 'reject',
        p_actor_id: 'dashboard_user', // TODO: Replace with actual user ID from auth
        p_reason: reason || 'Rejected via dashboard'
      })

      if (error) throw error

      // Update local state
      await fetchExtractions()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to reject extraction')
    }
  }

  return {
    extractions,
    loading,
    error,
    approveExtraction,
    rejectExtraction,
    refresh: fetchExtractions
  }
}
