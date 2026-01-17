import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { LoginPage } from "./components/auth/LoginPage";
import { SignupPage } from "./components/auth/SignupPage";
import { Loader2 } from "lucide-react";

// New 3-surface architecture
import { AskView, LibraryView, AdminView } from "./surfaces";

// Surface type - brutally simple: Ask, Library, Admin
type Surface = "ask" | "library" | "admin";
type AuthView = "login" | "signup";

// DEV MODE: Skip auth for local development
const DEV_SKIP_AUTH = import.meta.env.DEV;

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [currentSurface, setCurrentSurface] = useState<Surface>("ask");
  const [authView, setAuthView] = useState<AuthView>("login");
  const [currentTeam, setCurrentTeam] = useState("PROVES Lab");

  // Show loading spinner while checking auth state (skip in dev mode)
  if (loading && !DEV_SKIP_AUTH) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login/signup if not authenticated (skip in dev mode)
  if (!user && !DEV_SKIP_AUTH) {
    if (authView === "signup") {
      return <SignupPage onSwitchToLogin={() => setAuthView("login")} />;
    }
    return <LoginPage onSwitchToSignup={() => setAuthView("signup")} />;
  }

  // User is authenticated (or dev mode) - show main app
  const teams = ["PROVES Lab", "CubeSat Team", "Research Group"]; // TODO: Fetch from team_members
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Dev User";
  const userRole = "lead"; // TODO: Fetch from user_roles table (lead = can see Admin)
  const pendingCount = 0; // TODO: Fetch from Supabase

  const handleNavigate = (surface: string) => {
    setCurrentSurface(surface as Surface);
  };

  const handleTeamChange = (team: string) => {
    setCurrentTeam(team);
  };

  const handleNotificationsClick = () => {
    console.log("Notifications clicked");
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentTeam={currentTeam}
        userRole={userRole}
        pendingCount={pendingCount}
        userName={userName}
        teams={teams}
        onTeamChange={handleTeamChange}
        onNotificationsClick={handleNotificationsClick}
        onSignOut={handleSignOut}
      />
      <div className="flex">
        <Navigation
          currentView={currentSurface}
          onNavigate={handleNavigate}
          userRole={userRole}
        />
        <main className="flex-1 overflow-hidden">
          {currentSurface === "ask" && <AskView />}
          {currentSurface === "library" && <LibraryView />}
          {currentSurface === "admin" && <AdminView />}
        </main>
      </div>
    </div>
  );
}
