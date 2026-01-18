/**
 * useMCP - Hook for interacting with the PROVES MCP Server
 *
 * Provides:
 * - Connection state management
 * - Tool invocation with typed results
 * - Streaming support for chat responses
 * - Error handling and retry logic
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  MCPClientConfig,
  MCPConnectionState,
  SearchKnowledgeParams,
  SearchKnowledgeResult,
  SearchManufacturersParams,
  ManufacturerResult,
  FindDistributorsParams,
  DistributorResult,
  SearchPapersParams,
  PapersResult,
  LookupStandardsParams,
  StandardsResult,
  FindAlternativesParams,
  AlternativesResult,
  WebSearchParams,
  WebSearchResult,
  SourceLocationsParams,
  SourceLocationsResult,
  HardwareInfoParams,
  HardwareInfoResult,
  ConflictsParams,
  ConflictsResult,
  AgentQuery,
  AnswerEvidence,
  EvidenceSource,
} from '@/types/mcp';

// =============================================================================
// CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG: Required<MCPClientConfig> = {
  serverUrl: process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:8000',
  transport: 'streamable-http',
  timeout: 30000,
};

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export interface UseMCPOptions extends MCPClientConfig {
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
}

export interface UseMCPResult {
  // Connection state
  connection: MCPConnectionState;
  connect: () => Promise<void>;
  disconnect: () => void;

  // Knowledge search (internal)
  searchKnowledge: (params: SearchKnowledgeParams) => Promise<SearchKnowledgeResult>;
  getLibraryStats: () => Promise<Record<string, unknown>>;

  // External search
  searchManufacturers: (params: SearchManufacturersParams) => Promise<ManufacturerResult>;
  findDistributors: (params: FindDistributorsParams) => Promise<DistributorResult>;
  searchPapers: (params: SearchPapersParams) => Promise<PapersResult>;
  lookupStandards: (params: LookupStandardsParams) => Promise<StandardsResult>;
  findAlternatives: (params: FindAlternativesParams) => Promise<AlternativesResult>;
  webSearch: (params: WebSearchParams) => Promise<WebSearchResult>;

  // Source registry
  getSourceLocations: (params: SourceLocationsParams) => Promise<SourceLocationsResult>;
  getHardwareInfo: (params: HardwareInfoParams) => Promise<HardwareInfoResult>;
  findConflicts: (params: ConflictsParams) => Promise<ConflictsResult>;

  // High-level agent query
  askWithContext: (query: AgentQuery) => Promise<{
    answer: string;
    evidence: AnswerEvidence;
    toolsUsed: string[];
  }>;
}

export function useMCP(options: UseMCPOptions = {}): UseMCPResult {
  const config = { ...DEFAULT_CONFIG, ...options };
  const { autoConnect = true } = options;

  const [connection, setConnection] = useState<MCPConnectionState>({
    connected: false,
    connecting: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // ==========================================================================
  // CONNECTION MANAGEMENT
  // ==========================================================================

  const connect = useCallback(async () => {
    if (connection.connected || connection.connecting) return;

    setConnection((prev) => ({ ...prev, connecting: true, error: null }));

    try {
      // For streamable-http transport, we ping the server to verify connection
      const response = await fetch(`${config.serverUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      setConnection({
        connected: true,
        connecting: false,
        error: null,
        serverInfo: {
          name: 'PROVES Library',
          version: '1.0.0',
          tools: [
            'search_knowledge',
            'search_manufacturers',
            'find_distributors',
            'search_papers',
            'lookup_standards',
            'find_alternatives',
            'web_search',
            'get_source_locations',
            'get_hardware_info',
            'find_conflicts',
          ],
        },
      });
    } catch (error) {
      setConnection({
        connected: false,
        connecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  }, [config.serverUrl, connection.connected, connection.connecting]);

  const disconnect = useCallback(() => {
    abortControllerRef.current?.abort();
    setConnection({
      connected: false,
      connecting: false,
      error: null,
    });
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [autoConnect, connect]);

  // ==========================================================================
  // TOOL INVOCATION HELPER
  // ==========================================================================

  const invokeTool = useCallback(
    async <T>(toolName: string, args: Record<string, unknown>): Promise<T> => {
      if (!connection.connected) {
        // Try to reconnect
        await connect();
      }

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(`${config.serverUrl}/tools/${toolName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(args),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Tool ${toolName} failed: ${errorText}`);
        }

        const result = await response.json();
        return result as T;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request cancelled');
        }
        throw error;
      }
    },
    [config.serverUrl, connection.connected, connect]
  );

  // ==========================================================================
  // INTERNAL KNOWLEDGE TOOLS
  // ==========================================================================

  const searchKnowledge = useCallback(
    async (params: SearchKnowledgeParams): Promise<SearchKnowledgeResult> => {
      return invokeTool<SearchKnowledgeResult>('search_knowledge', params);
    },
    [invokeTool]
  );

  const getLibraryStats = useCallback(async (): Promise<Record<string, unknown>> => {
    return invokeTool<Record<string, unknown>>('get_library_stats', {});
  }, [invokeTool]);

  // ==========================================================================
  // EXTERNAL SEARCH TOOLS
  // ==========================================================================

  const searchManufacturers = useCallback(
    async (params: SearchManufacturersParams): Promise<ManufacturerResult> => {
      return invokeTool<ManufacturerResult>('search_manufacturers', params);
    },
    [invokeTool]
  );

  const findDistributors = useCallback(
    async (params: FindDistributorsParams): Promise<DistributorResult> => {
      return invokeTool<DistributorResult>('find_distributors', params);
    },
    [invokeTool]
  );

  const searchPapers = useCallback(
    async (params: SearchPapersParams): Promise<PapersResult> => {
      return invokeTool<PapersResult>('search_papers', params);
    },
    [invokeTool]
  );

  const lookupStandards = useCallback(
    async (params: LookupStandardsParams): Promise<StandardsResult> => {
      return invokeTool<StandardsResult>('lookup_standards', params);
    },
    [invokeTool]
  );

  const findAlternatives = useCallback(
    async (params: FindAlternativesParams): Promise<AlternativesResult> => {
      return invokeTool<AlternativesResult>('find_alternatives', params);
    },
    [invokeTool]
  );

  const webSearch = useCallback(
    async (params: WebSearchParams): Promise<WebSearchResult> => {
      return invokeTool<WebSearchResult>('web_search', params);
    },
    [invokeTool]
  );

  // ==========================================================================
  // SOURCE REGISTRY TOOLS
  // ==========================================================================

  const getSourceLocations = useCallback(
    async (params: SourceLocationsParams): Promise<SourceLocationsResult> => {
      return invokeTool<SourceLocationsResult>('get_source_locations', params);
    },
    [invokeTool]
  );

  const getHardwareInfo = useCallback(
    async (params: HardwareInfoParams): Promise<HardwareInfoResult> => {
      return invokeTool<HardwareInfoResult>('get_hardware_info', params);
    },
    [invokeTool]
  );

  const findConflicts = useCallback(
    async (params: ConflictsParams): Promise<ConflictsResult> => {
      return invokeTool<ConflictsResult>('find_conflicts', params);
    },
    [invokeTool]
  );

  // ==========================================================================
  // HIGH-LEVEL AGENT QUERY
  // ==========================================================================

  /**
   * Performs a contextual query that:
   * 1. Searches the collective knowledge base (if enabled)
   * 2. Searches external sources for reach (manufacturers, papers, etc.)
   * 3. Aggregates results with evidence tracking
   */
  const askWithContext = useCallback(
    async (
      query: AgentQuery
    ): Promise<{
      answer: string;
      evidence: AnswerEvidence;
      toolsUsed: string[];
    }> => {
      const { query: queryText, scope } = query;
      const toolsUsed: string[] = [];
      const sources: EvidenceSource[] = [];

      // 1. Search collective knowledge if enabled
      let collectiveResults: SearchKnowledgeResult | null = null;
      if (scope.includeCollective) {
        try {
          collectiveResults = await searchKnowledge({
            query: queryText,
            include_pending: false,
            limit: 10,
          });
          toolsUsed.push('search_knowledge');

          // Convert to evidence sources
          collectiveResults.entities.forEach((entity, i) => {
            sources.push({
              id: entity.id,
              type: 'collective',
              title: entity.display_name || entity.name,
              sourceType: entity.entity_type,
              excerpt: truncate(JSON.stringify(entity.attributes), 100),
              capturedAt: formatDate(entity.created_at),
              confidence: 0.9,
            });
          });
        } catch (error) {
          console.error('Collective search failed:', error);
        }
      }

      // 2. Determine if we need external reach based on query
      const queryLower = queryText.toLowerCase();
      const needsExternalReach =
        scope.includeExternal !== false &&
        (queryLower.includes('manufacturer') ||
          queryLower.includes('vendor') ||
          queryLower.includes('supplier') ||
          queryLower.includes('buy') ||
          queryLower.includes('purchase') ||
          queryLower.includes('alternative') ||
          queryLower.includes('equivalent') ||
          queryLower.includes('paper') ||
          queryLower.includes('research') ||
          queryLower.includes('standard') ||
          queryLower.includes('datasheet'));

      let externalResults: {
        manufacturers?: ManufacturerResult;
        alternatives?: AlternativesResult;
        papers?: PapersResult;
        standards?: StandardsResult;
      } = {};

      if (needsExternalReach) {
        // Detect component/part keywords
        const componentMatch = queryText.match(
          /\b(MS5611|BNO085|SX1262|RV3032|MAX-M10S|W25Q\w+|GPS|IMU|EPS|ADCS|radio|sensor)\b/i
        );

        if (componentMatch) {
          const component = componentMatch[1];

          // Search for alternatives
          if (queryLower.includes('alternative') || queryLower.includes('equivalent')) {
            try {
              externalResults.alternatives = await findAlternatives({ component });
              toolsUsed.push('find_alternatives');

              if (externalResults.alternatives?.found && externalResults.alternatives.alternatives) {
                externalResults.alternatives.alternatives.forEach((alt, i) => {
                  sources.push({
                    id: `alt-${i}`,
                    type: 'external',
                    title: `${alt.part} (${alt.manufacturer})`,
                    sourceType: 'alternative',
                    excerpt: alt.notes,
                  });
                });
              }
            } catch (error) {
              console.error('Alternatives search failed:', error);
            }
          }

          // Search for manufacturers
          if (
            queryLower.includes('manufacturer') ||
            queryLower.includes('vendor') ||
            queryLower.includes('buy')
          ) {
            try {
              externalResults.manufacturers = await searchManufacturers({
                component_type: component,
              });
              toolsUsed.push('search_manufacturers');

              externalResults.manufacturers?.manufacturers.forEach((mfr, i) => {
                sources.push({
                  id: `mfr-${i}`,
                  type: 'external',
                  title: mfr.name,
                  sourceUrl: mfr.url,
                  sourceType: 'manufacturer',
                  excerpt: mfr.products.join(', '),
                });
              });
            } catch (error) {
              console.error('Manufacturer search failed:', error);
            }
          }
        }

        // Search for standards
        if (queryLower.includes('standard') || queryLower.includes('spec')) {
          try {
            const topic = extractTopic(queryText);
            externalResults.standards = await lookupStandards({ topic });
            toolsUsed.push('lookup_standards');

            externalResults.standards?.standards.forEach((std) => {
              std.documents.forEach((doc, i) => {
                sources.push({
                  id: `std-${std.organization}-${i}`,
                  type: 'external',
                  title: `${doc.id}: ${doc.title}`,
                  sourceUrl: std.url,
                  sourceType: 'standard',
                  excerpt: `${std.organization} - ${doc.topic}`,
                });
              });
            });
          } catch (error) {
            console.error('Standards lookup failed:', error);
          }
        }

        // Search for papers
        if (queryLower.includes('paper') || queryLower.includes('research')) {
          try {
            externalResults.papers = await searchPapers({ query: queryText });
            toolsUsed.push('search_papers');

            sources.push({
              id: 'papers-search',
              type: 'external',
              title: 'Academic Papers',
              sourceUrl: externalResults.papers?.search_url,
              sourceType: 'research',
              excerpt: `Search arXiv: ${queryText}`,
            });
          } catch (error) {
            console.error('Papers search failed:', error);
          }
        }
      }

      // 3. Calculate evidence summary
      const collectiveCount = sources.filter((s) => s.type === 'collective').length;
      const externalCount = sources.filter((s) => s.type === 'external').length;
      const notebookCount = sources.filter((s) => s.type === 'notebook').length;

      const confidence = determineConfidence(collectiveCount, externalCount, sources);

      const evidence: AnswerEvidence = {
        collectiveCount,
        notebookCount,
        externalCount,
        confidence,
        freshnessLabel: 'just now',
        sources: sources.slice(0, 10), // Limit to 10 sources
      };

      // 4. Generate answer summary
      const answer = generateAnswerSummary(queryText, collectiveResults, externalResults, sources);

      return {
        answer,
        evidence,
        toolsUsed,
      };
    },
    [
      searchKnowledge,
      searchManufacturers,
      findAlternatives,
      lookupStandards,
      searchPapers,
    ]
  );

  return {
    connection,
    connect,
    disconnect,
    searchKnowledge,
    getLibraryStats,
    searchManufacturers,
    findDistributors,
    searchPapers,
    lookupStandards,
    findAlternatives,
    webSearch,
    getSourceLocations,
    getHardwareInfo,
    findConflicts,
    askWithContext,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}

