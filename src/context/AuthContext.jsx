import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

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
    // The profiles row is created server-side by a trigger on auth.users
    // (see the 20260910130000 migration), in the same transaction as the
    // signup itself -- that's what makes this atomic instead of the old
    // two-step signUp-then-insert, which could leave an orphaned auth user
    // with no profile if anything failed in between. We just pass the
    // profile fields along as signup metadata for the trigger to read back.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, position: position || "" },
      },
    });
    if (error) throw error;

    if (data.session) {
      await loadProfile(data.user.id);
    }
  }

  async function login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();
    if (profileError) throw profileError;

    return profile;
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

  async function updateProfilePhoto(profilePhotoUrl) {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ profile_photo_url: profilePhotoUrl })
      .eq("id", user.id);
    if (error) throw error;
    setUser({ ...user, profile_photo_url: profilePhotoUrl });
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

  async function changePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async function changeEmail(newEmail) {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  }

  async function deleteAccount() {
    if (!user) return;
    // NOTE: this removes the profile row and signs the user out. Fully
    // deleting the underlying Supabase Auth account requires a service-role
    // key, which must never live in frontend code — that part needs a
    // proper backend function later. For now this is a partial delete.
    const { error } = await supabase.from("profiles").delete().eq("id", user.id);
    if (error) throw error;
    await supabase.auth.signOut();
    setUser(null);
  }

  async function refreshProfile() {
    if (!user) return;
    await loadProfile(user.id);
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateStats, updateProfilePhoto, setTeam, refreshProfile, changePassword, changeEmail, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
