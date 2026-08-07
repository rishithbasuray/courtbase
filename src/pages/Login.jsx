import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardPathForRole } from "../utils/dashboardPath";
import "./Auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const profile = await login(form);
      navigate(dashboardPathForRole(profile.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Login</h1>
        <p className="auth-subtext">Sign in to CourtBase.</p>

        {error && <div className="auth-error">{error}</div>}

        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />

        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" />

        <button type="submit" className="primary-btn" style={{ width: "100%", marginTop: 10 }} disabled={submitting}>
          {submitting ? "Logging In..." : "Log In"}
        </button>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}