import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import "./Discovery.css";

export default function PlayerProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [player, setPlayer] = useState(null);
  const [teamName, setTeamName] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [verifiedStats, setVerifiedStats] = useState(null);
  const [gameLog, setGameLog] = useState([]);
  const [watchId, setWatchId] = useState(null);
  const [watchLoading, setWatchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statsMode, setStatsMode] = useState("average");

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

      const { data: highlightData } = await supabase
        .from("highlights")
        .select("*")
        .eq("player_id", id)
        .order("created_at", { ascending: false });
      setHighlights(highlightData || []);

      const { data: verifiedRow } = await supabase
        .from("player_verified_stats")
        .select("*")
        .eq("player_id", id)
        .maybeSingle();
      setVerifiedStats(verifiedRow || null);

      const { data: gameLogData } = await supabase
        .from("game_stats")
        .select("*")
        .eq("player_id", id)
        .eq("status", "official_verified")
        .order("game_date", { ascending: false });
      setGameLog(gameLogData || []);

      if (user && user.role === "Scout") {
        const { data: watchData } = await supabase
          .from("watchlist")
          .select("id")
          .eq("scout_id", user.id)
          .eq("player_id", id)
          .maybeSingle();
        setWatchId(watchData?.id || null);
      }

      setLoading(false);
    }

    fetchPlayer();
  }, [id, user]);

  async function toggleWatchlist() {
    setWatchLoading(true);
    if (watchId) {
      const { error } = await supabase.from("watchlist").delete().eq("id", watchId);
      if (!error) setWatchId(null);
    } else {
      const { data, error } = await supabase
        .from("watchlist")
        .insert({ scout_id: user.id, player_id: id })
        .select()
        .single();
      if (!error) setWatchId(data.id);
    }
    setWatchLoading(false);
  }

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

  // Public stats reflect only officially verified games -- never the
  // legacy self-reported profiles.stats blob.
  const vs = verifiedStats;
  const s = {
    minutes: vs?.minutes ?? 0,
    points: vs?.points ?? 0,
    rebounds: vs?.rebounds ?? 0,
    assists: vs?.assists ?? 0,
    steals: vs?.steals ?? 0,
    blocks: vs?.blocks ?? 0,
    turnovers: vs?.turnovers ?? 0,
    fgm: vs?.fgm ?? 0,
    fga: vs?.fga ?? 0,
    threeM: vs?.three_m ?? 0,
    threeA: vs?.three_a ?? 0,
    ftm: vs?.ftm ?? 0,
    fta: vs?.fta ?? 0,
  };
  const gamesPlayed = vs?.games_played ?? 0;
  const average = (value) => {
    if (!gamesPlayed) return "0.0";
    return ((Number(value) || 0) / gamesPlayed).toFixed(1);
  };
  const efficiency =
    (Number(s.points) || 0) +
    (Number(s.rebounds) || 0) +
    (Number(s.assists) || 0) +
    (Number(s.steals) || 0) +
    (Number(s.blocks) || 0) -
    (Number(s.turnovers) || 0);
  const initials = player.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const nameParts = player.name?.split(" ") || [];
  const firstName = nameParts[0] || player.name;
  const lastName = nameParts.slice(1).join(" ") || "Athlete";
  const profileBadge = player.verified ? "Verified Athlete" : "CourtBase Profile";

  const pct = (made, att) => (Number(att) ? ((Number(made) / Number(att)) * 100).toFixed(1) : "0.0");
  const fgm = Number(s.fgm) || 0;
  const fga = Number(s.fga) || 0;
  const threeM = Number(s.threeM) || 0;
  const threeA = Number(s.threeA) || 0;
  const ftm = Number(s.ftm) || 0;
  const fta = Number(s.fta) || 0;
  const fgPct = pct(fgm, fga);
  const threePct = pct(threeM, threeA);
  const ftPct = pct(ftm, fta);

  const statRows = {
    average: {
      tabLabel: "Per Game",
      min: average(s.minutes),
      pts: average(s.points),
      reb: average(s.rebounds),
      ast: average(s.assists),
      stl: average(s.steals),
      blk: average(s.blocks),
      to: average(s.turnovers),
      eff: gamesPlayed ? average(efficiency) : "0.0",
    },
    total: {
      tabLabel: "Totals",
      min: s.minutes ?? 0,
      pts: s.points ?? 0,
      reb: s.rebounds ?? 0,
      ast: s.assists ?? 0,
      stl: s.steals ?? 0,
      blk: s.blocks ?? 0,
      to: s.turnovers ?? 0,
      eff: efficiency,
    },
  };
  const activeRow = statRows[statsMode];

  function scrollToSection(e, id) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div className="player-record-hero">
        <div className="container player-record-layout">
          <div className="player-record-copy">
            <div className="profile-kicker">CourtBase Player</div>
            <h1>
              <span>{firstName}</span>
              <strong>{lastName}</strong>
            </h1>
            <p className="meta">{player.position || "Position not set"} · {teamName || "Unattached"}</p>

            <div className="player-profile-tags">
              <span className={`badge ${player.verified ? "badge-verified" : "badge-neutral"}`}>
                {profileBadge}
              </span>
              {player.height && <span>{player.height}</span>}
              {player.age && <span>{player.age} yrs</span>}
            </div>

            {user && user.role === "Scout" && (
              <button
                className="primary-btn"
                style={watchId ? { background: "#6b7280" } : {}}
                onClick={toggleWatchlist}
                disabled={watchLoading}
              >
                {watchId ? "Remove from Watchlist" : "Add to Watchlist"}
              </button>
            )}
          </div>

          <div className="player-record-photo" aria-label={`${player.name} profile photo`}>
            {player.profile_photo_url ? (
              <img src={player.profile_photo_url} alt={`${player.name} profile`} />
            ) : (
              <span>{initials || "CB"}</span>
            )}
          </div>
        </div>
      </div>

      <div className="player-profile-shell">
        <div className="container">
          <nav className="player-record-tabs" aria-label="Player profile sections">
            <a href="#career-stats" onClick={(e) => scrollToSection(e, "career-stats")}>Career Stats</a>
            <a href="#bio" onClick={(e) => scrollToSection(e, "bio")}>Bio</a>
            <a href="#shooting" onClick={(e) => scrollToSection(e, "shooting")}>Shooting</a>
            <a href="#game-log" onClick={(e) => scrollToSection(e, "game-log")}>Game Log</a>
            <a href="#highlights" onClick={(e) => scrollToSection(e, "highlights")}>Videos</a>
          </nav>

          <div className="player-record-metrics" aria-label="Career averages">
            <MetricStat label="PPG" value={average(s.points)} />
            <MetricStat label="RPG" value={average(s.rebounds)} />
            <MetricStat label="APG" value={average(s.assists)} />
            <MetricStat label="EFF" value={gamesPlayed ? average(efficiency) : "0.0"} />
            <MetricStat label="GP" value={gamesPlayed} />
          </div>

          <section className="stats-section" id="career-stats">
            <div className="section-heading-row">
              <div>
                <p className="section-eyebrow">Statistics</p>
                <h2>Career Stats</h2>
              </div>
              <div className="stats-toggle" role="tablist" aria-label="Stat view">
                <button
                  type="button"
                  role="tab"
                  aria-selected={statsMode === "average"}
                  className={statsMode === "average" ? "active" : ""}
                  onClick={() => setStatsMode("average")}
                >
                  Per Game
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={statsMode === "total"}
                  className={statsMode === "total" ? "active" : ""}
                  onClick={() => setStatsMode("total")}
                >
                  Totals
                </button>
              </div>
            </div>

            {gamesPlayed === 0 && (
              <div className="empty-panel" style={{ marginBottom: 16 }}>
                No officially verified games yet. Stats appear here once a
                coach and a tournament official have both signed off.
              </div>
            )}

            <div className="player-table-wrap">
              <table className="player-stats-table">
                <thead>
                  <tr>
                    <th>Season</th>
                    <th>GP</th>
                    <th>MIN</th>
                    <th>PTS</th>
                    <th>REB</th>
                    <th>AST</th>
                    <th>STL</th>
                    <th>BLK</th>
                    <th>TO</th>
                    <th className="col-highlight">EFF</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Career</td>
                    <td>{gamesPlayed}</td>
                    <td>{activeRow.min}</td>
                    <td className="stat-emphasis">{activeRow.pts}</td>
                    <td>{activeRow.reb}</td>
                    <td>{activeRow.ast}</td>
                    <td>{activeRow.stl}</td>
                    <td>{activeRow.blk}</td>
                    <td>{activeRow.to}</td>
                    <td className="col-highlight">{activeRow.eff}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="player-overview-grid" id="bio">
            <div className="player-summary-panel">
              <h2>Player Bio</h2>
              <dl className="player-detail-list">
                <div>
                  <dt>Team</dt>
                  <dd>{teamName || "Unattached"}</dd>
                </div>
                <div>
                  <dt>Position</dt>
                  <dd>{player.position || "Not set"}</dd>
                </div>
                <div>
                  <dt>Height</dt>
                  <dd>{player.height || "Not set"}</dd>
                </div>
                <div>
                  <dt>Age</dt>
                  <dd>{player.age || "Not set"}</dd>
                </div>
              </dl>
            </div>

            <div className="player-summary-panel">
              <h2>Activity</h2>
              <dl className="player-detail-list">
                <div>
                  <dt>Games Played</dt>
                  <dd>{gamesPlayed}</dd>
                </div>
                <div>
                  <dt>Minutes</dt>
                  <dd>{s.minutes ?? 0}</dd>
                </div>
                <div>
                  <dt>Highlights</dt>
                  <dd>{highlights.length}</dd>
                </div>
                <div>
                  <dt>Profile</dt>
                  <dd>{player.verified ? "Verified" : "Active"}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="stats-section" id="shooting">
            <div className="section-heading-row">
              <div>
                <p className="section-eyebrow">Shooting</p>
                <h2>Shot Profile</h2>
              </div>
            </div>

            <div className="shot-split-card">
              <ShotSplitRow label="Field Goals" made={fgm} attempted={fga} pct={fgPct} />
              <ShotSplitRow label="3-Point" made={threeM} attempted={threeA} pct={threePct} />
              <ShotSplitRow label="Free Throws" made={ftm} attempted={fta} pct={ftPct} />
            </div>
          </section>

          <section className="stats-section" id="game-log">
            <div className="section-heading-row">
              <div>
                <p className="section-eyebrow">History</p>
                <h2>Verified Game Log</h2>
              </div>
            </div>

            {gameLog.length === 0 ? (
              <div className="empty-panel">No verified games yet.</div>
            ) : (
              <div className="player-table-wrap">
                <table className="player-stats-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Opponent</th>
                      <th>PTS</th>
                      <th>REB</th>
                      <th>AST</th>
                      <th>STL</th>
                      <th>BLK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameLog.map((g) => (
                      <tr key={g.id}>
                        <td>{g.game_date ? new Date(g.game_date).toLocaleDateString() : "—"}</td>
                        <td>{g.opponent || "—"}</td>
                        <td className="stat-emphasis">{g.points}</td>
                        <td>{g.rebounds}</td>
                        <td>{g.assists}</td>
                        <td>{g.steals}</td>
                        <td>{g.blocks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="stats-section" id="highlights">
            <div className="section-heading-row">
              <div>
                <p className="section-eyebrow">Video</p>
                <h2>Highlights</h2>
              </div>
            </div>

            {highlights.length === 0 ? (
              <div className="empty-panel">No highlights uploaded yet.</div>
            ) : (
              <ul className="highlight-list professional-highlight-list">
                {highlights.map((h) => (
                  <li key={h.id}>
                    <span>
                      <strong>{h.title}</strong>
                      <small>{h.type}</small>
                    </span>
                    <a href={h.url} target="_blank" rel="noreferrer">
                      Watch
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function MetricStat({ label, value }) {
  return (
    <div className="metric-stat">
      <div className="metric-stat-value">{value}</div>
      <div className="metric-stat-label">{label}</div>
    </div>
  );
}

function ShotSplitRow({ label, made, attempted, pct }) {
  const width = Math.min(100, Math.max(0, Number(pct) || 0));
  return (
    <div className="shot-split-row">
      <div className="shot-split-top">
        <span className="shot-split-label">{label}</span>
        <span className="shot-split-figures">
          <strong>{made}-{attempted}</strong>
          <span className="shot-split-pct">{pct}%</span>
        </span>
      </div>
      <div className="shot-split-bar">
        <div className="shot-split-bar-fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
