import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "./Discovery.css";

export default function CoachDashboard() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [roster, setRoster] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [joinRequests, setJoinRequests] = useState([]);
  const [invitesSent, setInvitesSent] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState("");
  const [requestActioningId, setRequestActioningId] = useState(null);

  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteResults, setInviteResults] = useState([]);
  const [inviteSearching, setInviteSearching] = useState(false);
  const [inviteSendingId, setInviteSendingId] = useState(null);
  const [inviteError, setInviteError] = useState("");

  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user.team_id) {
        setLoading(false);
        setPendingLoading(false);
        setRequestsLoading(false);
        return;
      }

      setLoadError("");
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", user.team_id)
        .single();

      if (teamError) {
        setLoadError(teamError.message);
        setLoading(false);
        setPendingLoading(false);
        setRequestsLoading(false);
        return;
      }

      const { data: rosterData, error: rosterError } = await supabase
        .from("profiles")
        .select("*")
        .eq("team_id", user.team_id)
        .eq("role", "Player");

      if (rosterError) setLoadError(rosterError.message);

      setTeam(teamData);
      setRoster(rosterData || []);
      setLoading(false);

      const rosterIds = (rosterData || []).map((p) => p.id);
      if (rosterIds.length > 0) {
        const { data: verifiedRows } = await supabase
          .from("player_verified_stats")
          .select("*")
          .in("player_id", rosterIds);
        const map = {};
        (verifiedRows || []).forEach((v) => (map[v.player_id] = v));
        setStatsMap(map);
      }

      await Promise.all([fetchPending(), fetchTeamRequests()]);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.team_id]);

  async function fetchPending() {
    const { data, error } = await supabase
      .from("game_stats")
      .select("*, profiles:player_id (name)")
      .eq("team_id", user.team_id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      setPendingError(error.message);
    } else {
      setPendingError("");
      setPending(data || []);
    }
    setPendingLoading(false);
  }

  async function fetchTeamRequests() {
    const { data, error } = await supabase
      .from("team_requests")
      .select("*, profiles:player_id (name, position)")
      .eq("team_id", user.team_id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      setRequestsError(error.message);
    } else {
      setRequestsError("");
      const rows = data || [];
      setJoinRequests(rows.filter((r) => r.direction === "player_request"));
      setInvitesSent(rows.filter((r) => r.direction === "coach_invite"));
    }
    setRequestsLoading(false);
  }

  async function handleApprove(id) {
    setActioningId(id);
    const { error } = await supabase.rpc("coach_verify_game_stat", {
      submission_id: id,
      approve: true,
    });
    setActioningId(null);

    if (error) {
      alert(error.message);
      return;
    }
    fetchPending();
  }

  function openReject(submission) {
    setRejectReason("");
    setRejectTarget(submission);
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    setActioningId(rejectTarget.id);
    const { error } = await supabase.rpc("coach_verify_game_stat", {
      submission_id: rejectTarget.id,
      approve: false,
      reason: rejectReason || null,
    });
    setActioningId(null);
    setRejectTarget(null);

    if (error) {
      alert(error.message);
      return;
    }
    fetchPending();
  }

  async function respondToJoinRequest(id, approve) {
    setRequestActioningId(id);
    const { error } = await supabase.rpc("respond_to_team_request", {
      request_id: id,
      approve,
    });
    setRequestActioningId(null);

    if (error) {
      alert(error.message);
      return;
    }
    fetchTeamRequests();
    if (approve) {
      // A new player just joined the roster.
      const { data: rosterData } = await supabase
        .from("profiles")
        .select("*")
        .eq("team_id", user.team_id)
        .eq("role", "Player");
      setRoster(rosterData || []);
    }
  }

  async function cancelInvite(id) {
    setRequestActioningId(id);
    const { error } = await supabase.rpc("cancel_team_request", { request_id: id });
    setRequestActioningId(null);

    if (error) {
      alert(error.message);
      return;
    }
    fetchTeamRequests();
  }

  async function handleInviteSearch(query) {
    setInviteSearch(query);
    setInviteError("");

    if (query.trim().length < 2) {
      setInviteResults([]);
      return;
    }

    setInviteSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, position")
      .eq("role", "Player")
      .is("team_id", null)
      .ilike("name", `%${query}%`)
      .limit(8);
    setInviteSearching(false);

    if (error) {
      setInviteError(error.message);
      return;
    }
    setInviteResults(data || []);
  }

  async function sendInvite(playerId) {
    setInviteSendingId(playerId);
    setInviteError("");
    const { error } = await supabase.rpc("invite_player_to_team", {
      target_player_id: playerId,
    });
    setInviteSendingId(null);

    if (error) {
      setInviteError(error.message);
      return;
    }

    setInviteResults((r) => r.filter((p) => p.id !== playerId));
    fetchTeamRequests();
  }

  function openRemove(player) {
    setRemoveTarget(player);
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    const { error } = await supabase.rpc("remove_player_from_roster", {
      target_player_id: removeTarget.id,
    });
    setRemoving(false);
    setRemoveTarget(null);

    if (error) {
      alert(error.message);
      return;
    }
    setRoster((r) => r.filter((p) => p.id !== removeTarget.id));
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Coach Dashboard</h1>
        <p>Welcome back, {user.name}.</p>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--text)" }}>Loading...</p>
      ) : loadError ? (
        <p style={{ textAlign: "center", color: "#b91c1c" }}>
          Couldn't load your team: {loadError}
        </p>
      ) : !user.team_id ? (
        <div style={{ textAlign: "center", padding: "20px 0 60px" }}>
          <p style={{ color: "var(--text)", marginBottom: 16 }}>
            You're not managing a team yet.
          </p>
          <Link to="/profile" className="primary-btn" style={{ textDecoration: "none" }}>
            Create a Team
          </Link>
        </div>
      ) : (
        <>
          <div className="stats-section" style={{ marginBottom: 30 }}>
            <div className="section-heading-row">
              <div>
                <p className="section-eyebrow">Verification</p>
                <h2>Pending Verifications ({pending.length})</h2>
              </div>
            </div>

            {pendingLoading ? (
              <p className="muted-note">Loading...</p>
            ) : pendingError ? (
              <div className="empty-panel" style={{ color: "#b91c1c" }}>
                Couldn't load pending verifications: {pendingError}
              </div>
            ) : pending.length === 0 ? (
              <div className="empty-panel">
                No stat submissions waiting on you right now.
              </div>
            ) : (
              <ul className="highlight-list professional-highlight-list">
                {pending.map((p) => (
                  <li key={p.id}>
                    <span>
                      <strong>{p.profiles?.name || "Player"}</strong>
                      <small>
                        {p.opponent ? `vs. ${p.opponent}` : "Game"}
                        {p.game_date ? ` · ${new Date(p.game_date).toLocaleDateString()}` : ""}
                        {" · "}{p.points} pts, {p.rebounds} reb, {p.assists} ast
                      </small>
                    </span>
                    <span className="highlight-actions">
                      <button
                        type="button"
                        className="primary-btn"
                        style={{ padding: "8px 14px" }}
                        disabled={actioningId === p.id}
                        onClick={() => handleApprove(p.id)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="link-danger-btn"
                        disabled={actioningId === p.id}
                        onClick={() => openReject(p)}
                      >
                        Reject
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="stats-section" style={{ marginBottom: 30 }}>
            <div className="section-heading-row">
              <div>
                <p className="section-eyebrow">Roster</p>
                <h2>Join Requests ({joinRequests.length})</h2>
              </div>
            </div>

            {requestsLoading ? (
              <p className="muted-note">Loading...</p>
            ) : requestsError ? (
              <div className="empty-panel" style={{ color: "#b91c1c" }}>
                Couldn't load join requests: {requestsError}
              </div>
            ) : joinRequests.length === 0 ? (
              <div className="empty-panel">No players waiting to join right now.</div>
            ) : (
              <ul className="highlight-list professional-highlight-list">
                {joinRequests.map((r) => (
                  <li key={r.id}>
                    <span>
                      <strong>{r.profiles?.name || "Player"}</strong>
                      <small>{r.profiles?.position || "Position not set"}</small>
                    </span>
                    <span className="highlight-actions">
                      <button
                        type="button"
                        className="primary-btn"
                        style={{ padding: "8px 14px" }}
                        disabled={requestActioningId === r.id}
                        onClick={() => respondToJoinRequest(r.id, true)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="link-danger-btn"
                        disabled={requestActioningId === r.id}
                        onClick={() => respondToJoinRequest(r.id, false)}
                      >
                        Decline
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="stat-group-label">Invite a Player</h3>
            {inviteError && <div className="auth-error">{inviteError}</div>}
            <div className="team-search-wrap" style={{ maxWidth: 420 }}>
              <input
                type="text"
                className="team-search-input"
                placeholder="Search unattached players by name..."
                value={inviteSearch}
                onChange={(e) => handleInviteSearch(e.target.value)}
              />
            </div>
            {inviteSearching && <p className="muted-note">Searching...</p>}
            {!inviteSearching && inviteResults.length > 0 && (
              <ul className="highlight-list professional-highlight-list" style={{ marginTop: 12 }}>
                {inviteResults.map((p) => (
                  <li key={p.id}>
                    <span>
                      <strong>{p.name}</strong>
                      <small>{p.position || "Position not set"}</small>
                    </span>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ padding: "8px 14px" }}
                      disabled={inviteSendingId === p.id}
                      onClick={() => sendInvite(p.id)}
                    >
                      {inviteSendingId === p.id ? "Sending..." : "Send Invite"}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {invitesSent.length > 0 && (
              <>
                <h3 className="stat-group-label">Invites Sent</h3>
                <ul className="highlight-list professional-highlight-list">
                  {invitesSent.map((r) => (
                    <li key={r.id}>
                      <span>
                        <strong>{r.profiles?.name || "Player"}</strong>
                        <small>Waiting for a response</small>
                      </span>
                      <button
                        type="button"
                        className="link-danger-btn"
                        disabled={requestActioningId === r.id}
                        onClick={() => cancelInvite(r.id)}
                      >
                        Cancel
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="stats-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>{team?.name}</h2>
              <Link to="/profile" className="primary-btn" style={{ textDecoration: "none" }}>
                Manage Team
              </Link>
            </div>
            <p style={{ color: "var(--text)", marginBottom: 24 }}>{team?.city}</p>
            <Link to="/tournaments" className="primary-btn" style={{ textDecoration: "none", display: "inline-block", marginBottom: 30 }}>
              Browse Tournaments
            </Link>

            <h2>Roster ({roster.length})</h2>
            {roster.length === 0 ? (
              <p style={{ color: "var(--text)" }}>No players on your roster yet.</p>
            ) : (
              <div className="card-grid">
                {roster.map((player) => {
                  const stats = statsMap[player.id];
                  return (
                    <div className="card" key={player.id} style={{ position: "relative" }}>
                      <Link to={`/players/${player.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                        <span className={`badge ${player.verified ? "badge-verified" : "badge-unverified"}`}>
                          {player.verified ? "Verified" : "Unverified"}
                        </span>
                        <h3 style={{ marginTop: 10 }}>{player.name}</h3>
                        <p className="subtext">{player.position || "Position not set"}</p>
                        <div className="card-stat-line">
                          <div><strong>{stats?.points ?? 0}</strong>Points</div>
                          <div><strong>{stats?.assists ?? 0}</strong>Assists</div>
                          <div><strong>{stats?.rebounds ?? 0}</strong>Rebounds</div>
                        </div>
                      </Link>
                      <button
                        type="button"
                        className="link-danger-btn"
                        style={{ marginTop: 14 }}
                        onClick={() => openRemove(player)}
                      >
                        Remove from Roster
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {rejectTarget && (
        <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Reject this submission?</h3>
            <p>
              Let {rejectTarget.profiles?.name || "the player"} know why, so
              they can resubmit correctly.
            </p>
            <div className="stacked-form">
              <label>Reason (optional)</label>
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Points don't match the scoresheet"
              />
            </div>
            <div className="modal-actions">
              <button className="primary-btn btn-danger" onClick={confirmReject}>
                Reject Submission
              </button>
              <button className="primary-btn btn-muted" onClick={() => setRejectTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {removeTarget && (
        <div className="modal-overlay" onClick={() => setRemoveTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Remove {removeTarget.name} from the roster?</h3>
            <p>
              They'll become unattached and can request to join a team again
              later. Their verified stat history is not affected.
            </p>
            <div className="modal-actions">
              <button className="primary-btn btn-danger" disabled={removing} onClick={confirmRemove}>
                {removing ? "Removing..." : "Yes, Remove"}
              </button>
              <button className="primary-btn btn-muted" onClick={() => setRemoveTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
