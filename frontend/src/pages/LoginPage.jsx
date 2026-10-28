import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/");
    } catch {
      setError("Login failed. Check your email and password, then try again.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="form-page"><form className="account-form" onSubmit={handleSubmit}>
    <p className="eyebrow">DEV@Deakin account</p><h1>Welcome back</h1>
    <label>Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
    <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
    {error && <p className="error-message" role="alert">{error}</p>}
    <button type="submit" disabled={saving}>{saving ? "Signing in..." : "Login"}</button>
    <p className="form-switch">New to DEV@Deakin? <Link to="/signup">Create an account</Link></p>
  </form></main>;
}
