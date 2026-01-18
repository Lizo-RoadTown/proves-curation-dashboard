/**
 * Facets - Filter controls for Mission, Team, Domain, and Artifact type
 */

import { Filter } from "lucide-react";

export interface FacetFilters {
  mission: string;
  team: string;
  domain: string;
  artifactType: string;
}

interface FacetsProps {
  filters: FacetFilters;
  onChange: (filters: FacetFilters) => void;
  missionOptions?: { value: string; label: string }[];
  teamOptions?: { value: string; label: string }[];
  domainOptions?: { value: string; label: string }[];
  artifactOptions?: { value: string; label: string }[];
}

const DEFAULT_MISSIONS = [
  { value: "all", label: "All Missions" },
  { value: "proves1", label: "PROVES-1" },
  { value: "proves2", label: "PROVES-2" },
  { value: "proves3", label: "PROVES-3" },
];

const DEFAULT_TEAMS = [
  { value: "all", label: "All Teams" },
  { value: "software", label: "Software Team" },
  { value: "hardware", label: "Hardware Team" },
  { value: "ops", label: "Operations" },
  { value: "ground", label: "Ground Station" },
];

const DEFAULT_DOMAINS = [
  { value: "all", label: "All Domains" },
  { value: "ops", label: "Ops" },
  { value: "software", label: "Software" },
  { value: "hardware", label: "Hardware" },
  { value: "process", label: "Process" },
];

const DEFAULT_ARTIFACTS = [
  { value: "all", label: "All Types" },
  { value: "procedure", label: "Procedures" },
  { value: "component", label: "Components" },
  { value: "interface", label: "Interfaces" },
  { value: "decision", label: "Decisions" },
  { value: "lesson", label: "Lessons" },
];

export function Facets({
  filters,
  onChange,
  missionOptions = DEFAULT_MISSIONS,
  teamOptions = DEFAULT_TEAMS,
  domainOptions = DEFAULT_DOMAINS,
  artifactOptions = DEFAULT_ARTIFACTS,
}: FacetsProps) {
  const updateFilter = (key: keyof FacetFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.mission !== "all" ||
    filters.team !== "all" ||
    filters.domain !== "all" ||
    filters.artifactType !== "all";

  const clearFilters = () => {
    onChange({
      mission: "all",
      team: "all",
      domain: "all",
      artifactType: "all",
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Filter className="w-4 h-4" />
        <span>Filters:</span>
      </div>

      <select
        value={filters.mission}
        onChange={(e) => updateFilter("mission", e.target.value)}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {missionOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={filters.team}
        onChange={(e) => updateFilter("team", e.target.value)}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {teamOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={filters.domain}
        onChange={(e) => updateFilter("domain", e.target.value)}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {domainOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={filters.artifactType}
        onChange={(e) => updateFilter("artifactType", e.target.value)}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {artifactOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
