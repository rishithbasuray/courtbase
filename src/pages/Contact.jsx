import { useState } from "react";
import "./Discovery.css";
import "./Auth.css";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Contact Us</h1>
        <p className="auth-subtext">Questions, feedback, or found a bug? Send us a message.</p>

        {sent ? (
          <p style={{ color: "var(--accent)", fontWeight: 700 }}>Thanks! We'll get back to you soon.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />

            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />

            <label>Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="How can we help?"
              rows={5}
              required
              style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "inherit", fontSize: "1rem", boxSizing: "border-box", resize: "vertical" }}
            />

            <button type="submit" className="primary-btn" style={{ width: "100%", marginTop: 16 }}>
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}