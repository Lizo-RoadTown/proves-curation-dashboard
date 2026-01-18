import { MessageSquare, BookOpen, Settings } from "lucide-react";

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
  // 2-surface navigation - Library + Admin (Ask is removed for now)
  const navItems = [
    {
      id: "library",
      label: "Library",
      icon: BookOpen,
      description: "Search + explore knowledge",
      minRole: "user",
    },
    {
      id: "admin",
      label: "Admin",
      icon: Settings,
      description: "Manage sources & review",
      minRole: "lead", // Only lead+ can see Admin
    },
  ];

  // Filter nav items based on user role
  const userRoleLevel = roleHierarchy[userRole] || 1;
  const visibleItems = navItems.filter(
    (item) => userRoleLevel >= roleHierarchy[item.minRole]
  );

  return (
    <nav className="w-64 border-r bg-white p-4 flex flex-col h-[calc(100vh-64px)]">
      {/* Main Navigation */}
      <div className="space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon
                className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  isActive ? "text-white" : "text-gray-500"
                }`}
              />
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold">{item.label}</span>
                <span
                  className={`text-xs ${
                    isActive ? "text-blue-100" : "text-gray-500"
                  }`}
                >
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
      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">?</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Knowledge Graph</div>
            <p className="text-xs text-gray-600 mt-1">
              Explore the library's knowledge graph and review pending extractions
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
}
