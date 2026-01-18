/**
 * Header - Mission Control Top Bar
 *
 * Dark theme with status indicators and team selector.
 */

import { Bell, ChevronDown, HelpCircle, LogOut, Rocket } from "lucide-react";
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
  onNotificationsClick,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-700 bg-slate-900 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo/Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 border border-blue-500/30 rounded">
              <Rocket className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">PROVES</h1>
              <span className="text-xs text-slate-500 font-mono uppercase">Knowledge Library</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-700" />

          {/* Team Selector */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-slate-100"
                >
                  <span className="font-medium">{currentTeam}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-slate-800 border-slate-700">
                <div className="px-2 py-1.5 text-xs font-mono text-slate-500 uppercase">
                  Switch Team
                </div>
                <DropdownMenuSeparator className="bg-slate-700" />
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

            <span className="px-2 py-0.5 text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded uppercase">
              {userRole}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Pending Count */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded">
            <span className="text-xs text-slate-500 font-mono uppercase">Pending:</span>
            <span className={`text-lg font-mono font-bold ${
              pendingCount > 0 ? "text-amber-400" : "text-slate-500"
            }`}>
              {pendingCount}
            </span>
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            onClick={onNotificationsClick}
          >
            <Bell className="h-5 w-5" />
            {pendingCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px] shadow-amber-400/50" />
            )}
          </Button>

          {/* Help */}
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200 hover:bg-slate-800">
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Sign Out */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            title="Sign Out"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <LogOut className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 hover:bg-slate-800">
                <div className="h-8 w-8 rounded bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 text-sm font-mono font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
              <div className="px-3 py-2">
                <div className="text-sm font-medium text-slate-200">{userName}</div>
                <div className="text-xs text-slate-500 font-mono uppercase">{userRole}</div>
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
        </div>
      </div>
    </header>
  );
}
