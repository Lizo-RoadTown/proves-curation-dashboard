import { useState } from "react";
import { Search, FileText, Cpu, Link2, Lightbulb, AlertTriangle, ChevronRight } from "lucide-react";

interface KnowledgeTile {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  count: number;
  color: string;
}

const knowledgeTiles: KnowledgeTile[] = [
  {
    id: "procedures",
    title: "Procedures",
    description: "Ops runbooks, checklists",
    icon: FileText,
    count: 45,
    color: "bg-blue-500",
  },
  {
    id: "architecture",
    title: "Architecture",
    description: "System/Software/Hardware design",
    icon: Cpu,
    count: 128,
    color: "bg-purple-500",
  },
  {
    id: "interfaces",
    title: "Interfaces",
    description: "ICDs, ports, component links",
    icon: Link2,
    count: 89,
    color: "bg-green-500",
  },
  {
    id: "decisions",
    title: "Decisions",
    description: "ADRs, trade studies",
    icon: Lightbulb,
    count: 34,
    color: "bg-yellow-500",
  },
  {
    id: "lessons",
    title: "Lessons Learned",
    description: "Post-mortems, gotchas",
    icon: AlertTriangle,
    count: 23,
    color: "bg-red-500",
  },
];

export function LibraryView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [missionFilter, setMissionFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");

  // Mock data for tile index view
  const mockEntities = [
    { id: "1", name: "GPS Component", type: "component", domain: "hardware", references: 24, updated: "2 days ago" },
    { id: "2", name: "I2C Bus Architecture", type: "interface", domain: "hardware", references: 18, updated: "1 week ago" },
    { id: "3", name: "Deployment Procedure", type: "procedure", domain: "ops", references: 15, updated: "3 days ago" },
    { id: "4", name: "Battery Calibration", type: "procedure", domain: "ops", references: 12, updated: "5 days ago" },
  ];

  if (selectedTile) {
    const tile = knowledgeTiles.find((t) => t.id === selectedTile);
    return (
      <div className="p-6">
        <button
          onClick={() => setSelectedTile(null)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Library
        </button>

        <div className="flex items-center gap-3 mb-6">
          {tile && (
            <>
              <div className={`p-3 rounded-xl ${tile.color}`}>
                <tile.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{tile.title}</h1>
                <p className="text-gray-600">{tile.count} items</p>
              </div>
            </>
          )}
        </div>

        {/* Curated Index Tabs */}
        <div className="flex gap-2 mb-6">
          <button className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg">
            Most Referenced
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
            Most Recent
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
            Needs Review
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
            By Team
          </button>
        </div>

        {/* Entity List */}
        <div className="space-y-3">
          {mockEntities.map((entity) => (
            <div
              key={entity.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
            >
              <div>
                <h3 className="font-medium text-gray-900">{entity.name}</h3>
                <div className="flex gap-3 mt-1 text-sm text-gray-500">
                  <span className="px-2 py-0.5 bg-gray-100 rounded">{entity.type}</span>
                  <span>{entity.domain}</span>
                  <span>{entity.references} references</span>
                </div>
              </div>
              <div className="text-sm text-gray-400">{entity.updated}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Library</h1>
      <p className="text-gray-600 mb-6">
        Search and explore the collective knowledge base
      </p>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search the library..."
          className="w-full pl-12 pr-4 py-3 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Facets */}
      <div className="flex gap-4 mb-8">
        <select
          value={missionFilter}
          onChange={(e) => setMissionFilter(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          <option value="all">All Missions</option>
          <option value="proves1">PROVES-1</option>
          <option value="proves2">PROVES-2</option>
        </select>

        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          <option value="all">All Teams</option>
          <option value="software">Software Team</option>
          <option value="hardware">Hardware Team</option>
          <option value="ops">Operations</option>
        </select>

        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          <option value="all">All Domains</option>
          <option value="ops">Ops</option>
          <option value="software">Software</option>
          <option value="hardware">Hardware</option>
          <option value="process">Process</option>
        </select>
      </div>

      {/* Knowledge Map */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Knowledge Map</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {knowledgeTiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.id}
              onClick={() => setSelectedTile(tile.id)}
              className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all text-left group"
            >
              <div className={`p-3 rounded-xl ${tile.color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{tile.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{tile.description}</p>
                <p className="text-sm font-medium text-gray-700 mt-2">
                  {tile.count} items
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
