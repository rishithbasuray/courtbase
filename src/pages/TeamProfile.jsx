import { useParams, Link } from "react-router-dom";
import { teams, players } from "../data/mockData";
import "./Discovery.css";

export default function TeamProfile() {
  const { id } = useParams();
  const team = teams.find((t) => t.id === id);

  if (!team) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Team Not Found</h1>
          <p>We couldn't find that team. <Link to="/teams">Back to Teams</Link></p>
        </div>
      </div>
    );
  }

  const roster = players.filter((p) => team.rosterIds.includes(p.id));

  return (
    <>
      <div className="profile-header">
        <div className="container">
          <div>
            <h1>{team.name}</h1>
            <p className="meta">{team.city} · {team.coach}</p>
          </div>

          <span className="badge badge-verified">
            {team.record.wins}W - {team.record.losses}L
          </span>
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
                  <span style={{ color: "var(--text)", fontWeight: 400 }}>{player.position}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}