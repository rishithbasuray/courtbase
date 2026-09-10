import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "./Discovery.css";
import "./Auth.css";

const generalStatFields = [
  ["gamesPlayed", "Games Played"], ["minutes", "Minutes"], ["points", "Points"],
  ["assists", "Assists"], ["rebounds", "Rebounds"], ["offRebounds", "Off. Rebounds"],
  ["defRebounds", "Def. Rebounds"], ["steals", "Steals"], ["blocks", "Blocks"],
  ["turnovers", "Turnovers"], ["fouls", "Fouls"],
];

const shootingStatFields = [
  ["fgm", "FGM"], ["fga", "FGA"], ["fgPct", "FG%"],
  ["threeM", "3PM"], ["threeA", "3PA"], ["threePct", "3P%"],
  ["ftm", "FTM"], ["fta", "FTA"], ["ftPct", "FT%"],
];

// A single game_stats row represents one game, so games-played and the
// shooting percentages don't apply as input fields -- percentages are
// derived from makes/attempts, and "games played" is just "how many rows".
const perGameGeneralFields = generalStatFields.filter(([key]) => key !== "gamesPlayed");
const perGameShootingFields = shootingStatFields.filter(([key]) => !key.endsWith("Pct"));

const columnByField = {
  minutes: "minutes", points: "points", assists: "assists", rebounds: "rebounds",
  offRebounds: "off_rebounds", defRebounds: "def_rebounds", steals: "steals",
  blocks: "blocks", turnovers: "turnovers", fouls: "fouls",
  fgm: "fgm", fga: "fga", threeM: "three_m", threeA: "three_a", ftm: "ftm", fta: "fta",
};

function emptyGameForm() {
  const today = new Date().toISOString().slice(0, 10);
  const form = { opponent: "", gameDate: today };
  [...perGameGeneralFields, ...perGameShootingFields].forEach(([key]) => {
    form[key] = 0;
  });
  return form;
}

function pct(made, attempted) {
  return attempted ? ((made / attempted) * 100).toFixed(1) : "0.0";
}

function statusMeta(status) {
  switch (status) {
    case "official_verified":
      return { label: "Verified", cls: "badge-verified" };
    case "coach_verified":
      return { label: "Coach Verified", cls: "badge-coach-verified" };
    case "rejected":
      return { label: "Rejected", cls: "badge-rejected" };
    default:
      return { label: "Pending Review", cls: "badge-pending" };
  }
}

function detectType(url) {
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/drive\.google\.com/i.test(url)) return "drive";
  return null;
}

