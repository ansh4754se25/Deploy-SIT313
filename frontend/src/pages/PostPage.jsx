import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function PostPage() {
  const { user, loading } = useAuth();
  const [postType, setPostType] = useState("Question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [plan, setPlan] = useState("Free");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    if (!user) {
      setMessage("Please log in before publishing your post.");
      return;
    }

    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    const cleanTags = [...new Set(tags.split(",").map((tag) => tag.trim()).filter(Boolean))];
    if (cleanTitle.length < 3 || cleanTitle.length > 120) {
      setMessage("The title must be between 3 and 120 characters.");
      return;
    }
    if (cleanBody.length < 10 || cleanBody.length > 3000) {
      setMessage("The description must be between 10 and 3000 characters.");
      return;
    }
    if (cleanTags.length > 3 || cleanTags.some((tag) => tag.length > 30)) {
      setMessage("Use up to 3 tags, each no longer than 30 characters.");
      return;
    }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: postType, title: cleanTitle, body: cleanBody, tags: cleanTags, plan }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not publish your post.");
      setTitle("");
      setBody("");
      setTags("");
      setPostType("Question");
      setPlan("Free");
      setMessage(result.message || "Your post has been published.");
    } catch (error) {
      setMessage(error.message || "Could not publish your post. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="new-post-page">
    <section className="new-post-card" aria-labelledby="new-post-title">
      <h1 className="new-post-heading" id="new-post-title">New Post</h1>
      <form onSubmit={handleSubmit}>
        <fieldset className="post-type-fieldset">
          <legend>Select Post Type</legend>
          <label><input type="radio" name="post-type" value="Question" checked={postType === "Question"} onChange={() => setPostType("Question")} /> Question</label>
          <label><input type="radio" name="post-type" value="Article" checked={postType === "Article"} onChange={() => setPostType("Article")} /> Article</label>
        </fieldset>

        <h2 className="new-post-subheading">What do you want to ask or share?</h2>
        <label className="new-post-label" htmlFor="new-post-title-input">Title</label>
        <input className="new-post-input" id="new-post-title-input" minLength={3} maxLength={120} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Start your question with how, what, or why" />

        <label className="new-post-label" htmlFor="new-post-body">Describe your problem</label>
        <textarea className="new-post-input new-post-textarea" id="new-post-body" minLength={10} required maxLength={3000} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Include what you tried and what happened." />

        <label className="new-post-label" htmlFor="new-post-tags">Tags</label>
        <input className="new-post-input" id="new-post-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Up to 3 tags, separated by commas (e.g. Java, React)" />
        <fieldset className="post-type-fieldset">
          <legend>Who can view this post?</legend>
          <label><input type="radio" name="post-plan" value="Free" checked={plan === "Free"} onChange={() => setPlan("Free")} /> Free</label>
          <label><input type="radio" name="post-plan" value="Paid" checked={plan === "Paid"} onChange={() => setPlan("Paid")} /> Paid plan</label>
        </fieldset>
        <div className="new-post-actions">
          {message && <p className="new-post-message" role="status">{message}</p>}
          {!loading && !user && <p className="new-post-login-note">Log in to publish. <Link to="/login">Login</Link></p>}
          <button className="new-post-submit" type="submit" disabled={saving}>{saving ? "Posting..." : "Post"}</button>
        </div>
      </form>
    </section>
  </main>;
}
