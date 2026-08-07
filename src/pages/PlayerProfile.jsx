import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import "./Discovery.css";

export default function PlayerProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [player, setPlayer] = useState(null);
  const [teamName, setTeamName] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [watchId, setWatchId] = useState(null);
  const [watchLoading, setWatchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPlayer() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setError("Player not found.");
        setLoading(false);
        return;
      }

      setPlayer(data);

      if (data.team_id) {
        const { data: team } = await supabase
          .from("teams")
          .select("name")
          .eq("id", data.team_id)
          .single();
        setTeamName(team?.name || null);
      }

      const { data: highlightData } = await supabase
        .from("highlights")
        .select("*")
        .eq("player_id", id)
        .order("created_at", { ascending: false });
      setHighlights(highlightData || []);

      if (user && user.role === "Scout") {
        const { data: watchData } = await supabase
          .from("watchlist")
          .select("id")
          .eq("scout_id", user.id)
          .eq("player_id", id)
          .maybeSingle();
        setWatchId(watchData?.id || null);
      }

      setLoading(false);
    }

    fetchPlayer();
  }, [id, user]);

  async function toggleWatchlist() {
    setWatchLoading(true);
    if (watchId) {
      const { error } = await supabase.from("watchlist").delete().eq("id", watchId);
      if (!error) setWatchId(null);
    } else {
      const { data, error } = await supabase
        .from("watchlist")
        .insert({ scout_id: user.id, player_id: id })
        .select()
        .single();
      if (!error) setWatchId(data.id);
    }
    setWatchLoading(false);
  }

  if (loading) {
    return (
      <div className="container">
        <p style={{ textAlign: "center", color: "var(--text)", padding: "60px 0" }}>Loading player...</p>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Player Not Found</h1>
          <p>We couldn't find that player. <Link to="/players">Back to Players</Link></p>
        </div>
      </div>
    );
  }

  const s = player.stats || {};

  return (
    <>
      <div className="profile-header">
        <div className="container">
          <div>
            <h1>{player.name}</h1>
            <p className="meta">{player.position || "Position not set"} · {teamName || "Unattached"}</p>
          </div>

          <span className={`badge ${player.verified ? "badge-verified" : "badge-unverified"}`}>
            {player.verified ? "Verified" : "Unverified"}
          </span>

          {user && user.role === "Scout" && (
            <button
              className="primary-btn"
              style={watchId ? { background: "#6b7280" } : {}}
              onClick={toggleWatchlist}
              disabled={watchLoading}
            >
              {watchId ? "Remove from Watchlist" : "+ Add to Watchlist"}
            </button>
          )}
        </div>
      </div>

      <div className="container">
        <div className="stats-section">
          <h2>Basic Statistics</h2>
          <div className="stats-grid">
            <StatBox label="Games Played" value={s.gamesPlayed ?? 0} />
            <StatBox label="Minutes" value={s.minutes ?? 0} />
            <StatBox label="Points" value={s.points ?? 0} />
            <StatBox label="Assists" value={s.assists ?? 0} />
            <StatBox label="Rebounds" value={s.rebounds ?? 0} />
            <StatBox label="Off. Rebounds" value={s.offRebounds ?? 0} />
            <StatBox label="Def. Rebounds" value={s.defRebounds ?? 0} />
            <StatBox label="Steals" value={s.steals ?? 0} />
            <StatBox label="Blocks" value={s.blocks ?? 0} />
            <StatBox label="Turnovers" value={s.turnovers ?? 0} />
            <StatBox label="Fouls" value={s.fouls ?? 0} />
          </div>

          <h2>Shooting Statistics</h2>
          <div className="stats-grid">
            <StatBox label="FGM" value={s.fgm ?? 0} />
            <StatBox label="FGA" value={s.fga ?? 0} />
            <StatBox label="FG%" value={`${s.fgPct ?? 0}%`} />
            <StatBox label="3PM" value={s.threeM ?? 0} />
            <StatBox label="3PA" value={s.threeA ?? 0} />
            <StatBox label="3P%" value={`${s.threePct ?? 0}%`} />
            <StatBox label="FTM" value={s.ftm ?? 0} />
            <StatBox label="FTA" value={s.fta ?? 0} />
            <StatBox label="FT%" value={`${s.ftPct ?? 0}%`} />
          </div>

          <h2>Highlights</h2>
          {highlights.length === 0 ? (
            <p style={{ color: "var(--text)" }}>No highlights uploaded yet.</p>
          ) : (
            <ul className="highlight-list">
              {highlights.map((h) => (
                <li key={h.id}>
                  <span>{h.title}</span>
                  <a href={h.url} target="_blank" rel="noreferrer">
                    Watch ({h.type})
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="stat-box">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}