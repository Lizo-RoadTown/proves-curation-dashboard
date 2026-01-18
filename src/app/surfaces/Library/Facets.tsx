/**
 * Facets - Mission Control filter controls
 *
 * Dark theme with monospace labels.
 */

import { Filter, X } from "lucide-react";

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
  { value: "all", label: "ALL MISSIONS" },
  { value: "proves1", label: "PROVES-1" },
  { value: "proves2", label: "PROVES-2" },
  { value: "proves3", label: "PROVES-3" },
];

const DEFAULT_TEAMS = [
  { value: "all", label: "ALL TEAMS" },
  { value: "software", label: "SOFTWARE" },
  { value: "hardware", label: "HARDWARE" },
  { value: "ops", label: "OPERATIONS" },
  { value: "ground", label: "GROUND STATION" },
];

const DEFAULT_DOMAINS = [
  { value: "all", label: "ALL DOMAINS" },
  { value: "ops", label: "OPS" },
  { value: "software", label: "SOFTWARE" },
  { value: "hardware", label: "HARDWARE" },
  { value: "process", label: "PROCESS" },
];

const DEFAULT_ARTIFACTS = [
  { value: "all", label: "ALL TYPES" },
  { value: "procedure", label: "PROCEDURES" },
  { value: "component", label: "COMPONENTS" },
  { value: "interface", label: "INTERFACES" },
  { value: "decision", label: "DECISIONS" },
  { value: "lesson", label: "LESSONS" },
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

  const selectClasses = "px-3 py-2 text-xs font-mono bg-slate-800 border border-slate-700 text-slate-300 rounded hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono uppercase">
        <Filter className="w-4 h-4" />
        <span>Filters:</span>
      </div>

      <select
        value={filters.mission}
        onChange={(e) => updateFilter("mission", e.target.value)}
        className={selectClasses}
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
        className={selectClasses}
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
        className={selectClasses}
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
        className={selectClasses}
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
          className="flex items-center gap-1 px-3 py-2 text-xs font-mono text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded transition-colors"
        >
          <X className="w-3 h-3" />
          CLEAR
        </button>
      )}
    </div>
  );
}
