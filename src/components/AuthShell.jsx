import "../pages/Auth.css";

export default function AuthShell({ eyebrow, title, bullets, children }) {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-visual">
          <div>
            <span className="auth-visual-eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
          </div>

          {bullets?.length > 0 && (
            <ul className="auth-visual-list">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="auth-form-panel">{children}</div>
      </div>
    </div>
  );
}
