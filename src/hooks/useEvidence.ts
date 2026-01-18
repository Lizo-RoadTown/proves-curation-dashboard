/**
 * useEvidence - Hook for managing answer evidence
 *
 * Handles:
 * - Recording evidence for answers
 * - Loading evidence for messages
 * - Managing conversations
 */

import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  RecordAnswerParams,
  RecordEvidenceSource,
  EvidenceStripData,
} from '../types/evidence';
import { toEvidenceStripData } from '../types/evidence';

// =============================================================================
// TYPES
// =============================================================================

interface UseEvidenceResult {
  // Loading states
  loading: boolean;
  error: string | null;

  // Actions
  recordAnswer: (params: RecordAnswerParams) => Promise<string | null>;
  getEvidence: (messageId: string) => Promise<EvidenceStripData | null>;
  createConversation: (title?: string) => Promise<string | null>;
}

interface UseEvidenceOptions {
  userId?: string;
}

// =============================================================================
// HOOK
// =============================================================================

export function useEvidence({ userId }: UseEvidenceOptions = {}): UseEvidenceResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new conversation
   */
  const createConversation = useCallback(
    async (title?: string): Promise<string | null> => {
      if (!userId) {
        setError('User not authenticated');
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: rpcError } = await supabase.rpc('get_or_create_conversation', {
          p_user_id: userId,
          p_title: title || 'New Conversation',
        });

        if (rpcError) throw rpcError;

        return data as string;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create conversation';
        setError(message);
        console.error('Error creating conversation:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  /**
   * Record an answer with its evidence
   */
  const recordAnswer = useCallback(
    async (params: RecordAnswerParams): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);

        // 1. Add the message
        const { data: messageId, error: msgError } = await supabase.rpc('add_message', {
          p_conversation_id: params.conversation_id,
          p_role: 'assistant',
          p_content: params.content,
        });

        if (msgError) throw msgError;
        if (!messageId) throw new Error('Failed to create message');

        // 2. Record evidence sources
        if (params.sources.length > 0) {
          const sourcesJson = params.sources.map((s) => ({
            type: s.type,
            source_id: s.source_id || null,
            title: s.title,
            excerpt: s.excerpt || null,
            url: s.url || null,
            metadata: s.metadata || null,
            relevance_score: s.relevance_score || null,
          }));

          const { error: evidenceError } = await supabase.rpc('record_answer_evidence', {
            p_conversation_id: params.conversation_id,
            p_message_id: messageId,
            p_sources: sourcesJson,
          });

          if (evidenceError) {
            console.error('Error recording evidence:', evidenceError);
            // Don't fail the whole operation if evidence recording fails
          }
        }

        // 3. Record answer metadata
        const collectiveCount = params.sources.filter((s) => s.type === 'collective').length;
        const notebookCount = params.sources.filter((s) => s.type === 'notebook').length;

        const { error: metaError } = await supabase.from('answer_metadata').insert({
          message_id: messageId,
          collective_source_count: collectiveCount,
          notebook_source_count: notebookCount,
          confidence: params.confidence,
          freshness_days: params.freshness_days,
          model_provider: params.model_provider,
          model_name: params.model_name,
        });

        if (metaError) {
          console.error('Error recording metadata:', metaError);
          // Don't fail the whole operation
        }

        return messageId as string;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to record answer';
        setError(message);
        console.error('Error recording answer:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get evidence for a message (formatted for EvidenceStrip)
   */
  const getEvidence = useCallback(async (messageId: string): Promise<EvidenceStripData | null> => {
    try {
      setLoading(true);
      setError(null);

      // Fetch evidence
      const { data: evidence, error: evidenceError } = await supabase.rpc('get_answer_evidence', {
        p_message_id: messageId,
      });

      if (evidenceError) throw evidenceError;

      // Fetch metadata
      const { data: metadata, error: metaError } = await supabase
        .from('answer_metadata')
        .select('*')
        .eq('message_id', messageId)
        .single();

      if (metaError && metaError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is ok
        throw metaError;
      }

      // Convert to EvidenceStrip format
      return toEvidenceStripData(evidence || [], metadata || undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get evidence';
      setError(message);
      console.error('Error getting evidence:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    recordAnswer,
    getEvidence,
    createConversation,
  };
}

// =============================================================================
// UTILITY: Build evidence from search results
// =============================================================================

/**
 * Convert MCP search results to evidence sources
 */
export function searchResultsToEvidence(
  results: Array<{
    id: string;
    title: string;
    content?: string;
    url?: string;
    source_type?: string;
    captured_at?: string;
    relevance_score?: number;
  }>,
  type: 'collective' | 'notebook'
): RecordEvidenceSource[] {
  return results.map((r) => ({
    type,
    source_id: r.id,
    title: r.title,
    excerpt: r.content?.slice(0, 500),
    url: r.url,
    metadata: {
      source_type: r.source_type,
      captured_at: r.captured_at,
    },
    relevance_score: r.relevance_score,
  }));
}
