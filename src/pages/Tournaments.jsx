import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "./Discovery.css";
import "./Auth.css";

export default function Tournaments() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", location: "", start_date: "", end_date: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function fetchTournaments() {
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("start_date", { ascending: true });
    if (!error) setTournaments(data || []);
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError("");
    if (!form.name) {
      setCreateError("Please enter a tournament name.");
      return;
    }

    setCreating(true);
    const { error } = await supabase.from("tournaments").insert({
      name: form.name,
      description: form.description,
      location: form.location,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      created_by: user.id,
    });
    setCreating(false);

    if (error) {
      setCreateError(error.message);
      return;
    }

    setForm({ name: "", description: "", location: "", start_date: "", end_date: "" });
    setShowCreate(false);
    fetchTournaments();
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Tournaments</h1>
        <p>Browse upcoming and past CourtBase tournaments.</p>
      </div>

      {user && user.role === "Tournament Official" && (
        <div style={{ maxWidth: 500, margin: "0 auto 40px" }}>
          {!showCreate ? (
            <button className="primary-btn" style={{ width: "100%" }} onClick={() => setShowCreate(true)}>
              + Create a Tournament
            </button>
          ) : (
            <form onSubmit={handleCreate} className="auth-card" style={{ boxShadow: "none" }}>
              {createError && <div className="auth-error">{createError}</div>}

              <label>Tournament Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Summer Classic" />

              <label>Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Riverside Community Center" />

              <label>Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />

              <label>Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />

              <label>End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button type="submit" className="primary-btn" disabled={creating}>
                  {creating ? "Creating..." : "Create Tournament"}
                </button>
                <button type="button" className="primary-btn" style={{ background: "#6b7280" }} onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {loading && <p style={{ textAlign: "center", color: "var(--text)" }}>Loading tournaments...</p>}

      {!loading && tournaments.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--text)" }}>
          No tournaments have been created yet.
        </p>
      )}

      <div className="card-grid">
        {tournaments.map((t) => (
          <Link to={`/tournaments/${t.id}`} className="card" key={t.id}>
            <h3>{t.name}</h3>
            <p className="subtext">{t.location || "Location TBD"}</p>
            <p className="subtext">
              {t.start_date ? new Date(t.start_date).toLocaleDateString() : "Date TBD"}
              {t.end_date ? ` – ${new Date(t.end_date).toLocaleDateString()}` : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}