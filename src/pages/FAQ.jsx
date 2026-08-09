import { useState } from "react";
import "./Discovery.css";
import "./FAQ.css";

const faqs = [
  { q: "Is CourtBase free to use?", a: "Yes. Creating a profile, tracking your stats, and browsing players and teams is free." },
  { q: "How do I get my stats verified?", a: "You (or a coach/official) enter your stats, and a coach followed by a tournament official confirms them before they're marked verified on your public profile." },
  { q: "Can I join more than one team?", a: "Right now, a player can be on one team at a time. You can switch teams anytime from your profile." },
  { q: "What if I don't have a team yet?", a: "That's fine — you can register and build your profile as an unattached player, and join or create a team whenever you're ready." },
  { q: "How do I upload highlights?", a: "You can add YouTube or Google Drive links to your highlights from your profile page." },
  { q: "Who can see my profile?", a: "Player profiles are public, so coaches and scouts can browse and view verified stats. Editing your own stats is private to your account." },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  function toggle(i) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about using CourtBase.</p>
      </div>

      <div className="faq-list">
        {faqs.map((item, i) => (
          <div className="faq-item" key={i}>
            <button className="faq-question" onClick={() => toggle(i)}>
              <span>{item.q}</span>
              <span className="faq-icon">{openIndex === i ? "−" : "+"}</span>
            </button>
            {openIndex === i && <div className="faq-answer">{item.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}