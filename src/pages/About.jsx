import "./Discovery.css";

export default function About() {
  return (
    <div>
      <div className="page-header">
        <h1>About CourtBase</h1>
        <p>The digital home for grassroots basketball careers.</p>
      </div>

      <section className="about-section">
        <div className="container">
          <h2>What Is CourtBase?</h2>
          <p style={{ maxWidth: 800, lineHeight: 1.8, color: "var(--text)" }}>
            CourtBase is a basketball platform where players build verified
            digital careers, coaches manage teams and matches, tournament
            officials organize competitions, and scouts discover talent
            through verified statistics and video highlights. Our goal is to
            become the central home for grassroots basketball by preserving
            every player's journey in one place.
          </p>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <h2>The Problem We're Solving</h2>
          <ul>
            <li>Statistics stay on paper after tournaments and are never digitized.</li>
            <li>Highlight clips get scattered across YouTube, Drive, and phones.</li>
            <li>Coaches have no central place to manage player careers.</li>
            <li>Scouts have no reliable way to evaluate grassroots talent.</li>
          </ul>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <h2>How Verification Works</h2>
          <ol className="step-list">
            <li>A player submits their statistics from a game.</li>
            <li>A coach reviews and verifies the submitted statistics.</li>
            <li>A tournament official gives final verification before it's marked official on the player's profile.</li>
          </ol>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <h2>How Statistics Get Recorded</h2>
          <ul>
            <li><strong>Official scoresheets:</strong> collected from tournament officials after the game and entered into the system.</li>
            <li><strong>Live recording:</strong> officials, coaches, or trusted staff track stats during the game in real time.</li>
            <li><strong>Self-recorded:</strong> players track their own statistics, then verified by a coach or official before appearing on their profile.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}