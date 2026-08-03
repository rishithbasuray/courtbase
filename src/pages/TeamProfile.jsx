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
        .select("*")
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

  return (
    <>
      <div className="profile-header">
        <div className="container">
          <div>
            <h1>{team.name}</h1>
            <p className="meta">{team.city || "City not set"} · Coach: {team.coach || "Not set"}</p>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="stats-section">
          <h2>Roster</h2>

          {roster.length === 0 ? (
            <p style={{ color: "var(--text)" }}>No players on this roster yet.</p>
          ) : (
            <div className="roster-list">
              {roster.map((player) => (
                <Link to={`/players/${player.id}`} key={player.id}>
                  <span>{player.name}</span>
                  <span style={{ color: "var(--text)", fontWeight: 400 }}>
                    {player.position || "Position not set"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}