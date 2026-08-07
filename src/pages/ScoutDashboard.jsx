import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "./Discovery.css";

export default function ScoutDashboard() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  async function fetchWatchlist() {
    const { data, error } = await supabase
      .from("watchlist")
      .select("id, player_id, profiles:player_id (id, name, position, verified, stats)")
      .eq("scout_id", user.id);

    if (!error) setWatchlist(data || []);
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
                  <div><strong>{p.stats?.points ?? 0}</strong>Points</div>
                  <div><strong>{p.stats?.assists ?? 0}</strong>Assists</div>
                  <div><strong>{p.stats?.rebounds ?? 0}</strong>Rebounds</div>
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