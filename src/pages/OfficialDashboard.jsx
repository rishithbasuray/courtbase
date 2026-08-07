import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "./Discovery.css";

export default function OfficialDashboard() {
  const { user } = useAuth();

  return (
    <div className="container">
      <div className="page-header">
        <h1>Official Dashboard</h1>
        <p>Welcome, {user.name}.</p>
      </div>

      <div style={{ textAlign: "center", padding: "20px 0 60px" }}>
        <p style={{ color: "var(--text)", marginBottom: 16, maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
          Tournament management and stat verification tools aren't built yet
          — they're coming as CourtBase adds Tournaments. For now, you can
          browse players and teams like anyone else.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link to="/players" className="primary-btn" style={{ textDecoration: "none" }}>
            Browse Players
          </Link>
          <Link to="/teams" className="primary-btn" style={{ textDecoration: "none", background: "#6b7280" }}>
            Browse Teams
          </Link>
        </div>
      </div>
    </div>
  );
}