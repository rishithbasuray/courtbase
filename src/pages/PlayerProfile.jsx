import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Discovery.css";

export default function PlayerProfile() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [teamName, setTeamName] = useState(null);
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

      setLoading(false);
    }

    fetchPlayer();
  }, [id]);

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
          <p style={{ color: "var(--text)" }}>No highlights uploaded yet.</p>
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