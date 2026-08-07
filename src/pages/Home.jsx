import { useNavigate } from "react-router-dom";
import "./Home.css";

const roles = [
  { icon: "🏀", title: "Players", text: "Build a verified profile, track every stat, and upload your highlights.", role: "Player" },
  { icon: "📋", title: "Coaches", text: "Manage your roster and see your team's stats in one place.", role: "Coach" },
  { icon: "🏆", title: "Tournament Officials", text: "Organize competitions and verify statistics from the games you run.", role: "Tournament Official" },
  { icon: "🔍", title: "Scouts", text: "Discover grassroots talent through verified stats and highlight reels.", role: "Scout" },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>Every Basketball Career Deserves to Be Remembered.</h1>
          <p>
            CourtBase is the digital home of grassroots basketball. Build your
            verified player profile, preserve your statistics, upload
            highlights, and connect with coaches, scouts, and tournaments.
          </p>
          <div className="hero-buttons">
            <button className="primary-btn" onClick={() => navigate("/register")}>Get Started</button>
            <button className="secondary-btn" onClick={() => navigate("/players")}>Explore Players</button>
          </div>
        </div>
      </section>

      <section className="roles-section">
        <div className="container">
          <div className="section-heading">
            <h2>Built for Everyone on the Court</h2>
            <p>CourtBase adapts to what you're here to do.</p>
          </div>

          <div className="role-grid">
            {roles.map((r) => (
              <div
                className="role-card"
                key={r.role}
                onClick={() => navigate(`/register?role=${encodeURIComponent(r.role)}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="role-icon">{r.icon}</div>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="zig-row">
            <div className="zig-text">
              <h2>About CourtBase</h2>
              <p>
                CourtBase is built to preserve the complete journey of
                basketball players. From verified statistics and match
                highlights to team history and achievements, CourtBase
                creates a trusted digital record that grows with every
                season — connecting players, coaches, officials, and scouts
                in one place.
              </p>
            </div>
            <div className="zig-visual" style={{ background: "var(--accent-bg)" }}>📊</div>
          </div>

          <div className="zig-row reverse">
            <div className="zig-text">
              <h2>Our Mission</h2>
              <p>
                Too many statistics disappear after tournaments, highlights
                become scattered, and years of progress are lost. CourtBase
                exists to ensure every game, every achievement, and every
                milestone is preserved, verified, and accessible throughout a
                player's basketball career.
              </p>
            </div>
            <div className="zig-visual" style={{ background: "rgba(27,27,27,0.06)" }}>🎯</div>
          </div>
        </div>
      </section>
    </>
  );
}