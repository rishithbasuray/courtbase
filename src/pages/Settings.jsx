import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Discovery.css";
import "./Auth.css";

export default function Settings() {
  const { user, changePassword, changeEmail, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }

    setPasswordSubmitting(true);
    try {
      await changePassword(newPassword);
      setPasswordSuccess("Password updated.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordSubmitting(false);
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");

    if (!newEmail) {
      setEmailError("Please enter a new email.");
      return;
    }

    setEmailSubmitting(true);
    try {
      await changeEmail(newEmail);
      setEmailSuccess("Check your inbox (both old and new email) to confirm this change.");
      setNewEmail("");
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setEmailSubmitting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      navigate("/");
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account details for {user.email}.</p>
      </div>

      <div className="stats-section">
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordSubmit} style={{ maxWidth: 420 }}>
          {passwordError && <div className="auth-error">{passwordError}</div>}
          {passwordSuccess && (
            <div className="auth-error" style={{ background: "rgba(22,163,74,0.1)", color: "#15803d" }}>
              {passwordSuccess}
            </div>
          )}

          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />

          <button type="submit" className="primary-btn" style={{ marginTop: 14 }} disabled={passwordSubmitting}>
            {passwordSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      <div className="stats-section">
        <h2>Change Email</h2>
        <p style={{ color: "var(--text)", marginBottom: 14 }}>
          Current email: {user.email}
        </p>
        <form onSubmit={handleEmailSubmit} style={{ maxWidth: 420 }}>
          {emailError && <div className="auth-error">{emailError}</div>}
          {emailSuccess && (
            <div className="auth-error" style={{ background: "rgba(22,163,74,0.1)", color: "#15803d" }}>
              {emailSuccess}
            </div>
          )}

          <label>New Email</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new@example.com"
          />

          <button type="submit" className="primary-btn" style={{ marginTop: 14 }} disabled={emailSubmitting}>
            {emailSubmitting ? "Updating..." : "Update Email"}
          </button>
        </form>
      </div>

      <div className="stats-section" style={{ marginBottom: 60 }}>
        <h2 style={{ color: "#b91c1c" }}>Danger Zone</h2>
        <p style={{ color: "var(--text)", marginBottom: 14 }}>
          Deleting your account removes your profile, stats, highlights, and
          team affiliation permanently. This cannot be undone.
        </p>
        <button
          className="primary-btn"
          style={{ background: "transparent", color: "#b91c1c", border: "1px solid #b91c1c" }}
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete My Account
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Delete your account?</h3>
            <p>
              This permanently removes your profile, stats, highlights, and
              team affiliation. This cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="primary-btn"
                style={{ background: "#b91c1c" }}
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete My Account"}
              </button>
              <button
                className="primary-btn"
                style={{ background: "#6b7280" }}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}