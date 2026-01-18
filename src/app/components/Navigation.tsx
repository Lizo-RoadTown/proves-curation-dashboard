/**
 * Navigation - Top-level Surface Navigation
 *
 * Three operational modes (not tabs - different mental modes):
 * - Library: Browse verified knowledge (everyone)
 * - Admin: Robot caretaking + Extraction validation (leads/admins)
 * - Mission Control: Shared live awareness room (everyone, read-only)
 */

import { BookOpen, Settings, Radio } from "lucide-react";

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userRole?: string;
}

// Role hierarchy for access control
const roleHierarchy: Record<string, number> = {
  user: 1,
  reviewer: 2,
  lead: 3,
  admin: 4,
};

export function Navigation({ currentView, onNavigate, userRole = "lead" }: NavigationProps) {
  // 3-surface architecture: Mission Control (default), Library, Admin
  const navItems = [
    {
      id: "mission-control",
      label: "Mission Control",
      icon: Radio,
      description: "Live status",
      minRole: "user",
    },
    {
      id: "library",
      label: "Library",
      icon: BookOpen,
      description: "Verified knowledge",
      minRole: "user",
    },
    {
      id: "admin",
      label: "Admin",
      icon: Settings,
      description: "Operations",
      minRole: "lead",
    },
  ];

  // Filter nav items based on user role
  const userRoleLevel = roleHierarchy[userRole] || 1;
  const visibleItems = navItems.filter(
    (item) => userRoleLevel >= roleHierarchy[item.minRole]
  );

  return (
    <nav className="w-48 border-r border-[#334155] bg-[#0f172a] p-4 h-[calc(100vh-52px)]">
      <div className="space-y-1">
        {visibleItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors flex items-center gap-3 ${
                isActive
                  ? "bg-[#1e293b] text-[#e2e8f0] border-l-2 border-[#06b6d4]"
                  : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-[#e2e8f0]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#06b6d4]" : ""}`} />
              <div>
                <div className="font-medium">{item.label}</div>
                <div className={`text-xs ${isActive ? "text-[#94a3b8]" : "text-[#64748b]"}`}>
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live indicator for Mission Control */}
      {currentView === "mission-control" && (
        <div className="mt-6 pt-4 border-t border-[#334155]">
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
            </span>
            <span className="text-xs text-[#94a3b8]">Live updates active</span>
          </div>
        </div>
      )}
    </nav>
  );
}
