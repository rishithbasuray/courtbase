import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 60px", background: "var(--bg-dark)" }}>
      <Link to="/" style={{ textDecoration: "none" }}>
        <h2 style={{ color: "var(--text-on-dark)", margin: 0 }}>🏀 CourtBase</h2>
      </Link>

      <div style={{ display: "flex", gap: "28px", alignItems: "center" }}>
        <Link to="/" style={navLink}>Home</Link>
        <Link to="/players" style={navLink}>Players</Link>
        <Link to="/teams" style={navLink}>Teams</Link>
        <Link to="/about" style={navLink}>About</Link>

        {user ? (
          <>
            <Link to="/profile" style={navLink}>My Profile</Link>
            <button onClick={handleLogout} style={{ ...navLink, background: "transparent", border: "1px solid var(--text-on-dark)", padding: "8px 18px", borderRadius: "8px", cursor: "pointer" }}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={navLink}>Login</Link>
            <Link to="/register" style={{ ...navLink, background: "var(--accent)", padding: "10px 20px", borderRadius: "8px" }}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

const navLink = { color: "var(--text-on-dark)", textDecoration: "none", fontWeight: 600 };

export default Navbar;