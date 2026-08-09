import "./Discovery.css";
import "./Legal.css";

export default function Terms() {
  return (
    <div className="container legal-page">
      <div className="page-header">
        <h1>Terms of Service</h1>
        <p>Last updated: [add date]</p>
      </div>

      <div className="legal-content">
        <p className="legal-notice">
          This is placeholder text, not final legal copy. Have a lawyer
          review and finalize this before launching to real users.
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>By creating an account on CourtBase, you agree to these Terms of Service and our Privacy Policy.</p>

        <h2>2. Accounts</h2>
        <p>You're responsible for keeping your account credentials secure and for the accuracy of the information you submit, including self-reported statistics.</p>

        <h2>3. Verified Statistics</h2>
        <p>Statistics marked "Verified" have been reviewed by a coach and tournament official through CourtBase's verification process. CourtBase does not guarantee the accuracy of unverified, self-reported statistics.</p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to submit false statistics, impersonate another player, coach, or official, or upload content you don't have the right to share.</p>

        <h2>5. Content Ownership</h2>
        <p>You retain ownership of any highlights or content you upload. By uploading, you grant CourtBase permission to display it on your public profile.</p>

        <h2>6. Termination</h2>
        <p>We may suspend or remove accounts that violate these terms.</p>

        <h2>7. Changes to These Terms</h2>
        <p>We may update these terms from time to time. Continued use of CourtBase after changes means you accept the updated terms.</p>
      </div>
    </div>
  );
}