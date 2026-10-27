import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Discovery.css";

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [teamMap, setTeamMap] = useState({});
  const [statsMap, setStatsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchData() {
      const { data: playerData, error: playerError } = await supabase
        .from("profiles")
        .select("id, name, position, team_id, verified, profile_photo_url, created_at")
        .eq("role", "Player")
        .order("created_at", { ascending: false });

      if (playerError) {
        setError(playerError.message);
        setLoading(false);
        return;
      }

      const { data: teamData } = await supabase.from("teams").select("id, name");
      const map = {};
      (teamData || []).forEach((t) => (map[t.id] = t.name));

      const ids = (playerData || []).map((p) => p.id);
      const sMap = {};
      if (ids.length > 0) {
        const { data: verifiedRows } = await supabase
          .from("player_verified_stats")
          .select("*")
          .in("player_id", ids);
        (verifiedRows || []).forEach((v) => {
          sMap[v.player_id] = v;
        });
      }

      setPlayers(playerData);
      setTeamMap(map);
      setStatsMap(sMap);
      setLoading(false);
    }

    fetchData();
  }, []);

  const filteredPlayers = players.filter((p) => {
    const query = search.toLowerCase();
    const teamName = teamMap[p.team_id] || "";
    return (
      p.name.toLowerCase().includes(query) ||
      (p.position || "").toLowerCase().includes(query) ||
      teamName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container">
      <div className="page-header">
        <h1>Players</h1>
        <p>Browse verified basketball players on CourtBase.</p>
      </div>

      <div className="team-search-wrap" style={{ maxWidth: 500, margin: "0 auto 30px" }}>
        <input
          type="text"
          className="team-search-input"
          placeholder="Search by name, position, or team..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p style={{ textAlign: "center", color: "var(--text)" }}>Loading players...</p>}
      {error && <p style={{ textAlign: "center", color: "#b91c1c" }}>{error}</p>}

      {!loading && !error && players.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--text)" }}>
          No players have registered yet. Be the first!
        </p>
      )}

      {!loading && !error && players.length > 0 && filteredPlayers.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--text)" }}>
          No players match "{search}".
        </p>
      )}

      <div className="card-grid">
        {filteredPlayers.map((player) => {
          const stats = statsMap[player.id];
          return (
            <Link to={`/players/${player.id}`} className="card" key={player.id}>
              <span className={`badge ${player.verified ? "badge-verified" : "badge-unverified"}`}>
                {player.verified ? "Verified" : "Unverified"}
              </span>

              <h3 style={{ marginTop: 10 }}>{player.name}</h3>
              <p className="subtext">
                {player.position || "Position not set"} · {teamMap[player.team_id] || "Unattached"}
              </p>

              <div className="card-stat-line">
                <div><strong>{stats?.points ?? 0}</strong>Points</div>
                <div><strong>{stats?.assists ?? 0}</strong>Assists</div>
                <div><strong>{stats?.rebounds ?? 0}</strong>Rebounds</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