function extractTopic(query: string): string {
  // Extract main topic from query for standards lookup
  const topicKeywords = [
    'telemetry',
    'command',
    'testing',
    'mechanical',
    'radiation',
    'power',
    'communication',
  ];
  const queryLower = query.toLowerCase();
  for (const topic of topicKeywords) {
    if (queryLower.includes(topic)) {
      return topic;
    }
  }
  return query.split(' ').slice(0, 3).join(' ');
}

function determineConfidence(
  collectiveCount: number,
  externalCount: number,
  sources: EvidenceSource[]
): 'high' | 'medium' | 'low' {
  const totalSources = collectiveCount + externalCount;
  const avgConfidence =
    sources.reduce((sum, s) => sum + (s.confidence || 0.5), 0) / Math.max(sources.length, 1);

  if (totalSources >= 5 && avgConfidence >= 0.7) return 'high';
  if (totalSources >= 2 || avgConfidence >= 0.5) return 'medium';
  return 'low';
}

function generateAnswerSummary(
  query: string,
  collectiveResults: SearchKnowledgeResult | null,
  externalResults: {
    manufacturers?: ManufacturerResult;
    alternatives?: AlternativesResult;
    papers?: PapersResult;
    standards?: StandardsResult;
  },
  sources: EvidenceSource[]
): string {
  const parts: string[] = [];

  // Collective results summary
  if (collectiveResults && collectiveResults.entities.length > 0) {
    parts.push(
      `Found ${collectiveResults.entities.length} relevant items in the knowledge library.`
    );

    // List top 3 entities
    const topEntities = collectiveResults.entities.slice(0, 3);
    if (topEntities.length > 0) {
      parts.push('\n\n**From the Library:**');
      topEntities.forEach((entity) => {
        parts.push(`- **${entity.display_name || entity.name}** (${entity.entity_type})`);
      });
    }
  }

  // Alternatives summary
  if (externalResults.alternatives?.found && externalResults.alternatives.alternatives) {
    parts.push('\n\n**Alternative Components:**');
    externalResults.alternatives.alternatives.slice(0, 3).forEach((alt) => {
      parts.push(`- **${alt.part}** by ${alt.manufacturer}: ${alt.notes}`);
    });
  }

  // Manufacturers summary
  if (externalResults.manufacturers && externalResults.manufacturers.count > 0) {
    parts.push('\n\n**Manufacturers:**');
    externalResults.manufacturers.manufacturers.slice(0, 3).forEach((mfr) => {
      parts.push(`- **${mfr.name}**: ${mfr.matched_products.join(', ')}`);
    });
  }

  // Standards summary
  if (externalResults.standards && externalResults.standards.standards.length > 0) {
    parts.push('\n\n**Relevant Standards:**');
    externalResults.standards.standards.forEach((std) => {
      std.documents.slice(0, 2).forEach((doc) => {
        parts.push(`- **${doc.id}**: ${doc.title}`);
      });
    });
  }

  // Papers summary
  if (externalResults.papers) {
    parts.push(
      `\n\n**Research Papers:** [Search arXiv](${externalResults.papers.search_url})`
    );
  }

  // Default response if nothing found
  if (parts.length === 0) {
    return `I searched for "${query}" but didn't find specific matches in the knowledge library. Try refining your query or expanding the search scope.`;
  }

  return parts.join('\n');
}
