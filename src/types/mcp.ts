/**
 * Type definitions for MCP Client integration
 *
 * The PROVES MCP server exposes tools for:
 * - Internal: search_knowledge, get_entity, list_entities, get_library_stats
 * - External: search_manufacturers, find_distributors, search_papers, etc.
 * - Source Registry: get_source_locations, get_hardware_info, find_conflicts
 * - Documentation: search_fprime_docs, search_proveskit_docs, get_datasheet_links
 */

// =============================================================================
// MCP PROTOCOL TYPES
// =============================================================================

export interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface MCPMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: MCPToolCall[];
  toolResults?: MCPToolResult[];
}

// =============================================================================
// PROVES MCP TOOL TYPES
// =============================================================================

// Internal Knowledge Search
export interface SearchKnowledgeParams {
  query: string;
  ecosystem?: 'fprime' | 'proveskit' | 'generic';
  entity_type?: 'component' | 'interface' | 'subsystem';
  include_pending?: boolean;
  limit?: number;
}

export interface SearchKnowledgeResult {
  query: string;
  entities: CoreEntity[];
  extractions: StagingExtraction[];
  total: number;
  error?: string;
}

export interface CoreEntity {
  id: string;
  entity_type: string;
  canonical_key: string;
  name: string;
  display_name: string;
  attributes: Record<string, unknown>;
  ecosystem: string;
  created_at: string;
}

export interface StagingExtraction {
  extraction_id: string;
  candidate_key: string;
  candidate_type: string;
  candidate_payload: Record<string, unknown>;
  confidence_score: number;
  status: string;
  ecosystem: string;
  evidence: Record<string, unknown>;
  created_at: string;
}

// External Search Tools
export interface SearchManufacturersParams {
  component_type: string;
  keywords?: string[];
}

export interface ManufacturerResult {
  query: string;
  keywords: string[];
  manufacturers: Manufacturer[];
  count: number;
  hint: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  url: string;
  products: string[];
  contact: string;
  relevance: number;
  matched_products: string[];
}

export interface FindDistributorsParams {
  part_number: string;
  manufacturer?: string;
}

export interface DistributorResult {
  part_number: string;
  manufacturer: string | null;
  distributors: Record<string, {
    name: string;
    search_url: string;
    notes: string;
  }>;
  recommendation: string;
  hint: string;
}

export interface SearchPapersParams {
  query: string;
  category?: string;
}

export interface PapersResult {
  query: string;
  search_url: string;
  category_search: string;
  relevant_categories: Record<string, string>;
  api_url: string;
  hint: string;
}

export interface LookupStandardsParams {
  topic: string;
}

export interface StandardsResult {
  topic: string;
  standards: {
    organization: string;
    url: string;
    documents: {
      id: string;
      title: string;
      topic: string;
    }[];
  }[];
  all_organizations: Record<string, string>;
  hint: string;
}

export interface FindAlternativesParams {
  component: string;
  specs?: Record<string, unknown>;
}

export interface AlternativesResult {
  component: string;
  found: boolean;
  description?: string;
  interface?: string;
  alternatives?: {
    part: string;
    manufacturer: string;
    notes: string;
  }[];
  search_suggestion?: string;
  search_queries?: Record<string, string>;
  hint?: string;
}

export interface WebSearchParams {
  query: string;
  context?: string;
}

export interface WebSearchResult {
  query: string;
  context: string;
  optimized_searches: Record<string, string>;
  google_search: string;
  hint: string;
}

// Source Registry Tools
export interface SourceLocationsParams {
  topic: string;
}

export interface SourceLocationsResult {
  topic: string;
  matching_topics: string[];
  paths: Record<string, string[]>;
  fprime: {
    repo: string;
    docs: string;
    tutorials: string;
  };
  proveskit: {
    repos: string[];
    docs: string;
  };
}

export interface HardwareInfoParams {
  hardware_name: string;
}

export interface HardwareInfoResult {
  hardware: string;
  info?: {
    i2c_address?: string;
    driver?: string;
    datasheet_url?: string;
    known_conflicts?: { component: string; reason: string; mitigation: string }[];
  };
  error?: string;
  available_hardware?: string[];
  hint?: string;
}

export interface ConflictsParams {
  component: string;
}

export interface ConflictsResult {
  component: string;
  conflicts: {
    source: string;
    target: string;
    reason: string;
    mitigation: string;
  }[];
  count: number;
  hardware_info: Record<string, unknown> | null;
}

// =============================================================================
// MCP CLIENT CONFIGURATION
// =============================================================================

export interface MCPClientConfig {
  /** Server URL for HTTP transport (default: http://localhost:8000) */
  serverUrl?: string;
  /** Transport type (default: streamable-http for browser) */
  transport?: 'stdio' | 'streamable-http';
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
}

export interface MCPConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  serverInfo?: {
    name: string;
    version: string;
    tools: string[];
  };
}

// =============================================================================
// CHAT CONTEXT TYPES
// =============================================================================

/**
 * Evidence source from search results
 */
export interface EvidenceSource {
  id: string;
  type: 'collective' | 'notebook' | 'external';
  title: string;
  sourceUrl?: string;
  sourceType: string;
  excerpt?: string;
  capturedAt?: string;
  confidence?: number;
}

/**
 * Aggregated evidence for an answer
 */
export interface AnswerEvidence {
  collectiveCount: number;
  notebookCount: number;
  externalCount: number;
  confidence: 'high' | 'medium' | 'low';
  freshnessLabel: string;
  sources: EvidenceSource[];
}

/**
 * Search scope configuration
 */
export interface SearchScope {
  includeCollective: boolean;
  includeNotebook: boolean;
  includeExternal: boolean;
  attachmentIds?: string[];
  missionFilter?: string;
  domainFilter?: string;
  timeFilter?: string;
}

/**
 * Query with context for the agent
 */
export interface AgentQuery {
  query: string;
  scope: SearchScope;
  conversationId: string;
  userId?: string;
}
