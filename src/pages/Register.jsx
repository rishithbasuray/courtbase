import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Player", position: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <p className="auth-subtext">Join CourtBase and start building your basketball profile.</p>

        {error && <div className="auth-error">{error}</div>}

        <label>Full Name</label>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Jordan Mills" />

        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />

        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" />

        <label>I am a...</label>
        <select name="role" value={form.role} onChange={handleChange}>
          <option>Player</option>
          <option>Coach</option>
          <option>Tournament Official</option>
          <option>Scout</option>
        </select>

        {form.role === "Player" && (
          <>
            <label>Position (optional)</label>
            <input name="position" value={form.position} onChange={handleChange} placeholder="Point Guard" />
          </>
        )}

        <button type="submit" className="primary-btn" style={{ width: "100%", marginTop: 10 }} disabled={submitting}>
          {submitting ? "Creating Account..." : "Create Account"}
        </button>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}