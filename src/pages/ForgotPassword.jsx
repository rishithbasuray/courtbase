import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AuthShell from "../components/AuthShell";
import "./Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    const redirectTo = `${window.location.origin}${window.location.pathname}#/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setSubmitting(false);

    // Show the same message whether or not the email exists, so this page
    // can't be used to check which addresses have CourtBase accounts.
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell
      eyebrow="CourtBase"
      title="Locked out? We've got you."
      bullets={[
        "Reset links expire after use, for your security",
        "Your verified stats and history stay untouched",
      ]}
    >
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Reset Password</h1>
        <p className="auth-subtext">
          Enter the email on your account and we'll send you a link to set a new password.
        </p>

        {error && <div className="auth-error">{error}</div>}

        {sent ? (
          <div className="auth-success">
            If an account exists for <strong>{email}</strong>, a reset link is on its way.
            Check your inbox (and spam folder) for an email from CourtBase.
          </div>
        ) : (
          <>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <button type="submit" className="primary-btn" style={{ width: "100%", marginTop: 10 }} disabled={submitting}>
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
          </>
        )}

        <p className="auth-footer">
          <Link to="/login">Back to log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
