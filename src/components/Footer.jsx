import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-dark)",
        color: "var(--text-on-dark)",
        padding: "30px 60px",
        marginTop: "auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
      }}
    >
      <span style={{ opacity: 0.7, fontSize: "0.9rem" }}>
        &copy; {new Date().getFullYear()} CourtBase
      </span>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        <Link to="/about" style={footerLink}>About</Link>
        <Link to="/faq" style={footerLink}>FAQ</Link>
        <Link to="/contact" style={footerLink}>Contact</Link>
        <Link to="/privacy" style={footerLink}>Privacy Policy</Link>
        <Link to="/terms" style={footerLink}>Terms of Service</Link>
      </div>
    </footer>
  );
}

const footerLink = {
  color: "var(--text-on-dark)",
  opacity: 0.85,
  textDecoration: "none",
  fontSize: "0.9rem",
};