/**
 * useAttachments - Hook for managing user attachments
 *
 * Handles:
 * - Fetching attachments for a conversation
 * - Attaching/detaching resources
 * - Getting recent attachments
 * - Checking provider connections
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  UserAttachment,
  AttachResourceParams,
  RecentAttachment,
  ProviderConnection,
  AttachmentProvider,
} from '../types/attachments';

// =============================================================================
// TYPES
// =============================================================================

interface UseAttachmentsResult {
  // Data
  attachments: UserAttachment[];
  recentAttachments: RecentAttachment[];
  connections: ProviderConnection[];

  // Loading states
  loading: boolean;
  loadingRecent: boolean;
  error: string | null;

  // Actions
  attachResource: (params: AttachResourceParams) => Promise<string | null>;
  detachResource: (attachmentId: string) => Promise<boolean>;
  refreshAttachments: () => Promise<void>;
  checkProviderConnection: (provider: AttachmentProvider) => Promise<boolean>;
}

interface UseAttachmentsOptions {
  conversationId: string;
  userId?: string;
  teamId?: string;
}

// =============================================================================
// HOOK
// =============================================================================

export function useAttachments({
  conversationId,
  userId,
  teamId,
}: UseAttachmentsOptions): UseAttachmentsResult {
  const [attachments, setAttachments] = useState<UserAttachment[]>([]);
  const [recentAttachments, setRecentAttachments] = useState<RecentAttachment[]>([]);
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch attachments for the current conversation
   */
  const fetchAttachments = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_attachments')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAttachments(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch attachments';
      setError(message);
      console.error('Error fetching attachments:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  /**
   * Fetch recent attachments across all conversations
   */
  const fetchRecentAttachments = useCallback(async () => {
    try {
      setLoadingRecent(true);

      const { data, error: fetchError } = await supabase
        .rpc('get_recent_attachments', { p_user_id: userId, p_limit: 10 });

      if (fetchError) throw fetchError;

      setRecentAttachments(data || []);
    } catch (err) {
      console.error('Error fetching recent attachments:', err);
      // Don't set error - this is secondary data
    } finally {
      setLoadingRecent(false);
    }
  }, [userId]);

  /**
   * Check which providers the user has connected
   */
  const checkProviderConnections = useCallback(async () => {
    const providers: AttachmentProvider[] = ['github', 'google_drive'];
    const newConnections: ProviderConnection[] = [];

    for (const provider of providers) {
      const { data } = await supabase
        .rpc('has_provider_connection', { p_user_id: userId, p_provider: provider });

      newConnections.push({
        provider,
        connected: !!data,
      });
    }

    setConnections(newConnections);
  }, [userId]);

  /**
   * Attach a resource to the current conversation
   */
  const attachResource = useCallback(
    async (params: AttachResourceParams): Promise<string | null> => {
      if (!userId) {
        setError('User not authenticated');
        return null;
      }

      try {
        setError(null);

        const { data, error: rpcError } = await supabase.rpc('attach_resource', {
          p_user_id: userId,
          p_team_id: teamId || null,
          p_conversation_id: params.conversation_id,
          p_provider: params.provider,
          p_resource_type: params.resource_type,
          p_resource_id: params.resource_id,
          p_resource_path: params.resource_path || null,
          p_display_name: params.display_name,
          p_ref: params.ref || null,
          p_provider_metadata: params.provider_metadata || null,
        });

        if (rpcError) throw rpcError;

        // Refresh attachments list
        await fetchAttachments();

        return data as string;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to attach resource';
        setError(message);
        console.error('Error attaching resource:', err);
        return null;
      }
    },
    [userId, teamId, fetchAttachments]
  );

  /**
   * Detach a resource from the conversation (soft-delete)
   */
  const detachResource = useCallback(
    async (attachmentId: string): Promise<boolean> => {
      if (!userId) {
        setError('User not authenticated');
        return false;
      }

      try {
        setError(null);

        const { data, error: rpcError } = await supabase.rpc('detach_resource', {
          p_user_id: userId,
          p_attachment_id: attachmentId,
        });

        if (rpcError) throw rpcError;

        // Refresh attachments list
        await fetchAttachments();

        return data as boolean;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to detach resource';
        setError(message);
        console.error('Error detaching resource:', err);
        return false;
      }
    },
    [userId, fetchAttachments]
  );

  /**
   * Check if a specific provider is connected
   */
  const checkProviderConnection = useCallback(
    async (provider: AttachmentProvider): Promise<boolean> => {
      if (!userId) return false;

      const { data } = await supabase.rpc('has_provider_connection', {
        p_user_id: userId,
        p_provider: provider,
      });

      return !!data;
    },
    [userId]
  );

  /**
   * Refresh attachments
   */
  const refreshAttachments = useCallback(async () => {
    await fetchAttachments();
  }, [fetchAttachments]);

  // Initial fetch
  useEffect(() => {
    if (conversationId) {
      fetchAttachments();
    }
  }, [conversationId, fetchAttachments]);

  // Fetch recent attachments on mount
  useEffect(() => {
    if (userId) {
      fetchRecentAttachments();
      checkProviderConnections();
    }
  }, [userId, fetchRecentAttachments, checkProviderConnections]);

  return {
    attachments,
    recentAttachments,
    connections,
    loading,
    loadingRecent,
    error,
    attachResource,
    detachResource,
    refreshAttachments,
    checkProviderConnection,
  };
}
