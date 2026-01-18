/**
 * Navigation - Mission Control Sidebar
 *
 * Dark theme sidebar with sharp edges and status indicators.
 */

import { BookOpen, Settings, Radio, HelpCircle } from "lucide-react";

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
  // 2-surface navigation - Library + Admin
  const navItems = [
    {
      id: "library",
      label: "Library",
      icon: BookOpen,
      description: "Knowledge Graph",
      minRole: "user",
    },
    {
      id: "admin",
      label: "Admin",
      icon: Settings,
      description: "Mission Control",
      minRole: "lead",
    },
  ];

  // Filter nav items based on user role
  const userRoleLevel = roleHierarchy[userRole] || 1;
  const visibleItems = navItems.filter(
    (item) => userRoleLevel >= roleHierarchy[item.minRole]
  );

  return (
    <nav className="w-64 border-r border-slate-700 bg-slate-900 p-4 flex flex-col h-[calc(100vh-64px)]">
      {/* System Status */}
      <div className="mb-6 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded">
        <div className="flex items-center gap-2">
          <Radio className="w-3 h-3 text-emerald-400" />
          <span className="text-xs font-mono text-emerald-400 uppercase">System Online</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded transition-all ${
                isActive
                  ? "bg-blue-500/20 border border-blue-500/50 text-slate-100"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Icon
                className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  isActive ? "text-blue-400" : "text-slate-500"
                }`}
              />
              <div className="flex flex-col items-start text-left">
                <span className={`font-semibold text-sm ${isActive ? "text-slate-100" : ""}`}>
                  {item.label}
                </span>
                <span className={`text-xs font-mono uppercase ${
                  isActive ? "text-blue-400/70" : "text-slate-600"
                }`}>
                  {item.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Help Section */}
      <div className="p-4 bg-slate-800/30 border border-slate-700 rounded">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200">PROVES Library</div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              KNOWLEDGE GRAPH v1.0
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
}
