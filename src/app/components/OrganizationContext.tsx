/**
 * OrganizationContext - Multi-tenant context for universities
 *
 * Each university/team has:
 * - Their own sources (repos, drives, discord servers)
 * - Their own review queue (extractions from their sources)
 * - Access to shared collective library
 *
 * The dashboard shows clear distinction between:
 * - "Our Team's" contributions
 * - "Shared/Community" knowledge
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  created_at: string;
}

export interface OrganizationStats {
  // Our contributions
  our_sources: number;
  our_pending_reviews: number;
  our_verified_entities: number;
  our_contributors: number;

  // Shared library
  shared_entities: number;
  shared_sources: number;
  shared_contributors: number;
}

interface OrganizationContextType {
  // Current organization
  currentOrg: Organization | null;
  availableOrgs: Organization[];
  setCurrentOrg: (org: Organization) => void;

  // Stats
  stats: OrganizationStats | null;
  loading: boolean;
  error: string | null;

  // View mode
  viewMode: "our_team" | "shared" | "all";
  setViewMode: (mode: "our_team" | "shared" | "all") => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
}

// =============================================================================
// PROVIDER
// =============================================================================

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([]);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [viewMode, setViewMode] = useState<"our_team" | "shared" | "all">("our_team");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Fetch stats when org changes
  useEffect(() => {
    if (currentOrg) {
      fetchStats(currentOrg.id);
    }
  }, [currentOrg]);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual Supabase call
      // const { data, error } = await supabase
      //   .from('organizations')
      //   .select('*')
      //   .order('name');

      // Mock data for now
      const mockOrgs: Organization[] = [
        { id: "1", name: "PROVES Lab", slug: "proves-lab", created_at: new Date().toISOString() },
        { id: "2", name: "University A - CubeSat Team", slug: "uni-a-cubesat", created_at: new Date().toISOString() },
        { id: "3", name: "University B - SmallSat Group", slug: "uni-b-smallsat", created_at: new Date().toISOString() },
      ];

      setAvailableOrgs(mockOrgs);
      if (mockOrgs.length > 0 && !currentOrg) {
        setCurrentOrg(mockOrgs[0]);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (orgId: string) => {
    try {
      // TODO: Replace with actual Supabase call
      // Mock stats
      const mockStats: OrganizationStats = {
        our_sources: 5,
        our_pending_reviews: 12,
        our_verified_entities: 156,
        our_contributors: 8,
        shared_entities: 1247,
        shared_sources: 23,
        shared_contributors: 45,
      };

      setStats(mockStats);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const value: OrganizationContextType = {
    currentOrg,
    availableOrgs,
    setCurrentOrg,
    stats,
    loading,
    error,
    viewMode,
    setViewMode,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * Visual indicator showing "Our Team" vs "Shared Community"
 */
export function ScopeIndicator({ scope }: { scope: "our_team" | "shared" | "all" }) {
  const styles = {
    our_team: "bg-blue-100 text-blue-800 border-blue-200",
    shared: "bg-purple-100 text-purple-800 border-purple-200",
    all: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const labels = {
    our_team: "Our Team",
    shared: "Shared Community",
    all: "All",
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${styles[scope]}`}>
      {labels[scope]}
    </span>
  );
}

/**
 * Toggle between viewing Our Team vs Shared
 */
export function ScopeToggle() {
  const { viewMode, setViewMode, stats } = useOrganization();

  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => setViewMode("our_team")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          viewMode === "our_team"
            ? "bg-white text-blue-700 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Our Team
        {stats && stats.our_pending_reviews > 0 && (
          <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
            {stats.our_pending_reviews}
          </span>
        )}
      </button>
      <button
        onClick={() => setViewMode("shared")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          viewMode === "shared"
            ? "bg-white text-purple-700 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Shared Library
      </button>
      <button
        onClick={() => setViewMode("all")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          viewMode === "all"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        All
      </button>
    </div>
  );
}
