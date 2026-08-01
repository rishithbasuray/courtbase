import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1>Every Basketball Career Deserves to Be Remembered.</h1>

          <p>
            CourtBase is the digital home of grassroots basketball. Build your
            verified player profile, preserve your statistics, upload
            highlights, and connect with coaches, scouts, and tournaments.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn" onClick={() => navigate("/register")}>
              Get Started
            </button>

            <button className="secondary-btn" onClick={() => navigate("/players")}>
              Explore Players
            </button>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="about">
        <div className="container">
          <h2>About CourtBase</h2>

          <p>
            CourtBase is a platform built to preserve the complete journey of
            basketball players. From verified statistics and match highlights
            to team history and achievements, CourtBase creates a trusted
            digital record that grows with every season. Our goal is to connect
            players, coaches, tournament organizers, and scouts through one
            centralized basketball ecosystem.
          </p>
        </div>
      </section>

      {/* MISSION */}
      <section className="mission">
        <div className="container">
          <h2>Our Mission</h2>

          <p>
            We believe every player's hard work deserves recognition. Too many
            statistics disappear after tournaments, highlights become scattered,
            and years of progress are lost. CourtBase exists to ensure every
            game, every achievement, and every milestone is preserved,
            verified, and accessible throughout a player's basketball career.
          </p>
        </div>
      </section>
    </>
  );
}