/**
 * Header - Application Top Bar
 *
 * Enterprise ops console header with:
 * - Team selector (native select - dropdowns don't work)
 * - Graph toggle + pin (prominent, global control)
 * - User info + Sign Out button
 */

import { useState } from "react";
import { LogOut, Network, Pin, PinOff, ChevronDown } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface HeaderProps {
  currentTeam: string;
  userRole: string;
  pendingCount: number;
  userName: string;
  teams: string[];
  onTeamChange: (team: string) => void;
  onNotificationsClick: () => void;
  onSignOut?: () => void;
  // Graph control props
  graphVisible?: boolean;
  graphPinned?: boolean;
  onGraphToggle?: () => void;
  onGraphPinToggle?: () => void;
  // Whether graph controls should be shown (not in Mission Control)
  showGraphControls?: boolean;
}

export function Header({
  currentTeam,
  userRole,
  pendingCount,
  userName,
  teams,
  onTeamChange,
  onSignOut,
  graphVisible = false,
  graphPinned = false,
  onGraphToggle,
  onGraphPinToggle,
  showGraphControls = true,
}: HeaderProps) {
  const [isTeamOpen, setIsTeamOpen] = useState(false);

  const handleSignOut = () => {
    console.log('[Header] Sign out clicked');
    if (onSignOut) {
      onSignOut();
    }
  };

  return (
    <header className="border-b border-[#334155] bg-[#0f172a] px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Title */}
          <h1 className="text-lg font-semibold text-[#e2e8f0]">PROVES Library</h1>

          {/* Divider */}
          <div className="w-px h-6 bg-[#334155]" />

          {/* Team Selector - Custom dropdown that actually works */}
          <div className="relative">
            <button
              onClick={() => setIsTeamOpen(!isTeamOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#e2e8f0] rounded-md transition-colors"
            >
              <span>{currentTeam}</span>
              <ChevronDown className={`h-4 w-4 text-[#64748b] transition-transform ${isTeamOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTeamOpen && (
              <>
                {/* Backdrop to close on click outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsTeamOpen(false)}
                />
                {/* Dropdown menu */}
                <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-[#1e293b] border border-[#334155] rounded-md shadow-lg z-50">
                  {teams.map((team) => (
                    <button
                      key={team}
                      onClick={() => {
                        console.log('[Header] Team selected:', team);
                        onTeamChange(team);
                        setIsTeamOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        team === currentTeam
                          ? "bg-[#334155] text-[#e2e8f0]"
                          : "text-[#94a3b8] hover:bg-[#334155] hover:text-[#e2e8f0]"
                      }`}
                    >
                      {team}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {pendingCount > 0 && (
            <span className="text-sm text-[#94a3b8]">
              {pendingCount} pending
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Graph Toggle - Prominent, global control */}
          {showGraphControls && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#1e293b] border border-[#334155]">
              <Button
                variant="ghost"
                size="sm"
                onClick={onGraphToggle}
                className={`gap-2 h-7 px-2 ${
                  graphVisible
                    ? "text-[#06b6d4] hover:text-[#22d3ee]"
                    : "text-[#64748b] hover:text-[#94a3b8]"
                }`}
              >
                <Network className="h-4 w-4" />
                <span className="text-xs font-medium">GRAPH</span>
              </Button>

              {/* Pin button - only show when graph is visible */}
              {graphVisible && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onGraphPinToggle}
                  className={`h-7 w-7 ${
                    graphPinned
                      ? "text-[#06b6d4] hover:text-[#22d3ee]"
                      : "text-[#64748b] hover:text-[#94a3b8]"
                  }`}
                  title={graphPinned ? "Unpin graph" : "Pin graph to stay open"}
                >
                  {graphPinned ? (
                    <Pin className="h-3.5 w-3.5" />
                  ) : (
                    <PinOff className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-6 bg-[#334155]" />

          {/* User Info */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-[#334155] flex items-center justify-center text-[#94a3b8] text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm">
              <span className="text-[#94a3b8]">{userName}</span>
              <span className="text-[#64748b] ml-2">({userRole})</span>
            </div>
          </div>

          {/* Sign Out Button - Clearly visible and clickable */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1e293b] rounded-md transition-colors border border-[#334155]"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
