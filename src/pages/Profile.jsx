import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
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

function detectType(url) {
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/drive\.google\.com/i.test(url)) return "drive";
  return null;
}

export default function Profile() {
  const { user, updateStats, setTeam, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(user.stats);

  const [teams, setTeams] = useState([]);
  const [teamSaving, setTeamSaving] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", city: "", coach: "" });

  const [teamSearch, setTeamSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const blurTimeout = useRef(null);

  const [highlights, setHighlights] = useState([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [newHighlight, setNewHighlight] = useState({ title: "", url: "" });
  const [highlightError, setHighlightError] = useState("");
  const [addingHighlight, setAddingHighlight] = useState(false);
  const [highlightToDelete, setHighlightToDelete] = useState(null);

  useEffect(() => {
    fetchTeams();
    fetchHighlights();
  }, []);

  useEffect(() => {
    const current = teams.find((t) => t.id === user.team_id);
    setTeamSearch(current ? current.name : "");
  }, [teams, user.team_id]);

  async function fetchTeams() {
    const { data } = await supabase.from("teams").select("*").order("name");
    setTeams(data || []);
  }

  async function fetchHighlights() {
    const { data, error } = await supabase
      .from("highlights")
      .select("*")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setHighlights(data || []);
    setHighlightsLoading(false);
  }

  async function handleAddHighlight(e) {
    e.preventDefault();
    setHighlightError("");

    if (!newHighlight.title || !newHighlight.url) {
      setHighlightError("Please fill in both a title and a link.");
      return;
    }

    const type = detectType(newHighlight.url);
    if (!type) {
      setHighlightError("Please use a YouTube or Google Drive link.");
      return;
    }

    setAddingHighlight(true);
    const { error } = await supabase.from("highlights").insert({
      player_id: user.id,
      title: newHighlight.title,
      url: newHighlight.url,
      type,
    });
    setAddingHighlight(false);

    if (error) {
      setHighlightError(error.message);
      return;
    }

    setNewHighlight({ title: "", url: "" });
    fetchHighlights();
  }

  async function handleDeleteHighlight(id) {
    const { error } = await supabase.from("highlights").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setHighlights(highlights.filter((h) => h.id !== id));
  }

  async function confirmDeleteHighlight() {
    if (!highlightToDelete) return;
    await handleDeleteHighlight(highlightToDelete.id);
    setHighlightToDelete(null);
  }

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(teamSearch.toLowerCase())
  );

  async function selectTeam(teamId) {
    setDropdownOpen(false);
    setTeamSaving(true);
    try {
      await setTeam(teamId);
    } catch (err) {
      alert(err.message);
    } finally {
      setTeamSaving(false);
    }
  }

  function handleLeaveClick() {
    setShowLeaveConfirm(true);
  }

  async function confirmLeaveTeam() {
    setShowLeaveConfirm(false);
    setTeamSaving(true);
    try {
      await setTeam(null);
      setTeamSearch("");
    } catch (err) {
      alert(err.message);
    } finally {
      setTeamSaving(false);
    }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    if (!newTeam.name) return;

    const { data, error } = await supabase
      .from("teams")
      .insert({ name: newTeam.name, city: newTeam.city, coach: newTeam.coach, created_by: user.id })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    await fetchTeams();
    await setTeam(data.id);
    setShowCreateTeam(false);
    setNewTeam({ name: "", city: "", coach: "" });
  }

  function handleChange(key, value) {
    setForm({ ...form, [key]: value === "" ? "" : Number(value) });
  }

  function handleSave(e) {
    e.preventDefault();
    updateStats(form);
    setEditing(false);
  }

  const currentTeamName = teams.find((t) => t.id === user.team_id)?.name;

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
        {(user.role === "Player" || user.role === "Coach") && (
          <div className="stats-section" style={{ paddingBottom: 20 }}>
            <h2>{user.role === "Coach" ? "My Team (Coaching)" : "My Team"}</h2>

            <div className="team-search-wrap">
              <input
                type="text"
                className="team-search-input"
                placeholder="Search for a team..."
                value={teamSearch}
                disabled={teamSaving}
                onChange={(e) => {
                  setTeamSearch(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => {
                  blurTimeout.current = setTimeout(() => setDropdownOpen(false), 150);
                }}
              />

              {dropdownOpen && (
                <div className="team-dropdown">
                  <div
                    className="team-dropdown-item"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectTeam(null)}
                  >
                    No team (Unattached)
                  </div>

                  {filteredTeams.length === 0 && teamSearch && (
                    <div className="team-dropdown-empty">No teams match "{teamSearch}"</div>
                  )}

                  {filteredTeams.map((t) => (
                    <div
                      key={t.id}
                      className="team-dropdown-item"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectTeam(t.id)}
                    >
                      {t.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!showCreateTeam ? (
              <div style={{ maxWidth: 400 }}>
                <button
                  type="button"
                  className="primary-btn"
                  style={{ background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)", width: "100%" }}
                  onClick={() => setShowCreateTeam(true)}
                >
                  + Create a New Team
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateTeam} style={{ maxWidth: 400, marginTop: 14 }}>
                <label>Team Name</label>
                <input
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="Riverside Hawks"
                />
                <label>City</label>
                <input
                  value={newTeam.city}
                  onChange={(e) => setNewTeam({ ...newTeam, city: e.target.value })}
                  placeholder="Riverside"
                />
                <label>Coach</label>
                <input
                  value={newTeam.coach}
                  onChange={(e) => setNewTeam({ ...newTeam, coach: e.target.value })}
                  placeholder="Coach Name"
                />
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button type="submit" className="primary-btn">Create & Join</button>
                  <button type="button" className="primary-btn" style={{ background: "#6b7280" }} onClick={() => setShowCreateTeam(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {user.role === "Player" && (
        <div className="stats-section">
          <h2>My Highlights</h2>

          {highlightsLoading ? (
            <p style={{ color: "var(--text)" }}>Loading highlights...</p>
          ) : highlights.length === 0 ? (
            <p style={{ color: "var(--text)", marginBottom: 16 }}>
              No highlights added yet.
            </p>
          ) : (
            <ul className="highlight-list" style={{ marginBottom: 20 }}>
              {highlights.map((h) => (
                <li key={h.id}>
                  <span>{h.title}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <a href={h.url} target="_blank" rel="noreferrer">
                      Watch ({h.type})
                    </a>
                    <button
                      type="button"
                      onClick={() => setHighlightToDelete(h)}
                      style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", fontWeight: 700, padding: 0 }}
                    >
                      Remove
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddHighlight} style={{ maxWidth: 420 }}>
            {highlightError && <div className="auth-error">{highlightError}</div>}

            <label>Title</label>
            <input
              value={newHighlight.title}
              onChange={(e) => setNewHighlight({ ...newHighlight, title: e.target.value })}
              placeholder="Season Highlight Reel"
            />

            <label>YouTube or Google Drive Link</label>
            <input
              value={newHighlight.url}
              onChange={(e) => setNewHighlight({ ...newHighlight, url: e.target.value })}
              placeholder="https://youtube.com/..."
            />

            <button type="submit" className="primary-btn" style={{ marginTop: 14 }} disabled={addingHighlight}>
              {addingHighlight ? "Adding..." : "+ Add Highlight"}
            </button>
          </form>
        </div>
        )}

        {user.role === "Player" && (
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
        )}

        <div style={{ display: "flex", gap: 12, marginBottom: 60 }}>
          {(user.role === "Player" || user.role === "Coach") && user.team_id && (
            <button
              className="primary-btn"
              style={{ background: "transparent", color: "#b91c1c", border: "1px solid #b91c1c" }}
              onClick={handleLeaveClick}
            >
              Leave Team
            </button>
          )}
          <button className="primary-btn" style={{ background: "#6b7280" }} onClick={logout}>
            Log Out
          </button>
        </div>
      </div>

      {showLeaveConfirm && (
        <div className="modal-overlay" onClick={() => setShowLeaveConfirm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Leave {currentTeamName}?</h3>
            <p>
              Are you sure you want to leave this team? You'll become
              unattached and can join another team anytime.
            </p>
            <div className="modal-actions">
              <button
                className="primary-btn"
                style={{ background: "#b91c1c" }}
                onClick={confirmLeaveTeam}
              >
                Yes, Leave Team
              </button>
              <button
                className="primary-btn"
                style={{ background: "#6b7280" }}
                onClick={() => setShowLeaveConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {highlightToDelete && (
        <div className="modal-overlay" onClick={() => setHighlightToDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Remove "{highlightToDelete.title}"?</h3>
            <p>This will permanently remove this highlight from your profile.</p>
            <div className="modal-actions">
              <button className="primary-btn" style={{ background: "#b91c1c" }} onClick={confirmDeleteHighlight}>
                Yes, Remove
              </button>
              <button className="primary-btn" style={{ background: "#6b7280" }} onClick={() => setHighlightToDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}