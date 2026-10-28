import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (name.trim().split(/\s+/).length < 2) return setError("Enter your first and last name.");
    if (password.length < 6) return setError("Use a password with at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setSaving(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(result.user, { displayName: name.trim() });
      await setDoc(doc(db, "users", result.user.uid), { name: name.trim(), email: email.trim(), plan: "Free" });
      navigate("/");
    } catch {
      setError("Could not create the account. Check the email and try again.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="form-page"><form className="account-form" onSubmit={handleSubmit}>
    <p className="eyebrow">Join the community</p><h1>Create your account</h1>
    <label>Full name<input autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} /></label>
    <label>Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
    <label>Password<input type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
    <label>Confirm password<input type="password" autoComplete="new-password" minLength={6} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></label>
    {error && <p className="error-message" role="alert">{error}</p>}
    <button type="submit" disabled={saving}>{saving ? "Creating account..." : "Sign up"}</button>
    <p className="form-switch">Already have an account? <Link to="/login">Login</Link></p>
  </form></main>;
}
