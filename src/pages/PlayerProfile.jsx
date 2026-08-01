import { useParams, Link } from "react-router-dom";
import { players, teams } from "../data/mockData";
import "./Discovery.css";

export default function PlayerProfile() {
  const { id } = useParams();
  const player = players.find((p) => p.id === id);

  if (!player) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Player Not Found</h1>
          <p>We couldn't find that player. <Link to="/players">Back to Players</Link></p>
        </div>
      </div>
    );
  }

  const team = teams.find((t) => t.id === player.teamId);
  const s = player.stats;

  return (
    <>
      <div className="profile-header">
        <div className="container">
          <div>
            <h1>{player.name}</h1>
            <p className="meta">
              {player.position} · {team ? team.name : "Unattached"} · Age {player.age} · {player.height}
            </p>
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
            <StatBox label="Games Played" value={s.gamesPlayed} />
            <StatBox label="Minutes" value={s.minutes} />
            <StatBox label="Points" value={s.points} />
            <StatBox label="Assists" value={s.assists} />
            <StatBox label="Rebounds" value={s.rebounds} />
            <StatBox label="Off. Rebounds" value={s.offRebounds} />
            <StatBox label="Def. Rebounds" value={s.defRebounds} />
            <StatBox label="Steals" value={s.steals} />
            <StatBox label="Blocks" value={s.blocks} />
            <StatBox label="Turnovers" value={s.turnovers} />
            <StatBox label="Fouls" value={s.fouls} />
          </div>

          <h2>Shooting Statistics</h2>
          <div className="stats-grid">
            <StatBox label="FGM" value={s.fgm} />
            <StatBox label="FGA" value={s.fga} />
            <StatBox label="FG%" value={`${s.fgPct}%`} />
            <StatBox label="3PM" value={s.threeM} />
            <StatBox label="3PA" value={s.threeA} />
            <StatBox label="3P%" value={`${s.threePct}%`} />
            <StatBox label="FTM" value={s.ftm} />
            <StatBox label="FTA" value={s.fta} />
            <StatBox label="FT%" value={`${s.ftPct}%`} />
          </div>

          <h2>Highlights</h2>
          {player.highlights.length === 0 ? (
            <p style={{ color: "var(--text)" }}>No highlights uploaded yet.</p>
          ) : (
            <ul className="highlight-list">
              {player.highlights.map((h, i) => (
                <li key={i}>
                  <span>{h.title}</span>
                  <a href={h.url} target="_blank" rel="noreferrer">Watch ({h.type})</a>
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