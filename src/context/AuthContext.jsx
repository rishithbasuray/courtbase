import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "courtbase_user";

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
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch (err) {
      console.error("Failed to load saved user:", err);
    }
    setLoading(false);
  }, []);

  function persist(nextUser) {
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  }

  function register({ name, email, password, role, position }) {
    const newUser = {
      name, email, password, role,
      position: position || "",
      verified: false,
      stats: emptyStats,
      highlights: [],
    };
    persist(newUser);
    return newUser;
  }

  function login({ email, password }) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) throw new Error("No account found. Please register first.");
    const savedUser = JSON.parse(saved);
    if (savedUser.email !== email || savedUser.password !== password) {
      throw new Error("Incorrect email or password.");
    }
    setUser(savedUser);
    return savedUser;
  }

  function logout() {
    setUser(null);
  }

  function updateStats(newStats) {
    if (!user) return;
    const nextUser = { ...user, stats: { ...user.stats, ...newStats } };
    persist(nextUser);
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateStats }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}