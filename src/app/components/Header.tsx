import { Bell, ChevronDown, HelpCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
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
}

export function Header({
  currentTeam,
  userRole,
  pendingCount,
  userName,
  teams,
  onTeamChange,
  onNotificationsClick,
}: HeaderProps) {
  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">PROVES</h1>
            <span className="text-sm text-gray-500">Knowledge Review</span>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <span className="font-medium">{currentTeam}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                  Switch Team
                </div>
                <DropdownMenuSeparator />
                {teams.map((team) => (
                  <DropdownMenuItem
                    key={team}
                    onClick={() => onTeamChange(team)}
                    className={team === currentTeam ? "bg-gray-100" : ""}
                  >
                    {team}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Badge variant="secondary" className="text-xs">
              {userRole}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Pending:</span>
            <Badge variant={pendingCount > 0 ? "default" : "secondary"}>
              {pendingCount}
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={onNotificationsClick}
          >
            <Bell className="h-5 w-5" />
            {pendingCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </Button>

          <Button variant="ghost" size="sm">
            <HelpCircle className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                  {userName.charAt(0)}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5">
                <div className="text-sm font-medium">{userName}</div>
                <div className="text-xs text-gray-500">{userRole}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
