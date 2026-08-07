import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "./Discovery.css";

export default function CoachDashboard() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user.team_id) {
        setLoading(false);
        return;
      }

      const { data: teamData } = await supabase
        .from("teams")
        .select("*")
        .eq("id", user.team_id)
        .single();

      const { data: rosterData } = await supabase
        .from("profiles")
        .select("*")
        .eq("team_id", user.team_id)
        .eq("role", "Player");

      setTeam(teamData);
      setRoster(rosterData || []);
      setLoading(false);
    }

    load();
  }, [user.team_id]);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Coach Dashboard</h1>
        <p>Welcome back, {user.name}.</p>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--text)" }}>Loading...</p>
      ) : !user.team_id ? (
        <div style={{ textAlign: "center", padding: "20px 0 60px" }}>
          <p style={{ color: "var(--text)", marginBottom: 16 }}>
            You're not managing a team yet.
          </p>
          <Link to="/profile" className="primary-btn" style={{ textDecoration: "none" }}>
            Create or Join a Team
          </Link>
        </div>
      ) : (
        <div className="stats-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>{team?.name}</h2>
            <Link to="/profile" className="primary-btn" style={{ textDecoration: "none" }}>
              Manage Team
            </Link>
          </div>
          <p style={{ color: "var(--text)", marginBottom: 24 }}>{team?.city}</p>

          <h2>Roster ({roster.length})</h2>
          {roster.length === 0 ? (
            <p style={{ color: "var(--text)" }}>No players on your roster yet.</p>
          ) : (
            <div className="card-grid">
              {roster.map((player) => (
                <Link to={`/players/${player.id}`} className="card" key={player.id}>
                  <span className={`badge ${player.verified ? "badge-verified" : "badge-unverified"}`}>
                    {player.verified ? "Verified" : "Unverified"}
                  </span>
                  <h3 style={{ marginTop: 10 }}>{player.name}</h3>
                  <p className="subtext">{player.position || "Position not set"}</p>
                  <div className="card-stat-line">
                    <div><strong>{player.stats?.points ?? 0}</strong>Points</div>
                    <div><strong>{player.stats?.assists ?? 0}</strong>Assists</div>
                    <div><strong>{player.stats?.rebounds ?? 0}</strong>Rebounds</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}