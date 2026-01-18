/**
 * Header - Application Top Bar
 *
 * Professional dark theme with team selector.
 */

import { ChevronDown, LogOut } from "lucide-react";
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
}

export function Header({
  currentTeam,
  userRole,
  pendingCount,
  userName,
  teams,
  onTeamChange,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-700 bg-slate-900 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Title */}
          <h1 className="text-lg font-semibold text-slate-100">PROVES Library</h1>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-700" />

          {/* Team Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              >
                <span>{currentTeam}</span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-slate-800 border-slate-700">
              {teams.map((team) => (
                <DropdownMenuItem
                  key={team}
                  onClick={() => onTeamChange(team)}
                  className={`text-slate-300 hover:bg-slate-700 hover:text-slate-100 ${
                    team === currentTeam ? "bg-slate-700/50" : ""
                  }`}
                >
                  {team}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {pendingCount > 0 && (
            <span className="text-sm text-slate-400">
              {pendingCount} pending
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 hover:bg-slate-800">
                <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-slate-300">{userName}</span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
              <div className="px-3 py-2">
                <div className="text-sm text-slate-200">{userName}</div>
                <div className="text-xs text-slate-500">{userRole}</div>
              </div>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="text-slate-300 hover:bg-slate-700 hover:text-slate-100">
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onSignOut}
                className="text-slate-300 hover:bg-slate-700 hover:text-slate-100"
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
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
