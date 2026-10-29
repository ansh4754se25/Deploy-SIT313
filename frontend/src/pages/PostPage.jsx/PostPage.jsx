import { useState } from "react";
import { Link } from "react-router-dom";
import { arrayUnion, doc, Timestamp, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import "./PostPage.css";

export default function PostPage() {
  const { user, profile, loading } = useAuth();
  const [postType, setPostType] = useState("Question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    if (!user) {
      setMessage("Please log in before publishing your post.");
      return;
    }
    const cleanTags = [...new Set(tags.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 3);
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        posts: arrayUnion({
          id: crypto.randomUUID(), type: postType, title: title.trim(), body: body.trim(), tags: cleanTags,
          authorId: user.uid, authorName: user.displayName || profile?.name || "DEV@Deakin member", createdAt: Timestamp.now(),
        }),
      });
      setTitle(""); setBody(""); setTags(""); setPostType("Question");
      setMessage("Your post has been published.");
    } catch (error) {
      console.error("Unable to publish post:", error);
      setMessage("Could not publish your post. Please try again.");
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
        <input className="new-post-input" id="new-post-title-input" maxLength={120} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Start your question with how, what, or why" />
        <label className="new-post-label" htmlFor="new-post-body">Describe your problem</label>
        <textarea className="new-post-input new-post-textarea" id="new-post-body" required maxLength={3000} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Include what you tried and what happened." />
        <label className="new-post-label" htmlFor="new-post-tags">Tags</label>
        <input className="new-post-input" id="new-post-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Up to 3 tags, separated by commas (e.g. Java, React)" />
        <div className="new-post-actions">
          {message && <p className="new-post-message" role="status">{message}</p>}
          {!loading && !user && <p className="new-post-login-note">Log in to publish. <Link to="/login">Login</Link></p>}
          <button className="new-post-submit" type="submit" disabled={saving}>{saving ? "Posting..." : "Post"}</button>
        </div>
      </form>
    </section>
  </main>;
}
