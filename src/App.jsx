import { useEffect } from "react";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./routes/ProtectedRoute";
import { supabase } from "./lib/supabase";

import Home from "./pages/Home";
import Players from "./pages/Players";
import PlayerProfile from "./pages/PlayerProfile";
import Teams from "./pages/Teams";
import TeamProfile from "./pages/TeamProfile";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import CoachDashboard from "./pages/CoachDashboard";
import OfficialDashboard from "./pages/OfficialDashboard";
import ScoutDashboard from "./pages/ScoutDashboard";
import NotFound from "./pages/NotFound";
import Tournaments from "./pages/Tournaments";
import TournamentProfile from "./pages/TournamentProfile";

// Supabase's password-recovery link appends its own token onto the redirect
// URL we give it, which can land oddly alongside HashRouter's own use of the
// "#" fragment. Rather than depend on that URL parsing to route correctly,
// this listens for the PASSWORD_RECOVERY event supabase-js fires once it has
// turned that token into a real session -- at that point we know a session
// exists no matter how the visible URL looks, so we just force the route.
function AuthRecoveryRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password", { replace: true });
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  return null;
}

function App() {
  return (
    <HashRouter>
      <AuthRecoveryRedirect />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Navbar />

        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/players" element={<Players />} />
            <Route path="/players/:id" element={<PlayerProfile />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:id" element={<TeamProfile />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route
              path="/tournaments/:id"
              element={<TournamentProfile />}
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/coach-dashboard"
              element={
                <ProtectedRoute>
                  <CoachDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/official-dashboard"
              element={
                <ProtectedRoute>
                  <OfficialDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/scout-dashboard"
              element={
                <ProtectedRoute>
                  <ScoutDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </HashRouter>
  );
}

export default App;