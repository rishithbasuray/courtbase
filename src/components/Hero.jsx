import { useState } from "react";
function Hero(props) {
    const [message, setMessage] = useState("");
  return (
    <div>
      <h1>{props.title}</h1>
      <p>{props.subtitle}</p>
      <button onClick={() => setMessage("Welcome to CourtBase! 🎉")}>
  Get Started
</button>
<p>{message}</p>
    </div>
  );
}

export default Hero;