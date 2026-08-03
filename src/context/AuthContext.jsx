import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

const emptyStats = {
  gamesPlayed: 0, minutes: 0, points: 0, assists: 0, rebounds: 0,
  offRebounds: 0, defRebounds: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0,
  fgm: 0, fga: 0, fgPct: 0, threeM: 0, threeA: 0, threePct: 0,
  ftm: 0, fta: 0, ftPct: 0,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to load profile:", error);
    } else {
      setUser(data);
    }
    setLoading(false);
  }

  async function register({ name, email, password, role, position }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      name,
      email,
      role,
      position: position || "",
      verified: false,
      stats: emptyStats,
      team_id: null,
    });
    if (profileError) throw profileError;

    if (data.session) {
      await loadProfile(data.user.id);
    }
  }

  async function login({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function updateStats(newStats) {
    if (!user) return;
    const merged = { ...user.stats, ...newStats };
    const { error } = await supabase
      .from("profiles")
      .update({ stats: merged })
      .eq("id", user.id);
    if (error) throw error;
    setUser({ ...user, stats: merged });
  }

  async function setTeam(teamId) {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ team_id: teamId })
      .eq("id", user.id);
    if (error) throw error;
    setUser({ ...user, team_id: teamId });
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateStats, setTeam }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}