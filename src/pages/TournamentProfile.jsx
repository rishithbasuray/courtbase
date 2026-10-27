import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "./Discovery.css";
import "./Auth.css";

export default function TournamentProfile() {
  const { id } = useParams();
  const { user } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddMatch, setShowAddMatch] = useState(false);
  const [matchForm, setMatchForm] = useState({ team_a_id: "", team_b_id: "", match_date: "" });
  const [matchError, setMatchError] = useState("");
  const [savingMatch, setSavingMatch] = useState(false);

  const [scoreEdits, setScoreEdits] = useState({});
  const [registering, setRegistering] = useState(false);

  const isCreator = tournament && user && tournament.created_by === user.id;
  const myTeamRegistered = user && user.team_id && teams.some((t) => t.id === user.team_id);

  useEffect(() => {
    loadAll();
  }, [id]);

  async function loadAll() {
    setLoading(true);

    const { data: tournamentData } = await supabase.from("tournaments").select("*").eq("id", id).single();
    setTournament(tournamentData);

    const { data: teamLinks } = await supabase
      .from("tournament_teams")
      .select("team_id, teams:team_id (id, name, city)")
      .eq("tournament_id", id);
    const registeredTeams = (teamLinks || []).map((tl) => tl.teams).filter(Boolean);
    setTeams(registeredTeams);

    const { data: matchData } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", id)
      .order("match_date", { ascending: true });
    setMatches(matchData || []);

    const { data: teamsData } = await supabase.from("teams").select("id, name, created_by");
    setAllTeams(teamsData || []);

    setLoading(false);
  }

  async function handleRegisterTeam() {
    if (!user?.team_id) return;
    setRegistering(true);
    const { error } = await supabase.rpc("register_team_for_tournament", {
      p_tournament_id: id,
    });
    setRegistering(false);
    if (error) {
      alert(error.message);
      return;
    }
    loadAll();
  }

  async function handleAddMatch(e) {
    e.preventDefault();
    setMatchError("");

    if (!matchForm.team_a_id || !matchForm.team_b_id) {
      setMatchError("Please select both teams.");
      return;
    }
    if (matchForm.team_a_id === matchForm.team_b_id) {
      setMatchError("Teams must be different.");
      return;
    }

    setSavingMatch(true);
    const { error } = await supabase.rpc("add_tournament_match", {
      p_tournament_id: id,
      p_team_a_id: matchForm.team_a_id,
      p_team_b_id: matchForm.team_b_id,
      p_match_date: matchForm.match_date || null,
    });
    setSavingMatch(false);

    if (error) {
      setMatchError(error.message);
      return;
    }

    setMatchForm({ team_a_id: "", team_b_id: "", match_date: "" });
    setShowAddMatch(false);
    loadAll();
  }

  function handleScoreChange(matchId, field, value) {
    setScoreEdits({
      ...scoreEdits,
      [matchId]: { ...scoreEdits[matchId], [field]: value },
    });
  }

  async function saveScore(match) {
    const edits = scoreEdits[match.id] || {};
    const team_a_score = edits.team_a_score !== undefined ? Number(edits.team_a_score) : match.team_a_score;
    const team_b_score = edits.team_b_score !== undefined ? Number(edits.team_b_score) : match.team_b_score;

    const { error } = await supabase.rpc("record_match_score", {
      p_match_id: match.id,
      p_team_a_score: team_a_score,
      p_team_b_score: team_b_score,
    });

    if (error) {
      alert(error.message);
      return;
    }
    loadAll();
  }

  function teamName(teamId) {
    return teams.find((t) => t.id === teamId)?.name || allTeams.find((t) => t.id === teamId)?.name || "Unknown Team";
  }

  if (loading) {
    return <div className="container"><p style={{ textAlign: "center", color: "var(--text)", padding: "60px 0" }}>Loading tournament...</p></div>;
  }

  if (!tournament) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Tournament Not Found</h1>
          <p>We couldn't find that tournament. <Link to="/tournaments">Back to Tournaments</Link></p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="profile-header">
        <div className="container">
          <div>
            <h1>{tournament.name}</h1>
            <p className="meta">
              {tournament.location || "Location TBD"} ·{" "}
              {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : "Date TBD"}
              {tournament.end_date ? ` – ${new Date(tournament.end_date).toLocaleDateString()}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="container">
        {tournament.description && (
          <div className="stats-section" style={{ paddingBottom: 0 }}>
            <p style={{ color: "var(--text)", lineHeight: 1.8 }}>{tournament.description}</p>
          </div>
        )}

        <div className="stats-section">
          <h2>Registered Teams ({teams.length})</h2>

          {user && user.role === "Coach" && user.team_id && !myTeamRegistered && (
            <button className="primary-btn" onClick={handleRegisterTeam} disabled={registering} style={{ marginBottom: 20 }}>
              {registering ? "Registering..." : "Register My Team"}
            </button>
          )}

          {teams.length === 0 ? (
            <p style={{ color: "var(--text)" }}>No teams registered yet.</p>
          ) : (
            <div className="roster-list">
              {teams.map((t) => (
                <Link to={`/teams/${t.id}`} key={t.id}>
                  <span>{t.name}</span>
                  <span style={{ color: "var(--text)", fontWeight: 400 }}>{t.city}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="stats-section" style={{ marginBottom: 60 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Matches</h2>
            {isCreator && !showAddMatch && (
              <button className="primary-btn" onClick={() => setShowAddMatch(true)}>+ Add Match</button>
            )}
          </div>

          {isCreator && showAddMatch && (
            <form onSubmit={handleAddMatch} className="auth-card" style={{ boxShadow: "none", maxWidth: 420, marginBottom: 24 }}>
              {matchError && <div className="auth-error">{matchError}</div>}

              <label>Team A</label>
              <select value={matchForm.team_a_id} onChange={(e) => setMatchForm({ ...matchForm, team_a_id: e.target.value })}>
                <option value="">Select team</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>

              <label>Team B</label>
              <select value={matchForm.team_b_id} onChange={(e) => setMatchForm({ ...matchForm, team_b_id: e.target.value })}>
                <option value="">Select team</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>

              <label>Match Date</label>
              <input type="date" value={matchForm.match_date} onChange={(e) => setMatchForm({ ...matchForm, match_date: e.target.value })} />

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button type="submit" className="primary-btn" disabled={savingMatch}>
                  {savingMatch ? "Saving..." : "Add Match"}
                </button>
                <button type="button" className="primary-btn" style={{ background: "#6b7280" }} onClick={() => setShowAddMatch(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {matches.length === 0 ? (
            <p style={{ color: "var(--text)" }}>No matches scheduled yet.</p>
          ) : (
            <ul className="highlight-list">
              {matches.map((m) => (
                <li key={m.id} style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>
                      {teamName(m.team_a_id)} vs {teamName(m.team_b_id)}
                    </span>
                    <span style={{ color: "var(--text)", fontSize: "0.85rem" }}>
                      {m.match_date ? new Date(m.match_date).toLocaleDateString() : "Date TBD"} ·{" "}
                      <span className={`badge ${m.status === "completed" ? "badge-verified" : "badge-unverified"}`}>
                        {m.status}
                      </span>
                    </span>
                  </div>

                  {isCreator ? (
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="number"
                        placeholder="Score A"
                        defaultValue={m.team_a_score ?? ""}
                        onChange={(e) => handleScoreChange(m.id, "team_a_score", e.target.value)}
                        style={{ width: 90, padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6 }}
                      />
                      <span>–</span>
                      <input
                        type="number"
                        placeholder="Score B"
                        defaultValue={m.team_b_score ?? ""}
                        onChange={(e) => handleScoreChange(m.id, "team_b_score", e.target.value)}
                        style={{ width: 90, padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6 }}
                      />
                      <button className="primary-btn" style={{ padding: "8px 16px" }} onClick={() => saveScore(m)}>
                        Save Score
                      </button>
                    </div>
                  ) : (
                    m.status === "completed" && (
                      <div style={{ fontWeight: 700 }}>
                        {m.team_a_score} – {m.team_b_score}
                      </div>
                    )
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}