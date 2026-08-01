import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Discovery.css";
import "./Auth.css";

const statFields = [
  ["gamesPlayed", "Games Played"], ["minutes", "Minutes"], ["points", "Points"],
  ["assists", "Assists"], ["rebounds", "Rebounds"], ["offRebounds", "Off. Rebounds"],
  ["defRebounds", "Def. Rebounds"], ["steals", "Steals"], ["blocks", "Blocks"],
  ["turnovers", "Turnovers"], ["fouls", "Fouls"], ["fgm", "FGM"], ["fga", "FGA"],
  ["fgPct", "FG%"], ["threeM", "3PM"], ["threeA", "3PA"], ["threePct", "3P%"],
  ["ftm", "FTM"], ["fta", "FTA"], ["ftPct", "FT%"],
];

export default function Profile() {
  const { user, updateStats, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(user.stats);

  function handleChange(key, value) {
    setForm({ ...form, [key]: value === "" ? "" : Number(value) });
  }

  function handleSave(e) {
    e.preventDefault();
    updateStats(form);
    setEditing(false);
  }

  return (
    <>
      <div className="profile-header">
        <div className="container">
          <div>
            <h1>{user.name}</h1>
            <p className="meta">
              {user.role}{user.position ? ` · ${user.position}` : ""} · {user.email}
            </p>
          </div>

          <span className={`badge ${user.verified ? "badge-verified" : "badge-unverified"}`}>
            {user.verified ? "Verified" : "Pending Verification"}
          </span>
        </div>
      </div>

      <div className="container">
        <div className="stats-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>My Statistics</h2>
            {!editing && (
              <button className="primary-btn" onClick={() => { setForm(user.stats); setEditing(true); }}>
                Edit Stats
              </button>
            )}
          </div>

          {!user.verified && (
            <p style={{ color: "var(--text)", marginBottom: 20 }}>
              Your statistics are self-reported and haven't been verified yet.
              A coach or tournament official needs to confirm them before
              they're marked verified on your public profile.
            </p>
          )}

          {editing ? (
            <form onSubmit={handleSave}>
              <div className="stats-grid">
                {statFields.map(([key, label]) => (
                  <div key={key} className="stat-box">
                    <input
                      type="number"
                      value={form[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      style={{ width: "100%", border: "none", textAlign: "center", fontSize: "1.2rem", fontWeight: 800, color: "var(--accent)", background: "transparent" }}
                    />
                    <div className="label">{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" className="primary-btn">Save Stats</button>
                <button type="button" className="primary-btn" style={{ background: "#6b7280" }} onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="stats-grid">
              {statFields.map(([key, label]) => (
                <div key={key} className="stat-box">
                  <div className="value">{user.stats[key]}</div>
                  <div className="label">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="primary-btn" style={{ background: "#6b7280", marginBottom: 60 }} onClick={logout}>
          Log Out
        </button>
      </div>
    </>
  );
}