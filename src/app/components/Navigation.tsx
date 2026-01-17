import { Home, FileText, BookOpen, Activity, Settings, Shield, Users } from "lucide-react";

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Navigation({ currentView, onNavigate }: NavigationProps) {
  const navItems = [
    { id: "dashboard", label: "Home", icon: Home, description: "Overview and metrics" },
    { id: "pending", label: "Review Work", icon: FileText, description: "Pending extractions to review" },
    { id: "library", label: "Library", icon: BookOpen, description: "Verified knowledge" },
    { id: "activity", label: "Activity", icon: Activity, description: "Review history and audit trail" },
    { id: "oversight", label: "Agent Oversight", icon: Shield, description: "Trust calibration and approvals" },
    { id: "reflection", label: "Peer Reflection", icon: Users, description: "Read-only quality analysis" },
    { id: "settings", label: "Settings", icon: Settings, description: "Team and personal settings" },
  ];

  return (
    <nav className="w-64 border-r bg-gray-50 p-4">
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isActive ? "text-white" : "text-gray-500"}`} />
              <div className="flex flex-col items-start text-left">
                <span className="font-medium">{item.label}</span>
                <span className={`text-xs ${isActive ? "text-blue-100" : "text-gray-500"}`}>
                  {item.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs">?</span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">Need Help?</div>
            <p className="text-xs text-gray-600 mt-1">
              Access the glossary or contextual help anytime
            </p>
            <button className="text-xs text-blue-600 hover:underline mt-2">
              Open Help Center
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}