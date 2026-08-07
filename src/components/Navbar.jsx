import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardPathForRole } from "../utils/dashboardPath";
import "./Navbar.css";

const dashboardLabels = {
  Player: "My Profile",
  Coach: "My Team",
  "Tournament Official": "Dashboard",
  Scout: "Watchlist",
};

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleLogout() {
    await logout();
    closeMenu();
    navigate("/");
  }

  const dashboardPath = user ? dashboardPathForRole(user.role) : "/profile";
  const dashboardLabel = user ? dashboardLabels[user.role] || "My Profile" : "My Profile";

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <h2>🏀 CourtBase</h2>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <Link to="/" className="navbar-link" onClick={closeMenu}>Home</Link>
          <Link to="/players" className="navbar-link" onClick={closeMenu}>Players</Link>
          <Link to="/teams" className="navbar-link" onClick={closeMenu}>Teams</Link>
          <Link to="/about" className="navbar-link" onClick={closeMenu}>About</Link>

          {user ? (
            <>
              <Link to={dashboardPath} className="navbar-link" onClick={closeMenu}>{dashboardLabel}</Link>
              <button className="navbar-link navbar-logout" onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link" onClick={closeMenu}>Login</Link>
              <Link to="/register" className="navbar-link navbar-register" onClick={closeMenu}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;