export default function Profile() {
  const { user, updateProfilePhoto, setTeam, refreshProfile, logout } = useAuth();

  const [teams, setTeams] = useState([]);
  const [teamsError, setTeamsError] = useState("");
  const [teamSaving, setTeamSaving] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", city: "", coach: "" });

  const [teamSearch, setTeamSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const blurTimeout = useRef(null);
  const photoInputRef = useRef(null);

  const [outgoingRequest, setOutgoingRequest] = useState(null);
  const [incomingInvites, setIncomingInvites] = useState([]);
  const [teamRequestsLoading, setTeamRequestsLoading] = useState(true);
  const [teamRequestsError, setTeamRequestsError] = useState("");
  const [teamRequestActionId, setTeamRequestActionId] = useState(null);
  const [joinSending, setJoinSending] = useState(false);

  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const [highlights, setHighlights] = useState([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [highlightsLoadError, setHighlightsLoadError] = useState("");
  const [newHighlight, setNewHighlight] = useState({ title: "", url: "" });
  const [highlightError, setHighlightError] = useState("");
  const [addingHighlight, setAddingHighlight] = useState(false);
  const [highlightToDelete, setHighlightToDelete] = useState(null);

  const [verifiedStats, setVerifiedStats] = useState(null);
  const [verifiedLoading, setVerifiedLoading] = useState(true);
  const [verifiedError, setVerifiedError] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [submissionsError, setSubmissionsError] = useState("");
  const [gameForm, setGameForm] = useState(emptyGameForm());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitNotice, setSubmitNotice] = useState("");

  const isPlayer = user.role === "Player";
  const hasTeamSection = user.role === "Player" || user.role === "Coach";

  useEffect(() => {
    fetchTeams();
    fetchHighlights();
    if (isPlayer) {
      fetchVerifiedStats();
      fetchSubmissions();
      fetchMyTeamRequests();
    } else {
      setTeamRequestsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const current = teams.find((t) => t.id === user.team_id);
    setTeamSearch(current ? current.name : "");
  }, [teams, user.team_id]);

  async function fetchTeams() {
    const { data, error } = await supabase.from("teams").select("*").order("name");
    if (error) {
      setTeamsError(error.message);
      return;
    }
    setTeamsError("");
    setTeams(data || []);
  }

  async function fetchHighlights() {
    const { data, error } = await supabase
      .from("highlights")
      .select("*")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setHighlightsLoadError(error.message);
    } else {
      setHighlightsLoadError("");
      setHighlights(data || []);
    }
    setHighlightsLoading(false);
  }

  async function fetchVerifiedStats() {
    const { data, error } = await supabase
      .from("player_verified_stats")
      .select("*")
      .eq("player_id", user.id)
      .maybeSingle();

    if (error) {
      setVerifiedError(error.message);
    } else {
      setVerifiedError("");
      setVerifiedStats(data || null);
    }
    setVerifiedLoading(false);
  }

  async function fetchSubmissions() {
    const { data, error } = await supabase
      .from("game_stats")
      .select("*")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setSubmissionsError(error.message);
    } else {
      setSubmissionsError("");
      setSubmissions(data || []);
    }
    setSubmissionsLoading(false);
  }

  async function handleAddHighlight(e) {
    e.preventDefault();
    setHighlightError("");

    if (!newHighlight.title || !newHighlight.url) {
      setHighlightError("Please fill in both a title and a link.");
      return;
    }

    const type = detectType(newHighlight.url);
    if (!type) {
      setHighlightError("Please use a YouTube or Google Drive link.");
      return;
    }

    setAddingHighlight(true);
    const { error } = await supabase.from("highlights").insert({
      player_id: user.id,
      title: newHighlight.title,
      url: newHighlight.url,
      type,
    });
    setAddingHighlight(false);

    if (error) {
      setHighlightError(error.message);
      return;
    }

    setNewHighlight({ title: "", url: "" });
    fetchHighlights();
  }

  async function handleDeleteHighlight(id) {
    const { error } = await supabase.from("highlights").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setHighlights(highlights.filter((h) => h.id !== id));
  }

  async function confirmDeleteHighlight() {
    if (!highlightToDelete) return;
    await handleDeleteHighlight(highlightToDelete.id);
    setHighlightToDelete(null);
  }

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(teamSearch.toLowerCase())
  );

  async function fetchMyTeamRequests() {
    const { data, error } = await supabase
      .from("team_requests")
      .select("*, teams:team_id (name)")
      .eq("player_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setTeamRequestsError(error.message);
    } else {
      setTeamRequestsError("");
      const rows = data || [];
      setOutgoingRequest(rows.find((r) => r.direction === "player_request") || null);
      setIncomingInvites(rows.filter((r) => r.direction === "coach_invite"));
    }
    setTeamRequestsLoading(false);
  }

  async function sendJoinRequest(teamId) {
    setDropdownOpen(false);
    setJoinSending(true);
    const { error } = await supabase.rpc("request_join_team", { target_team_id: teamId });
    setJoinSending(false);

    if (error) {
      alert(error.message);
      return;
    }
    setTeamSearch("");
    fetchMyTeamRequests();
  }

  async function cancelMyRequest(id) {
    setTeamRequestActionId(id);
    const { error } = await supabase.rpc("cancel_team_request", { request_id: id });
    setTeamRequestActionId(null);

    if (error) {
      alert(error.message);
      return;
    }
    fetchMyTeamRequests();
  }

  async function respondToInvite(id, approve) {
    setTeamRequestActionId(id);
    const { error } = await supabase.rpc("respond_to_team_request", {
      request_id: id,
      approve,
    });
    setTeamRequestActionId(null);

    if (error) {
      alert(error.message);
      return;
    }
    fetchMyTeamRequests();
    if (approve) await refreshProfile();
  }

  function handleLeaveClick() {
    setShowLeaveConfirm(true);
  }

  async function confirmLeaveTeam() {
    setShowLeaveConfirm(false);
    setTeamSaving(true);
    try {
      await setTeam(null);
      setTeamSearch("");
    } catch (err) {
      alert(err.message);
    } finally {
      setTeamSaving(false);
    }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    if (!newTeam.name) return;

    const { error } = await supabase.rpc("create_team_and_join", {
      team_name: newTeam.name,
      team_city: newTeam.city || null,
      team_coach: newTeam.coach || null,
    });

    if (error) {
      alert(error.message);
      return;
    }

    await refreshProfile();
    await fetchTeams();
    setShowCreateTeam(false);
    setNewTeam({ name: "", city: "", coach: "" });
  }

  function handleGameFieldChange(key, value) {
    setGameForm({ ...gameForm, [key]: value });
  }

  async function handleSubmitGame(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitNotice("");

    if (!gameForm.gameDate) {
      setSubmitError("Please choose the date of the game.");
      return;
    }

    setSubmitting(true);

    const payload = {
      player_id: user.id,
      opponent: gameForm.opponent || null,
      game_date: gameForm.gameDate,
    };
    Object.entries(columnByField).forEach(([field, column]) => {
      payload[column] = Number(gameForm[field]) || 0;
    });

    const { error } = await supabase.from("game_stats").insert(payload);
    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setGameForm(emptyGameForm());
    setSubmitNotice("Submitted. Your coach will review it next.");
    fetchSubmissions();
  }

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError("");

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Please choose an image smaller than 5 MB.");
      return;
    }

    setPhotoSaving(true);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${user.id}/profile-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      await updateProfilePhoto(data.publicUrl);
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setPhotoSaving(false);
      e.target.value = "";
    }
  }

  const currentTeamName = teams.find((t) => t.id === user.team_id)?.name;
  const initials = user.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const v = verifiedStats;
  const verifiedFgPct = v ? pct(v.fgm, v.fga) : "0.0";
  const verifiedThreePct = v ? pct(v.three_m, v.three_a) : "0.0";
  const verifiedFtPct = v ? pct(v.ftm, v.fta) : "0.0";

  return (
    <>
      <div className="profile-record-hero">
        <div className="container profile-record-layout">
          <button
            type="button"
            className="profile-record-photo"
            aria-label="Change profile picture"
            onClick={() => photoInputRef.current?.click()}
            disabled={photoSaving}
          >
            {user.profile_photo_url ? (
              <img src={user.profile_photo_url} alt={`${user.name} profile`} />
            ) : (
              <span>{initials || "CB"}</span>
            )}
            <span className="profile-record-photo-edit">
              {photoSaving ? "Uploading..." : "Change Photo"}
            </span>
          </button>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="profile-photo-input"
            onChange={handlePhotoSelect}
          />

          <div className="profile-record-copy">
            <div className="profile-kicker">My CourtBase Profile</div>
            <h1>{user.name}</h1>
            <p className="meta">
              {user.role}{user.position ? ` · ${user.position}` : ""} · {user.email}
            </p>

            <div className="player-profile-tags">
              <span className={`badge ${user.verified ? "badge-verified" : "badge-unverified"}`}>
                {user.verified ? "Verified" : "Pending Verification"}
              </span>
              {hasTeamSection && (
                <span>{currentTeamName || "Unattached"}</span>
              )}
            </div>

            {photoError && <div className="auth-error profile-record-photo-error">{photoError}</div>}
          </div>

          <div className="profile-record-actions">
            {hasTeamSection && user.team_id && (
              <button className="primary-btn btn-outline-danger" onClick={handleLeaveClick}>
                Leave Team
              </button>
            )}
            <button className="primary-btn btn-muted" onClick={logout}>
              Log Out
            </button>
          </div>
        </div>
      </div>

      <div className="profile-dashboard-shell">
        <div className="container profile-dashboard-grid">
          <aside className="profile-side-col">
            <div className="player-summary-panel">
              <h2>Account</h2>
              <dl className="player-detail-list">
                <div>
                  <dt>Role</dt>
                  <dd>{user.role}</dd>
                </div>
                {user.position && (
                  <div>
                    <dt>Position</dt>
                    <dd>{user.position}</dd>
                  </div>
                )}
                <div>
                  <dt>Email</dt>
                  <dd className="detail-value-tight">{user.email}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{user.verified ? "Verified" : "Pending Verification"}</dd>
                </div>
              </dl>
            </div>

            {hasTeamSection && (
              <div className="player-summary-panel">
                <h2>{user.role === "Coach" ? "My Team (Coaching)" : "My Team"}</h2>

                {user.role === "Coach" ? (
                  user.team_id ? (
                    <>
                      <p className="muted-note" style={{ marginBottom: 14 }}>
                        You're coaching <strong>{currentTeamName}</strong>.
                        Manage your roster, invites, and join requests from
                        the Coach Dashboard.
                      </p>
                      <Link
                        to="/coach-dashboard"
                        className="primary-btn btn-block"
                        style={{ textDecoration: "none", display: "inline-block", textAlign: "center" }}
                      >
                        Go to Coach Dashboard
                      </Link>
                    </>
                  ) : !showCreateTeam ? (
                    <button
                      type="button"
                      className="primary-btn btn-outline-accent btn-block"
                      onClick={() => setShowCreateTeam(true)}
                    >
                      + Create a New Team
                    </button>
                  ) : (
                    <form onSubmit={handleCreateTeam} className="stacked-form">
                      <label>Team Name</label>
                      <input
                        value={newTeam.name}
                        onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                        placeholder="Riverside Hawks"
                      />
                      <label>City</label>
                      <input
                        value={newTeam.city}
                        onChange={(e) => setNewTeam({ ...newTeam, city: e.target.value })}
                        placeholder="Riverside"
                      />
                      <label>Coach</label>
                      <input
                        value={newTeam.coach}
                        onChange={(e) => setNewTeam({ ...newTeam, coach: e.target.value })}
                        placeholder="Coach Name"
                      />
                      <div className="btn-row">
                        <button type="submit" className="primary-btn">Create & Join</button>
                        <button type="button" className="primary-btn btn-muted" onClick={() => setShowCreateTeam(false)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )
                ) : user.team_id ? (
                  <p className="muted-note">
                    You're on <strong>{currentTeamName}</strong>.
                  </p>
                ) : teamRequestsLoading ? (
                  <p className="muted-note">Loading...</p>
                ) : teamRequestsError ? (
                  <div className="empty-panel" style={{ color: "#b91c1c" }}>
                    Couldn't load your team requests: {teamRequestsError}
                  </div>
                ) : (
                  <>
                    {teamsError && (
                      <div className="auth-error" style={{ marginBottom: 12 }}>
                        Couldn't load the team list: {teamsError}
                      </div>
                    )}
                    {incomingInvites.length > 0 && (
                      <>
                        <h3 className="stat-group-label" style={{ marginTop: 0 }}>Invitations</h3>
                        <ul className="highlight-list professional-highlight-list">
                          {incomingInvites.map((r) => (
                            <li key={r.id}>
                              <span>
                                <strong>{r.teams?.name || "A team"}</strong>
                                <small>wants you on their roster</small>
                              </span>
                              <span className="highlight-actions">
                                <button
                                  type="button"
                                  className="primary-btn"
                                  style={{ padding: "8px 14px" }}
                                  disabled={teamRequestActionId === r.id}
                                  onClick={() => respondToInvite(r.id, true)}
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  className="link-danger-btn"
                                  disabled={teamRequestActionId === r.id}
                                  onClick={() => respondToInvite(r.id, false)}
                                >
                                  Decline
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {outgoingRequest ? (
                      <div className="verification-note">
                        Request sent to <strong>{outgoingRequest.teams?.name}</strong>.
                        Waiting for their coach to respond.
                        <div style={{ marginTop: 10 }}>
                          <button
                            type="button"
                            className="primary-btn btn-muted"
                            disabled={teamRequestActionId === outgoingRequest.id}
                            onClick={() => cancelMyRequest(outgoingRequest.id)}
                          >
                            Cancel Request
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="team-search-wrap">
                        <input
                          type="text"
                          className="team-search-input"
                          placeholder="Search for a team to join..."
                          value={teamSearch}
                          disabled={joinSending}
                          onChange={(e) => {
                            setTeamSearch(e.target.value);
                            setDropdownOpen(true);
                          }}
                          onFocus={() => setDropdownOpen(true)}
                          onBlur={() => {
                            blurTimeout.current = setTimeout(() => setDropdownOpen(false), 150);
                          }}
                        />

                        {dropdownOpen && (
                          <div className="team-dropdown">
                            {filteredTeams.length === 0 && (
                              <div className="team-dropdown-empty">
                                {teamSearch ? `No teams match "${teamSearch}"` : "Start typing to find a team"}
                              </div>
                            )}

                            {filteredTeams.map((t) => (
                              <div
                                key={t.id}
                                className="team-dropdown-item"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => sendJoinRequest(t.id)}
                              >
                                {t.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </aside>

          <main className="profile-main-col">
            {isPlayer && (
              <section className="stats-section profile-panel-section" id="highlights">
                <div className="section-heading-row">
                  <div>
                    <p className="section-eyebrow">Video</p>
                    <h2>My Highlights</h2>
                  </div>
                </div>

                {highlightsLoading ? (
                  <p className="muted-note">Loading highlights...</p>
                ) : highlightsLoadError ? (
                  <div className="empty-panel" style={{ color: "#b91c1c" }}>
                    Couldn't load highlights: {highlightsLoadError}
                  </div>
                ) : highlights.length === 0 ? (
                  <div className="empty-panel">No highlights added yet.</div>
                ) : (
                  <ul className="highlight-list professional-highlight-list">
                    {highlights.map((h) => (
                      <li key={h.id}>
                        <span>
                          <strong>{h.title}</strong>
                          <small>{h.type}</small>
                        </span>
                        <span className="highlight-actions">
                          <a href={h.url} target="_blank" rel="noreferrer">Watch</a>
                          <button
                            type="button"
                            className="link-danger-btn"
                            onClick={() => setHighlightToDelete(h)}
                          >
                            Remove
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <form onSubmit={handleAddHighlight} className="stacked-form highlight-form">
                  {highlightError && <div className="auth-error">{highlightError}</div>}

                  <label>Title</label>
                  <input
                    value={newHighlight.title}
                    onChange={(e) => setNewHighlight({ ...newHighlight, title: e.target.value })}
                    placeholder="Season Highlight Reel"
                  />

                  <label>YouTube or Google Drive Link</label>
                  <input
                    value={newHighlight.url}
                    onChange={(e) => setNewHighlight({ ...newHighlight, url: e.target.value })}
                    placeholder="https://youtube.com/..."
                  />

                  <button type="submit" className="primary-btn" disabled={addingHighlight}>
                    {addingHighlight ? "Adding..." : "+ Add Highlight"}
                  </button>
                </form>
              </section>
            )}

            {isPlayer && (
              <section className="stats-section profile-panel-section" id="statistics">
                <div className="section-heading-row">
                  <div>
                    <p className="section-eyebrow">Statistics</p>
                    <h2>Verified Career Totals</h2>
                  </div>
                </div>

                {!user.verified && (
                  <div className="verification-note">
                    Your public statistics only reflect games that a coach and
                    a tournament official have both verified. Submit a game
                    below to start building your verified record.
                  </div>
                )}

                {verifiedLoading ? (
                  <p className="muted-note">Loading...</p>
                ) : verifiedError ? (
                  <div className="empty-panel" style={{ color: "#b91c1c" }}>
                    Couldn't load your verified stats: {verifiedError}
                  </div>
                ) : !v || v.games_played === 0 ? (
                  <div className="empty-panel">
                    No officially verified games yet. Once a game you submit
                    is approved by your coach and a tournament official,
                    it'll show up here and on your public profile.
                  </div>
                ) : (
                  <>
                    <h3 className="stat-group-label">Totals ({v.games_played} verified game{v.games_played === 1 ? "" : "s"})</h3>
                    <div className="stats-grid">
                      <div className="stat-box"><div className="value">{v.minutes}</div><div className="label">Minutes</div></div>
                      <div className="stat-box"><div className="value">{v.points}</div><div className="label">Points</div></div>
                      <div className="stat-box"><div className="value">{v.assists}</div><div className="label">Assists</div></div>
                      <div className="stat-box"><div className="value">{v.rebounds}</div><div className="label">Rebounds</div></div>
                      <div className="stat-box"><div className="value">{v.off_rebounds}</div><div className="label">Off. Rebounds</div></div>
                      <div className="stat-box"><div className="value">{v.def_rebounds}</div><div className="label">Def. Rebounds</div></div>
                      <div className="stat-box"><div className="value">{v.steals}</div><div className="label">Steals</div></div>
                      <div className="stat-box"><div className="value">{v.blocks}</div><div className="label">Blocks</div></div>
                      <div className="stat-box"><div className="value">{v.turnovers}</div><div className="label">Turnovers</div></div>
                      <div className="stat-box"><div className="value">{v.fouls}</div><div className="label">Fouls</div></div>
                    </div>

                    <h3 className="stat-group-label">Shooting</h3>
                    <div className="stats-grid stats-grid-compact">
                      <div className="stat-box"><div className="value">{v.fgm}</div><div className="label">FGM</div></div>
                      <div className="stat-box"><div className="value">{v.fga}</div><div className="label">FGA</div></div>
                      <div className="stat-box"><div className="value">{verifiedFgPct}</div><div className="label">FG%</div></div>
                      <div className="stat-box"><div className="value">{v.three_m}</div><div className="label">3PM</div></div>
                      <div className="stat-box"><div className="value">{v.three_a}</div><div className="label">3PA</div></div>
                      <div className="stat-box"><div className="value">{verifiedThreePct}</div><div className="label">3P%</div></div>
                      <div className="stat-box"><div className="value">{v.ftm}</div><div className="label">FTM</div></div>
                      <div className="stat-box"><div className="value">{v.fta}</div><div className="label">FTA</div></div>
                      <div className="stat-box"><div className="value">{verifiedFtPct}</div><div className="label">FT%</div></div>
                    </div>
                  </>
                )}
              </section>
            )}

            {isPlayer && (
              <section className="stats-section profile-panel-section" id="submit-game">
                <div className="section-heading-row">
                  <div>
                    <p className="section-eyebrow">Verification</p>
                    <h2>Submit Game Stats</h2>
                  </div>
                </div>

                <p className="muted-note" style={{ marginBottom: 16 }}>
                  Enter the stats from a single game. It'll go to your coach
                  for review, then to a tournament official for final
                  verification, before counting toward your public record.
                </p>

                <form onSubmit={handleSubmitGame}>
                  {submitError && <div className="auth-error">{submitError}</div>}
                  {submitNotice && <div className="verification-note">{submitNotice}</div>}

                  <div className="stacked-form" style={{ display: "flex", gap: 16, flexWrap: "wrap", maxWidth: "none" }}>
                    <div style={{ flex: "1 1 220px" }}>
                      <label>Opponent</label>
                      <input
                        value={gameForm.opponent}
                        onChange={(e) => handleGameFieldChange("opponent", e.target.value)}
                        placeholder="Northgate Wolves"
                      />
                    </div>
                    <div style={{ flex: "1 1 160px" }}>
                      <label>Game Date</label>
                      <input
                        type="date"
                        value={gameForm.gameDate}
                        onChange={(e) => handleGameFieldChange("gameDate", e.target.value)}
                      />
                    </div>
                  </div>

                  <h3 className="stat-group-label">Totals For This Game</h3>
                  <div className="stats-grid">
                    {perGameGeneralFields.map(([key, label]) => (
                      <div key={key} className="stat-box stat-box-editable">
                        <input
                          type="number"
                          className="stat-box-input"
                          value={gameForm[key]}
                          onChange={(e) => handleGameFieldChange(key, e.target.value)}
                        />
                        <div className="label">{label}</div>
                      </div>
                    ))}
                  </div>

                  <h3 className="stat-group-label">Shooting</h3>
                  <div className="stats-grid stats-grid-compact">
                    {perGameShootingFields.map(([key, label]) => (
                      <div key={key} className="stat-box stat-box-editable">
                        <input
                          type="number"
                          className="stat-box-input"
                          value={gameForm[key]}
                          onChange={(e) => handleGameFieldChange(key, e.target.value)}
                        />
                        <div className="label">{label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="btn-row">
                    <button type="submit" className="primary-btn" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit for Review"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {isPlayer && (
              <section className="stats-section profile-panel-section" id="submissions">
                <div className="section-heading-row">
                  <div>
                    <p className="section-eyebrow">History</p>
                    <h2>My Submissions</h2>
                  </div>
                </div>

                {submissionsLoading ? (
                  <p className="muted-note">Loading...</p>
                ) : submissionsError ? (
                  <div className="empty-panel" style={{ color: "#b91c1c" }}>
                    Couldn't load your submissions: {submissionsError}
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="empty-panel">You haven't submitted any games yet.</div>
                ) : (
                  <ul className="highlight-list professional-highlight-list">
                    {submissions.map((s) => {
                      const meta = statusMeta(s.status);
                      return (
                        <li key={s.id}>
                          <span>
                            <strong>{s.opponent ? `vs. ${s.opponent}` : "Game"}</strong>
                            <small>
                              {s.game_date ? new Date(s.game_date).toLocaleDateString() : ""}
                              {" · "}{s.points} pts, {s.rebounds} reb, {s.assists} ast
                              {s.status === "rejected" && s.rejection_reason ? ` · ${s.rejection_reason}` : ""}
                            </small>
                          </span>
                          <span className={`badge ${meta.cls}`}>{meta.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {!isPlayer && (
              <section className="stats-section profile-panel-section">
                <div className="section-heading-row">
                  <div>
                    <p className="section-eyebrow">Overview</p>
                    <h2>Account Overview</h2>
                  </div>
                </div>
                <div className="empty-panel">
                  Highlights and statistics are only tracked for player accounts.
                  {hasTeamSection ? " Use the Team panel to manage your team." : ""}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {showLeaveConfirm && (
        <div className="modal-overlay" onClick={() => setShowLeaveConfirm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Leave {currentTeamName}?</h3>
            <p>
              Are you sure you want to leave this team? You'll become
              unattached and can join another team anytime.
            </p>
            <div className="modal-actions">
              <button className="primary-btn btn-danger" onClick={confirmLeaveTeam}>
                Yes, Leave Team
              </button>
              <button className="primary-btn btn-muted" onClick={() => setShowLeaveConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {highlightToDelete && (
        <div className="modal-overlay" onClick={() => setHighlightToDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Remove "{highlightToDelete.title}"?</h3>
            <p>This will permanently remove this highlight from your profile.</p>
            <div className="modal-actions">
              <button className="primary-btn btn-danger" onClick={confirmDeleteHighlight}>
                Yes, Remove
              </button>
              <button className="primary-btn btn-muted" onClick={() => setHighlightToDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
