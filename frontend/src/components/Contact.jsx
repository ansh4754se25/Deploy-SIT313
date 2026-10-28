import { useState } from "react";

function Contact() {
const [email, setEmail] = useState("");
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);

async function handleSubmit(event) {
event.preventDefault();


setMessage("");
setLoading(true);

try {
  const response = await fetch("http://localhost:3000/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Subscription failed.");
  }

  setMessage(data.message);
  setEmail("");
} catch (error) {
  setMessage(
    error.message || "Unable to connect to the server. Please try again."
  );
} finally {
  setLoading(false);
}


}

return ( <section id="contact" className="contact"> <h1>Contact Me</h1>

  <p>Feel free to get in touch.</p>

  <h2>Subscribe to my Newsletter</h2>

  <form onSubmit={handleSubmit}>
    <label htmlFor="email">Email address</label>

    <input
      type="email"
      id="email"
      name="email"
      placeholder="Enter your email"
      value={email}
      onChange={(event) => setEmail(event.target.value)}
      required
    />

    <button type="submit" disabled={loading}>
      {loading ? "Submitting..." : "Subscribe"}
    </button>

    <p id="message" role="status" aria-live="polite">
      {message}
    </p>
  </form>
</section>

);
}

export default Contact;
