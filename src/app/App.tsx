import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Dashboard } from "./components/Dashboard";
import { PendingExtractions } from "./components/PendingExtractions";
import { ExtractionDetail } from "./components/ExtractionDetail";
import { ActivityHistory } from "./components/ActivityHistory";
import { Library } from "./components/Library";
import { Settings } from "./components/Settings";
import { AgentOversight } from "./components/AgentOversight";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { LoginPage } from "./components/auth/LoginPage";
import { SignupPage } from "./components/auth/SignupPage";
import { Loader2 } from "lucide-react";

type View = "dashboard" | "pending" | "detail" | "activity" | "library" | "oversight" | "settings";
type AuthView = "login" | "signup";

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>("pending");
  const [authView, setAuthView] = useState<AuthView>("login");
  const [selectedExtractionId, setSelectedExtractionId] = useState<string | null>(null);
  const [currentTeam, setCurrentTeam] = useState("PROVES Lab");

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login/signup if not authenticated
  if (!user) {
    if (authView === "signup") {
      return <SignupPage onSwitchToLogin={() => setAuthView("login")} />;
    }
    return <LoginPage onSwitchToSignup={() => setAuthView("signup")} />;
  }

  // User is authenticated - show main app
  const teams = ["PROVES Lab", "CubeSat Team", "Research Group"]; // TODO: Fetch from team_members
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
  const userRole = "Reviewer"; // TODO: Fetch from team_members
  const pendingCount = 0; // TODO: Fetch from Supabase

  const handleNavigate = (view: string) => {
    setCurrentView(view as View);
  };

  const handleTeamChange = (team: string) => {
    setCurrentTeam(team);
  };

  const handleNotificationsClick = () => {
    console.log("Notifications clicked");
  };

  const handleViewDetail = (id: string) => {
    setSelectedExtractionId(id);
    setCurrentView("detail");
  };

  const handleBackFromDetail = () => {
    setSelectedExtractionId(null);
    setCurrentView("pending");
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
        <Navigation currentView={currentView} onNavigate={handleNavigate} />
        <main className="flex-1">
          {currentView === "dashboard" && (
            <Dashboard onNavigate={handleNavigate} />
          )}
          {currentView === "pending" && (
            <PendingExtractions onViewDetail={handleViewDetail} />
          )}
          {currentView === "detail" && selectedExtractionId && (
            <ExtractionDetail
              extractionId={selectedExtractionId}
              onBack={handleBackFromDetail}
            />
          )}
          {currentView === "activity" && <ActivityHistory />}
          {currentView === "library" && <Library />}
          {currentView === "oversight" && <AgentOversight />}
          {currentView === "settings" && <Settings />}
        </main>
      </div>
    </div>
  );
}
