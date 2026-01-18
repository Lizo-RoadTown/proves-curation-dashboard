/**
 * useSources - Hook for managing team sources (Admin extraction pipelines)
 *
 * Provides CRUD operations for team sources and crawl management.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  TeamSource,
  CrawlJob,
  IngestionStats,
  CreateSourceForm,
  TeamSourceType,
  SourceConfig,
} from '../types/sources';

// =============================================================================
// TYPES
// =============================================================================

interface UseSourcesResult {
  // Data
  sources: TeamSource[];
  recentJobs: CrawlJob[];
  stats: IngestionStats | null;

  // Loading states
  loading: boolean;
  jobsLoading: boolean;
  error: string | null;

  // Actions
  fetchSources: () => Promise<void>;
  fetchRecentJobs: (limit?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  createSource: (form: CreateSourceForm) => Promise<TeamSource | null>;
  updateSource: (id: string, updates: Partial<TeamSource>) => Promise<boolean>;
  deleteSource: (id: string) => Promise<boolean>;
  triggerCrawl: (sourceId: string) => Promise<string | null>;
  toggleSourceActive: (sourceId: string, isActive: boolean) => Promise<boolean>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useSources(): UseSourcesResult {
  const [sources, setSources] = useState<TeamSource[]>([]);
  const [recentJobs, setRecentJobs] = useState<CrawlJob[]>([]);
  const [stats, setStats] = useState<IngestionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all team sources
   */
  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('team_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setSources(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sources';
      setError(message);
      console.error('Error fetching sources:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch recent crawl jobs
   */
  const fetchRecentJobs = useCallback(async (limit = 20) => {
    try {
      setJobsLoading(true);

      const { data, error: fetchError } = await supabase
        .from('crawl_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      setRecentJobs(data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  /**
   * Fetch ingestion stats
   */
  const fetchStats = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase.rpc('get_ingestion_stats');

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Set default stats on error
      setStats({
        pending_jobs: 0,
        running_jobs: 0,
        completed_today: 0,
        failed_today: 0,
        total_sources: sources.length,
        active_sources: sources.filter((s) => s.is_active).length,
        total_items: 0,
      });
    }
  }, [sources]);

  /**
   * Create a new source
   */
  const createSource = useCallback(
    async (form: CreateSourceForm): Promise<TeamSource | null> => {
      try {
        setError(null);

        const { data, error: createError } = await supabase
          .from('team_sources')
          .insert({
            name: form.name,
            source_type: form.source_type,
            description: form.description,
            source_config: form.source_config,
            crawl_schedule: form.crawl_schedule,
            include_patterns: form.include_patterns,
            exclude_patterns: form.exclude_patterns || [
              '**/node_modules/**',
              '**/.git/**',
              '**/build/**',
            ],
          })
          .select()
          .single();

        if (createError) throw createError;

        // Update local state
        setSources((prev) => [data, ...prev]);

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create source';
        setError(message);
        console.error('Error creating source:', err);
        return null;
      }
    },
    []
  );

  /**
   * Update a source
   */
  const updateSource = useCallback(
    async (id: string, updates: Partial<TeamSource>): Promise<boolean> => {
      try {
        setError(null);

        const { error: updateError } = await supabase
          .from('team_sources')
          .update(updates)
          .eq('id', id);

        if (updateError) throw updateError;

        // Update local state
        setSources((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
        );

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update source';
        setError(message);
        console.error('Error updating source:', err);
        return false;
      }
    },
    []
  );

  /**
   * Delete a source
   */
  const deleteSource = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('team_sources')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Update local state
      setSources((prev) => prev.filter((s) => s.id !== id));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete source';
      setError(message);
      console.error('Error deleting source:', err);
      return false;
    }
  }, []);

  /**
   * Trigger a crawl for a source
   */
  const triggerCrawl = useCallback(
    async (sourceId: string): Promise<string | null> => {
      try {
        setError(null);

        const { data, error: triggerError } = await supabase.rpc('trigger_crawl', {
          p_source_id: sourceId,
          p_triggered_by: 'manual',
        });

        if (triggerError) throw triggerError;

        // Refresh jobs list
        await fetchRecentJobs();

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to trigger crawl';
        setError(message);
        console.error('Error triggering crawl:', err);
        return null;
      }
    },
    [fetchRecentJobs]
  );

  /**
   * Toggle source active state
   */
  const toggleSourceActive = useCallback(
    async (sourceId: string, isActive: boolean): Promise<boolean> => {
      return updateSource(sourceId, { is_active: isActive });
    },
    [updateSource]
  );

  // Initial data load
  useEffect(() => {
    fetchSources();
    fetchRecentJobs();
    fetchStats();
  }, [fetchSources, fetchRecentJobs, fetchStats]);

  return {
    sources,
    recentJobs,
    stats,
    loading,
    jobsLoading,
    error,
    fetchSources,
    fetchRecentJobs,
    fetchStats,
    createSource,
    updateSource,
    deleteSource,
    triggerCrawl,
    toggleSourceActive,
  };
}
