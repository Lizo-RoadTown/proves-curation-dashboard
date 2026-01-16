import { useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { PendingExtractions } from "./components/PendingExtractions";
import { ExtractionDetail } from "./components/ExtractionDetail";
import { ActivityHistory } from "./components/ActivityHistory";
import { Library } from "./components/Library";
import { Settings } from "./components/Settings";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";

type View = "dashboard" | "pending" | "detail" | "activity" | "library" | "settings";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("pending");
  const [selectedExtractionId, setSelectedExtractionId] = useState<string | null>(null);
  const [currentTeam, setCurrentTeam] = useState("PROVES Lab");

  // Mock data - will be replaced with real auth/team data
  const teams = ["PROVES Lab", "CubeSat Team", "Research Group"];
  const userName = "Engineer";
  const userRole = "Reviewer";
  const pendingCount = 0; // Will be updated from Supabase

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
          {currentView === "settings" && <Settings />}
        </main>
      </div>
    </div>
  );
}
