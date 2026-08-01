import { Link } from "react-router-dom";
import "./Discovery.css";
import "./Home.css";

export default function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p style={{ color: "var(--text)", marginBottom: 24 }}>
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="primary-btn" style={{ textDecoration: "none" }}>
        Back to Home
      </Link>
    </div>
  );
}