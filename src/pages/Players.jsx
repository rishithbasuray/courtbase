import { Link } from "react-router-dom";
import { players, teams } from "../data/mockData";
import "./Discovery.css";

function teamName(teamId) {
  const team = teams.find((t) => t.id === teamId);
  return team ? team.name : "Unattached";
}

export default function Players() {
  return (
    <div className="container">
      <div className="page-header">
        <h1>Players</h1>
        <p>Browse verified basketball players on CourtBase.</p>
      </div>

      <div className="card-grid">
        {players.map((player) => (
          <Link to={`/players/${player.id}`} className="card" key={player.id}>
            <span className={`badge ${player.verified ? "badge-verified" : "badge-unverified"}`}>
              {player.verified ? "Verified" : "Unverified"}
            </span>

            <h3 style={{ marginTop: 10 }}>{player.name}</h3>
            <p className="subtext">
              {player.position} · {teamName(player.teamId)}
            </p>

            <div className="card-stat-line">
              <div><strong>{player.stats.points}</strong>Points</div>
              <div><strong>{player.stats.assists}</strong>Assists</div>
              <div><strong>{player.stats.rebounds}</strong>Rebounds</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}