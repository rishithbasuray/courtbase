import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Discovery.css";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTeams() {
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: false });

      if (teamError) {
        setError(teamError.message);
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("team_id")
        .not("team_id", "is", null);

      const countMap = {};
      (profileData || []).forEach((p) => {
        countMap[p.team_id] = (countMap[p.team_id] || 0) + 1;
      });

      setTeams(teamData);
      setCounts(countMap);
      setLoading(false);
    }

    fetchTeams();
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Teams</h1>
        <p>Browse teams competing on CourtBase.</p>
      </div>

      {loading && <p style={{ textAlign: "center", color: "var(--text)" }}>Loading teams...</p>}
      {error && <p style={{ textAlign: "center", color: "#b91c1c" }}>{error}</p>}

      {!loading && !error && teams.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--text)" }}>
          No teams have been created yet.
        </p>
      )}

      <div className="card-grid">
        {teams.map((team) => (
          <Link to={`/teams/${team.id}`} className="card" key={team.id}>
            <h3>{team.name}</h3>
            <p className="subtext">{team.city || "City not set"}</p>
            <p className="subtext">Coach: {team.coach || "Not set"}</p>

            <div className="card-stat-line">
              <div><strong>{counts[team.id] || 0}</strong>Players</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}