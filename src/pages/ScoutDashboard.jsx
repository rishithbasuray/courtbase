import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "./Discovery.css";

export default function ScoutDashboard() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchWatchlist() {
    const { data, error } = await supabase
      .from("watchlist")
      .select("id, player_id, profiles:player_id (id, name, position, verified)")
      .eq("scout_id", user.id);

    if (!error) {
      const rows = data || [];
      setWatchlist(rows);

      const ids = rows.map((w) => w.player_id).filter(Boolean);
      if (ids.length > 0) {
        const { data: verifiedRows } = await supabase
          .from("player_verified_stats")
          .select("*")
          .in("player_id", ids);
        const map = {};
        (verifiedRows || []).forEach((v) => (map[v.player_id] = v));
        setStatsMap(map);
      }
    }
    setLoading(false);
  }

  async function handleRemove(watchId) {
    const { error } = await supabase.from("watchlist").delete().eq("id", watchId);
    if (!error) setWatchlist(watchlist.filter((w) => w.id !== watchId));
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Scout Dashboard</h1>
        <p>Your watchlist of players to track.</p>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--text)" }}>Loading...</p>
      ) : watchlist.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0 60px" }}>
          <p style={{ color: "var(--text)", marginBottom: 16 }}>
            Your watchlist is empty. Browse players and add anyone you want to track.
          </p>
          <Link to="/players" className="primary-btn" style={{ textDecoration: "none" }}>
            Browse Players
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {watchlist.map((w) => {
            const p = w.profiles;
            if (!p) return null;
            const stats = statsMap[p.id];
            return (
              <div className="card" key={w.id}>
                <span className={`badge ${p.verified ? "badge-verified" : "badge-unverified"}`}>
                  {p.verified ? "Verified" : "Unverified"}
                </span>
                <h3 style={{ marginTop: 10 }}>
                  <Link to={`/players/${p.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {p.name}
                  </Link>
                </h3>
                <p className="subtext">{p.position || "Position not set"}</p>
                <div className="card-stat-line">
                  <div><strong>{stats?.points ?? 0}</strong>Points</div>
                  <div><strong>{stats?.assists ?? 0}</strong>Assists</div>
                  <div><strong>{stats?.rebounds ?? 0}</strong>Rebounds</div>
                </div>
                <button
                  className="primary-btn"
                  style={{ background: "#6b7280", width: "100%", marginTop: 14 }}
                  onClick={() => handleRemove(w.id)}
                >
                  Remove from Watchlist
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
