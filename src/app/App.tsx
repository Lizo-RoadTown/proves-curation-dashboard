/**
 * App - Mission Control Main Application
 *
 * Enterprise ops console with 3-surface architecture:
 * - Library: Browse verified knowledge (everyone)
 * - Admin: Agent Monitoring + Extraction Validation (leads/admins)
 * - Mission Control: Shared live awareness room (everyone, read-only)
 *
 * Global graph toggle with pin control in header.
 */

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useCurrentOrganization } from "../hooks/useCurrentOrganization";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { LoginPage } from "./components/auth/LoginPage";
import { SignupPage } from "./components/auth/SignupPage";
import { OrganizationPicker } from "./components/auth/OrganizationPicker";
import { Loader2 } from "lucide-react";

// 3-surface architecture: Library, Admin, Mission Control
import { LibraryView, AdminView, MissionControlView } from "./surfaces";

// Surface types
type Surface = "library" | "admin" | "mission-control";
type AuthView = "login" | "signup";

// DEV MODE: Skip auth for local development
// Set to false to test real auth flow even in dev
const DEV_SKIP_AUTH = false;

// Graph state persistence key
const GRAPH_PINNED_KEY = "proves_graph_pinned";

export default function App() {
  const { user, loading, signOut } = useAuth();
  const {
    currentOrg,
    organizations,
    loading: orgLoading,
    selectOrganization,
  } = useCurrentOrganization();
  const [currentSurface, setCurrentSurface] = useState<Surface>("mission-control");
  const [authView, setAuthView] = useState<AuthView>("login");
  const [showOrgPicker, setShowOrgPicker] = useState(false);

  // Check if user needs to pick their organization (first login)
  useEffect(() => {
    if (user && !orgLoading && organizations.length > 0) {
      const hasSelectedOrg = localStorage.getItem('proves_org_selected');
      const hasPrimaryOrg = organizations.some(o => o.is_primary);

      // Show picker if user hasn't selected an org and doesn't have a primary
      if (!hasSelectedOrg && !hasPrimaryOrg) {
        setShowOrgPicker(true);
      }
    }
  }, [user, orgLoading, organizations]);

  // Graph visibility state
  const [graphVisible, setGraphVisible] = useState(false);
  const [graphPinned, setGraphPinned] = useState(() => {
    // Load pinned state from localStorage
    const saved = localStorage.getItem(GRAPH_PINNED_KEY);
    return saved === "true";
  });

  // Persist pinned state
  useEffect(() => {
    localStorage.setItem(GRAPH_PINNED_KEY, String(graphPinned));
  }, [graphPinned]);

  // Graph visibility defaults per surface
  useEffect(() => {
    if (currentSurface === "mission-control") {
      // Always on in Mission Control (embedded in the view)
      setGraphVisible(true);
    } else if (!graphPinned) {
      // Off by default in Library and Admin, unless pinned
      setGraphVisible(false);
    }
  }, [currentSurface, graphPinned]);

  // Show loading spinner while checking auth state (skip in dev mode)
  if (loading && !DEV_SKIP_AUTH) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#06b6d4]" />
          <p className="text-sm text-[#64748b] font-mono uppercase tracking-wider">Initializing...</p>
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

  // Show organization picker for first login
  if (showOrgPicker && user) {
    return (
      <OrganizationPicker
        userId={user.id}
        onComplete={(orgId) => {
          selectOrganization(orgId);
          setShowOrgPicker(false);
        }}
      />
    );
  }

  // User is authenticated (or dev mode) - show main app
  // Build teams list from real organizations
  const teams = organizations.length > 0
    ? organizations.map(org => org.org_name)
    : ["Cal Poly Pomona", "Columbia University", "Northeastern University", "UC Santa Cruz", "Texas State University"];

  const currentTeam = currentOrg?.org_name || teams[0];
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Dev User";
  const userRole = currentOrg?.user_role || "lead";
  const pendingCount = 0;

  const handleNavigate = (surface: string) => {
    setCurrentSurface(surface as Surface);
  };

  const handleTeamChange = (teamName: string) => {
    console.log('[App] handleTeamChange called with:', teamName);
    console.log('[App] Available organizations:', organizations.map(o => o.org_name));
    // Find the org by name and select it
    const org = organizations.find(o => o.org_name === teamName);
    if (org) {
      console.log('[App] Found org, selecting:', org.org_id, org.org_name);
      selectOrganization(org.org_id);
    } else {
      console.log('[App] Org not found in organizations array');
    }
  };

  const handleNotificationsClick = () => {
    console.log("Notifications clicked");
  };

  const handleSignOut = async () => {
    console.log('[App] Signing out...');
    // Clear localStorage flags
    localStorage.removeItem('proves_org_selected');
    localStorage.removeItem(GRAPH_PINNED_KEY);
    // Sign out from Supabase
    await signOut();
    // Reset local state
    setShowOrgPicker(false);
    setCurrentSurface("mission-control");
  };

  const handleGraphToggle = () => {
    setGraphVisible(!graphVisible);
  };

  const handleGraphPinToggle = () => {
    setGraphPinned(!graphPinned);
  };

  // Don't show graph controls in Mission Control (always on there)
  const showGraphControls = currentSurface !== "mission-control";

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Header
        currentTeam={currentTeam}
        userRole={userRole}
        pendingCount={pendingCount}
        userName={userName}
        teams={teams}
        onTeamChange={handleTeamChange}
        onNotificationsClick={handleNotificationsClick}
        onSignOut={handleSignOut}
        graphVisible={graphVisible}
        graphPinned={graphPinned}
        onGraphToggle={handleGraphToggle}
        onGraphPinToggle={handleGraphPinToggle}
        showGraphControls={showGraphControls}
      />
      <div className="flex">
        <Navigation
          currentView={currentSurface}
          onNavigate={handleNavigate}
          userRole={userRole}
        />
        <main className="flex-1 overflow-auto bg-[#0f172a] h-[calc(100vh-52px)]">
          {currentSurface === "library" && <LibraryView />}
          {currentSurface === "admin" && <AdminView />}
          {currentSurface === "mission-control" && <MissionControlView />}
        </main>
      </div>
    </div>
  );
}
