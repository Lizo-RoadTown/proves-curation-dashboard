/**
 * Header - Application Top Bar
 *
 * Enterprise ops console header with:
 * - Team selector
 * - Graph toggle + pin (prominent, global control)
 * - User menu
 */

import { ChevronDown, LogOut, Network, Pin, PinOff } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu";

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
  return (
    <header className="border-b border-[#334155] bg-[#0f172a] px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Title */}
          <h1 className="text-lg font-semibold text-[#e2e8f0]">PROVES Library</h1>

          {/* Divider */}
          <div className="w-px h-6 bg-[#334155]" />

          {/* Team Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#e2e8f0]"
              >
                <span>{currentTeam}</span>
                <ChevronDown className="h-4 w-4 text-[#64748b]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-[#1e293b] border-[#334155]">
              {teams.map((team) => (
                <DropdownMenuItem
                  key={team}
                  onClick={() => onTeamChange(team)}
                  className={`text-[#94a3b8] hover:bg-[#334155] hover:text-[#e2e8f0] cursor-pointer ${
                    team === currentTeam ? "bg-[#334155]/50" : ""
                  }`}
                >
                  {team}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 hover:bg-[#1e293b]">
                <div className="h-7 w-7 rounded-full bg-[#334155] flex items-center justify-center text-[#94a3b8] text-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-[#94a3b8]">{userName}</span>
                <ChevronDown className="h-4 w-4 text-[#64748b]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1e293b] border-[#334155]">
              <div className="px-3 py-2">
                <div className="text-sm text-[#e2e8f0]">{userName}</div>
                <div className="text-xs text-[#64748b]">{userRole}</div>
              </div>
              <DropdownMenuSeparator className="bg-[#334155]" />
              <DropdownMenuItem className="text-[#94a3b8] hover:bg-[#334155] hover:text-[#e2e8f0] cursor-pointer">
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onSignOut}
                className="text-[#94a3b8] hover:bg-[#334155] hover:text-[#e2e8f0] cursor-pointer"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sign Out */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="text-[#64748b] hover:text-[#94a3b8] hover:bg-[#1e293b]"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
