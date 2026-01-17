/**
 * ScopeChips - Left panel for controlling search scope
 *
 * Controls which sources the agent searches (Collective vs Notebook)
 * and filters by mission, domain, and time.
 */

import { Check, Database, BookOpen, Filter } from "lucide-react";

interface ScopeChipsProps {
  scopeCollective: boolean;
  setScopeCollective: (value: boolean) => void;
  scopeNotebook: boolean;
  setScopeNotebook: (value: boolean) => void;
  missionFilter: string;
  setMissionFilter: (value: string) => void;
  domainFilter: string;
  setDomainFilter: (value: string) => void;
  timeFilter: string;
  setTimeFilter: (value: string) => void;
}

export function ScopeChips({
  scopeCollective,
  setScopeCollective,
  scopeNotebook,
  setScopeNotebook,
  missionFilter,
  setMissionFilter,
  domainFilter,
  setDomainFilter,
  timeFilter,
  setTimeFilter,
}: ScopeChipsProps) {
  return (
    <div className="w-56 border-r bg-gray-50 p-4 flex-shrink-0 flex flex-col">
      {/* Scope Section */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" />
          Search Scope
        </h3>

        <div className="space-y-2">
          {/* Collective Toggle */}
          <ScopeToggle
            active={scopeCollective}
            onClick={() => setScopeCollective(!scopeCollective)}
            icon={Database}
            label="Collective"
            description="Verified library"
            activeColor="blue"
          />

          {/* Notebook Toggle */}
          <ScopeToggle
            active={scopeNotebook}
            onClick={() => setScopeNotebook(!scopeNotebook)}
            icon={BookOpen}
            label="My Notebook"
            description="Your attached files"
            activeColor="green"
          />
        </div>
      </div>

      {/* Filters Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Filters
        </h3>

        {/* Mission Filter */}
        <FilterSelect
          label="Mission"
          value={missionFilter}
          onChange={setMissionFilter}
          options={[
            { value: "all", label: "All Missions" },
            { value: "proves1", label: "PROVES-1" },
            { value: "proves2", label: "PROVES-2" },
            { value: "generic", label: "Generic / Cross-Mission" },
          ]}
        />

        {/* Domain Filter */}
        <FilterSelect
          label="Domain"
          value={domainFilter}
          onChange={setDomainFilter}
          options={[
            { value: "all", label: "All Domains" },
            { value: "ops", label: "Ops" },
            { value: "software", label: "Software" },
            { value: "hardware", label: "Hardware" },
            { value: "process", label: "Process" },
          ]}
        />

        {/* Time Filter */}
        <FilterSelect
          label="Time"
          value={timeFilter}
          onChange={setTimeFilter}
          options={[
            { value: "latest", label: "Latest" },
            { value: "week", label: "Past Week" },
            { value: "month", label: "Past Month" },
            { value: "all", label: "All Time" },
          ]}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Quick Tips */}
      <div className="pt-4 border-t border-gray-200 mt-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Tips
        </h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Narrow scope for faster answers</li>
          <li>• Attach files for project-specific context</li>
          <li>• Use domain filters for targeted search</li>
        </ul>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ScopeToggleProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  description: string;
  activeColor: "blue" | "green";
}

function ScopeToggle({
  active,
  onClick,
  icon: Icon,
  label,
  description,
  activeColor,
}: ScopeToggleProps) {
  const colors = {
    blue: {
      active: "bg-blue-100 text-blue-700 border-blue-200",
      check: "bg-blue-600",
    },
    green: {
      active: "bg-green-100 text-green-700 border-green-200",
      check: "bg-green-600",
    },
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
        active
          ? `${colors[activeColor].active} border`
          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div
        className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
          active ? colors[activeColor].check : "bg-white border border-gray-300"
        }`}
      >
        {active && <Check className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 text-left">
        <div className="font-medium flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </div>
        <div className={`text-xs mt-0.5 ${active ? "opacity-80" : "text-gray-500"}`}>
          {description}
        </div>
      </div>
    </button>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
