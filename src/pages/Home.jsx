import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardPathForRole } from "../utils/dashboardPath";
import "./Home.css";

const roles = [
  { tag: "01 · PLAYER", title: "Own your record", text: "Log your stats after every game, upload highlight clips, and build a career log that can't be edited after the fact.", role: "Player" },
  { tag: "02 · COACH", title: "Run the roster", text: "Review your players' submissions before they go to an official for sign-off, and keep the whole season in one place.", role: "Coach" },
  { tag: "03 · OFFICIAL", title: "Make it official", text: "Final sign-off on verified stats, plus tools to run tournaments, seed brackets, and post results.", role: "Tournament Official" },
  { tag: "04 · SCOUT", title: "Find who's next", text: "Filter by position and verified stat lines, then build a watchlist of players worth a second look.", role: "Scout" },
];

// Animates a number counting up from 0 to `end` once it scrolls into view.
// Respects prefers-reduced-motion by jumping straight to the final value.
function AnimatedStat({ end, suffix = "", label }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setValue(end);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        const duration = 1100;
        let startTime = null;
        function step(ts) {
          if (!startTime) startTime = ts;
          const p = Math.min((ts - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(Math.round(eased * end));
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div className="stat-cell" ref={ref}>
      <div className="stat-num">{value}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  function handleGetStarted() {
    if (user) {
      navigate(dashboardPathForRole(user.role));
    } else {
      navigate("/register");
    }
  }

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Verified by coaches &amp; officials</span>
          <h1>A stat sheet that <span className="hl">can't</span> be argued with.</h1>
          <p>
            CourtBase turns a coach's scoresheet and an official's sign-off into
            a permanent, verified record — box scores, highlights, and career
            totals that follow a player from rec league to recruiters.
          </p>
          <div className="hero-buttons">
            <button className="primary-btn" onClick={handleGetStarted}>
              {user ? "Go to My Dashboard" : "Create your profile"}
            </button>
            <button className="secondary-btn" onClick={() => navigate("/players")}>
              Explore Players
            </button>
          </div>
        </div>

        <div className="stat-sheet" aria-hidden="true">
          <div className="stat-sheet-top">
            <span className="stat-sheet-who">R. Delacroix · SG</span>
            <span className="stat-sheet-badge">✓ Verified</span>
          </div>
          <div className="stat-grid">
            <AnimatedStat end={24} label="Pts" />
            <AnimatedStat end={7} label="Reb" />
            <AnimatedStat end={9} label="Ast" />
            <AnimatedStat end={51} suffix="%" label="FG" />
          </div>
          <div className="stat-sheet-bottom">
            <span>Northfield Fall Cup · Sept 12</span>
            <span className="ok">Signed off by Official M. Tran</span>
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
              <div className="role-card" key={r.role}>
                <div className="role-tag">{r.tag}</div>
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
            <div className="zig-visual">📊</div>
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
            <div className="zig-visual">🎯</div>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-band-inner">
          <div>
            <h2>Ready to put your season on record?</h2>
            <p>Free to join. Your first verified stat line is one game away.</p>
          </div>
          <button className="primary-btn" onClick={handleGetStarted}>
            {user ? "Go to My Dashboard" : "Get started →"}
          </button>
        </div>
      </section>
    </>
  );
}
