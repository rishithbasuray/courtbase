import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AuthShell from "../components/AuthShell";
import "./Auth.css";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The reset-link redirect carries a recovery token that supabase-js
    // picks up on load and turns into a real session -- that can take a
    // beat, so we check once now and also listen in case it lands just
    // after this runs.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
        setCheckingSession(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    setTimeout(() => navigate("/login"), 2500);
  }

  return (
    <AuthShell
      eyebrow="CourtBase"
      title="Almost there."
      bullets={["Choose a strong, unique password", "You'll be signed in on your next login"]}
    >
      <div className="auth-card">
        <h1>Set a New Password</h1>

        {checkingSession ? (
          <p className="auth-subtext">Checking your reset link...</p>
        ) : done ? (
          <div className="auth-success">
            Password updated. Taking you to log in...
          </div>
        ) : !hasSession ? (
          <>
            <p className="auth-subtext">
              This reset link is invalid or has expired. Request a new one below.
            </p>
            <Link to="/forgot-password" className="primary-btn" style={{ width: "100%", marginTop: 10, textAlign: "center", display: "inline-block", textDecoration: "none" }}>
              Request New Link
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="auth-subtext">Choose a new password for your account.</p>

            {error && <div className="auth-error">{error}</div>}

            <label>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />

            <button type="submit" className="primary-btn" style={{ width: "100%", marginTop: 10 }} disabled={submitting}>
              {submitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        <p className="auth-footer">
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
    </AuthShell>
  );
}
