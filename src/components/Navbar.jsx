import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

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
              <Link to="/profile" className="navbar-link" onClick={closeMenu}>My Profile</Link>
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