import { Link } from "react-router-dom";
import { teams } from "../data/mockData";
import "./Discovery.css";

export default function Teams() {
  return (
    <div className="container">
      <div className="page-header">
        <h1>Teams</h1>
        <p>Browse teams competing on CourtBase.</p>
      </div>

      <div className="card-grid">
        {teams.map((team) => (
          <Link to={`/teams/${team.id}`} className="card" key={team.id}>
            <h3>{team.name}</h3>
            <p className="subtext">{team.city}</p>
            <p className="subtext">Coach: {team.coach}</p>

            <div className="card-stat-line">
              <div><strong>{team.record.wins}</strong>Wins</div>
              <div><strong>{team.record.losses}</strong>Losses</div>
              <div><strong>{team.rosterIds.length}</strong>Players</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}