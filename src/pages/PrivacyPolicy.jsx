import "./Discovery.css";
import "./Legal.css";

export default function PrivacyPolicy() {
  return (
    <div className="container legal-page">
      <div className="page-header">
        <h1>Privacy Policy</h1>
        <p>Last updated: [add date]</p>
      </div>

      <div className="legal-content">
        <p className="legal-notice">
          This is placeholder text, not final legal copy. Have a lawyer
          review and finalize this before launching to real users.
        </p>

        <h2>1. Information We Collect</h2>
        <p>When you register for CourtBase, we collect your name, email address, role (Player, Coach, Tournament Official, or Scout), and any statistics or team information you choose to add to your profile.</p>

        <h2>2. How We Use Your Information</h2>
        <p>We use your information to create and display your CourtBase profile, connect you with teams and tournaments, and allow coaches, officials, and scouts to view verified statistics.</p>

        <h2>3. Who Can See Your Information</h2>
        <p>Player profiles, including name, position, team, and verified statistics, are public and visible to anyone browsing CourtBase. Your email address and account credentials are never shown publicly.</p>

        <h2>4. Data Storage</h2>
        <p>Your data is stored securely using Supabase, our database provider. We do not sell your personal information to third parties.</p>

        <h2>5. Your Choices</h2>
        <p>You can update or remove your statistics and team affiliation at any time from your profile. To delete your account entirely, contact us using the Contact page.</p>

        <h2>6. Contact</h2>
        <p>Questions about this policy? Reach out through our Contact page.</p>
      </div>
    </div>
  );
}