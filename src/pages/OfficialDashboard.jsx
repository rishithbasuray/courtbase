import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Discovery.css";

export default function OfficialDashboard() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    const { data, error } = await supabase
      .from("game_stats")
      .select("*, profiles:player_id (name), teams:team_id (name)")
      .eq("status", "coach_verified")
      .order("coach_verified_at", { ascending: true });

    if (!error) setPending(data || []);
    setLoading(false);
  }

  async function handleApprove(id) {
    setActioningId(id);
    const { error } = await supabase.rpc("official_verify_game_stat", {
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
    const { error } = await supabase.rpc("official_verify_game_stat", {
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

  return (
    <div className="container">
      <div className="page-header">
        <h1>Official Dashboard</h1>
        <p>Welcome, {user.name}.</p>
      </div>

      <div className="stats-section" style={{ marginBottom: 30 }}>
        <div className="section-heading-row">
          <div>
            <p className="section-eyebrow">Verification</p>
            <h2>Awaiting Final Verification ({pending.length})</h2>
          </div>
        </div>

        {loading ? (
          <p className="muted-note">Loading...</p>
        ) : pending.length === 0 ? (
          <div className="empty-panel">
            No coach-verified submissions waiting on final sign-off right now.
          </div>
        ) : (
          <ul className="highlight-list professional-highlight-list">
            {pending.map((p) => (
              <li key={p.id}>
                <span>
                  <strong>{p.profiles?.name || "Player"}</strong>
                  <small>
                    {p.teams?.name ? `${p.teams.name} · ` : ""}
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
                    Verify
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

      <div style={{ textAlign: "center", padding: "20px 0 60px" }}>
        <p style={{ color: "var(--text)", marginBottom: 16, maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
          Create and manage tournaments, register teams, and record match
          results.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/tournaments" className="primary-btn" style={{ textDecoration: "none" }}>
            Manage Tournaments
          </Link>
          <Link to="/players" className="primary-btn" style={{ textDecoration: "none", background: "#6b7280" }}>
            Browse Players
          </Link>
          <Link to="/teams" className="primary-btn" style={{ textDecoration: "none", background: "#6b7280" }}>
            Browse Teams
          </Link>
        </div>
      </div>

      {rejectTarget && (
        <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Reject this submission?</h3>
            <p>
              This sends it back as rejected. {rejectTarget.profiles?.name || "The player"} and their coach won't see it on the profile.
            </p>
            <div className="stacked-form">
              <label>Reason (optional)</label>
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Doesn't match the official scoresheet"
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
    </div>
  );
}
