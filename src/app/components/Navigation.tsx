/**
 * Navigation - Sidebar Navigation
 *
 * Professional dark theme sidebar.
 */

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
      minRole: "user",
    },
    {
      id: "admin",
      label: "Admin",
      minRole: "lead",
    },
  ];

  // Filter nav items based on user role
  const userRoleLevel = roleHierarchy[userRole] || 1;
  const visibleItems = navItems.filter(
    (item) => userRoleLevel >= roleHierarchy[item.minRole]
  );

  return (
    <nav className="w-48 border-r border-slate-700 bg-slate-900 p-4 h-[calc(100vh-52px)]">
      <div className="space-y-1">
        {visibleItems.map((item) => {
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? "bg-slate-800 text-slate-100"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
