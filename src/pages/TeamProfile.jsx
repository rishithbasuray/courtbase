import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Discovery.css";

export default function TeamProfile() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTeam() {
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", id)
        .single();

      if (teamError) {
        setError("Team not found.");
        setLoading(false);
        return;
      }

      const { data: rosterData } = await supabase
        .from("profiles")
        .select("id, name, position")
        .eq("team_id", id);

      setTeam(teamData);
      setRoster(rosterData || []);
      setLoading(false);
    }

    fetchTeam();
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <p style={{ textAlign: "center", color: "var(--text)", padding: "60px 0" }}>Loading team...</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Team Not Found</h1>
          <p>We couldn't find that team. <Link to="/teams">Back to Teams</Link></p>
        </div>
      </div>
    );
  }

  const teamInitials = (team.name || "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const playerInitials = (name) =>
    (name || "")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <>
      <div className="team-record-hero">
        <div className="container team-record-layout">
          <div className="team-record-mark" aria-hidden="true">
            <span>{teamInitials || "CB"}</span>
          </div>
          <div className="team-record-copy">
            <div className="profile-kicker">CourtBase Team</div>
            <h1>{team.name}</h1>
            <p className="meta">{team.city || "City not set"} · Coach: {team.coach || "Not set"}</p>
          </div>
        </div>
      </div>

      <div className="player-profile-shell">
        <div className="container">
          <section className="stats-section">
            <div className="section-heading-row">
              <div>
                <p className="section-eyebrow">Roster</p>
                <h2>Team Roster ({roster.length})</h2>
              </div>
            </div>

            {roster.length === 0 ? (
              <div className="empty-panel">No players on this roster yet.</div>
            ) : (
              <div className="roster-grid">
                {roster.map((player) => (
                  <Link to={`/players/${player.id}`} key={player.id} className="roster-card">
                    <span className="roster-card-avatar">{playerInitials(player.name)}</span>
                    <span>
                      <span className="roster-card-name">{player.name}</span>
                      <span className="roster-card-position">{player.position || "Position not set"}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}