// Database types generated from Supabase schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Agent oversight types
export type AgentCapabilityType =
  | 'prompt_update'
  | 'threshold_change'
  | 'method_improvement'
  | 'tool_configuration'
  | 'ontology_expansion'
  | 'validation_rule'

export type ProposalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'auto_approved'
  | 'implemented'
  | 'reverted'

export interface Database {
  public: {
    Tables: {
      staging_extractions: {
        Row: {
          extraction_id: string
          candidate_key: string
          candidate_type: string
          candidate_payload: Json
          snapshot_id: string | null
          pipeline_run_id: string | null
          confidence_score: number | null
          status: 'pending' | 'accepted' | 'rejected' | 'needs_context' | 'merged' | 'flagged'
          evidence: Json | null
          ecosystem: 'fprime' | 'proveskit' | 'generic' | null
          created_at: string
          updated_at: string
          reviewed_by: string | null
          reviewed_at: string | null
          review_decision: 'approve' | 'reject' | 'modified' | null
          review_notes: string | null
          current_revision: number | null
          latest_decision_id: string | null
          assigned_to: string | null
          promoted_at: string | null
          promoted_to_entity_id: string | null
          promotion_action: 'created' | 'merged' | 'skipped' | 'error' | null
          promotion_error: string | null
        }
        Insert: {
          extraction_id?: string
          candidate_key: string
          candidate_type: string
          candidate_payload: Json
          snapshot_id?: string | null
          pipeline_run_id?: string | null
          confidence_score?: number | null
          status?: 'pending' | 'accepted' | 'rejected' | 'needs_context' | 'merged' | 'flagged'
          evidence?: Json | null
          ecosystem?: 'fprime' | 'proveskit' | 'generic' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'rejected' | 'needs_context' | 'merged' | 'flagged'
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_decision?: 'approve' | 'reject' | 'modified' | null
          review_notes?: string | null
        }
      }
      validation_decisions: {
        Row: {
          decision_id: string
          extraction_id: string
          decision: 'accept' | 'reject' | 'needs_more_evidence' | 'defer' | 'merge' | 'edit' | 'flag_for_review' | 'request_more_evidence'
          decided_by: string
          decider_type: 'human' | 'agent'
          decision_reason: string | null
          decided_at: string
          before_payload: Json | null
          after_payload: Json | null
          patch: Json | null
          source: string | null
        }
        Insert: {
          decision_id?: string
          extraction_id: string
          decision: 'accept' | 'reject' | 'needs_more_evidence' | 'defer' | 'merge' | 'edit' | 'flag_for_review' | 'request_more_evidence'
          decided_by: string
          decider_type?: 'human' | 'agent'
          decision_reason?: string | null
          decided_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          institution: string
          contact_email: string
          created_at: string
          updated_at: string
          max_concurrent_claims: number
          claim_timeout_hours: number
          total_extractions_assigned: number
          total_approved: number
          total_rejected: number
        }
      }
      batch_claims: {
        Row: {
          id: string
          team_id: string
          claimed_by: string
          batch_size: number
          extraction_ids: string[]
          claimed_at: string
          expires_at: string
          completed_at: string | null
          reviewed_count: number
          approved_count: number
          rejected_count: number
          status: 'active' | 'completed' | 'expired' | 'released'
        }
      }
      agent_capabilities: {
        Row: {
          id: string
          agent_name: string
          capability_type: AgentCapabilityType
          trust_score: number
          total_proposals: number
          approved_count: number
          rejected_count: number
          auto_approved_count: number
          successful_implementations: number
          failed_implementations: number
          auto_approve_threshold: number
          requires_review: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Update: {
          trust_score?: number
          auto_approve_threshold?: number
          requires_review?: boolean
          description?: string | null
        }
      }
      agent_proposals: {
        Row: {
          id: string
          capability_id: string
          title: string
          proposed_change: Json
          rationale: string
          predicted_impact: string | null
          supporting_evidence: Json | null
          affected_extraction_ids: string[] | null
          status: ProposalStatus
          auto_applied: boolean
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          implemented_at: string | null
          implementation_details: Json | null
          actual_impact: string | null
          success_measured: boolean
          success_score: number | null
          measurement_details: Json | null
          measured_at: string | null
          reverted_at: string | null
          revert_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          capability_id: string
          title: string
          proposed_change: Json
          rationale: string
          predicted_impact?: string | null
          supporting_evidence?: Json | null
          affected_extraction_ids?: string[] | null
        }
        Update: {
          status?: ProposalStatus
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          implemented_at?: string | null
          actual_impact?: string | null
          success_measured?: boolean
          success_score?: number | null
        }
      }
      agent_trust_history: {
        Row: {
          id: string
          capability_id: string
          previous_score: number | null
          new_score: number | null
          change_reason: string
          proposal_id: string | null
          changed_by: string | null
          created_at: string
        }
      }
    }
    Views: {
      extractions_awaiting_review: {
        Row: {
          extraction_id: string
          candidate_key: string
          candidate_type: string
          confidence_score: number | null
          created_at: string
          assigned_to: string | null
          requires_mandatory_review: boolean | null
          current_revision: number | null
          hours_waiting: number | null
          last_action: string | null
          last_actor: string | null
          last_action_time: string | null
        }
      }
    }
    Functions: {
      record_human_decision: {
        Args: {
          p_extraction_id: string
          p_action_type: string
          p_actor_id?: string
          p_reason?: string
          p_before_payload?: Json
          p_after_payload?: Json
          p_webhook_source?: string
        }
        Returns: string
      }
    }
  }
}
