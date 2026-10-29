    import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { arrayUnion, doc, onSnapshot, Timestamp, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";

const monthlyLimits = { Free: 3, Paid: 20 };

function postDate(post) {
  const value = post.createdAt?.toDate?.();
  return value ? value.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Just now";
}

export default function PostPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [postsUserId, setPostsUserId] = useState(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    const profileRef = doc(db, "users", user.uid);
    return onSnapshot(profileRef, (snapshot) => {
      setPosts(snapshot.exists() ? snapshot.data().posts || [] : []);
      setPostsUserId(user.uid);
      setFeedError("");
      setFeedLoading(false);
    }, (error) => {
      console.error("Unable to load your posts:", error);
      setPostsUserId(user.uid);
      setFeedError("Your posts could not be loaded. Check your connection and try again.");
      setFeedLoading(false);
    });
  }, [user]);

  const plan = profile?.plan === "Paid" ? "Paid" : "Free";
  const limit = monthlyLimits[plan];
  const postsThisMonth = useMemo(() => {
    if (!user) return 0;
    const now = new Date();
    return posts.filter((post) => {
      const date = post.createdAt?.toDate?.();
      return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }).length;
  }, [posts, user]);
  const atLimit = postsThisMonth >= limit;
  const newestFirst = useMemo(() => [...posts].sort((a, b) =>
    (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)), [posts]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    if (!user) {
      setMessage("Log in to publish a post.");
      return;
    }
    if (atLimit) {
      setMessage(`You have reached your ${limit}-post monthly limit. You can post again next month.`);
      return;
    }
    setSaving(true);
    try {
      const post = {
        id: crypto.randomUUID(),
        title: title.trim(),
        body: body.trim(),
        authorId: user.uid,
        authorName: user.displayName || profile?.name || "DEV@Deakin member",
        createdAt: Timestamp.now(),
      };
      await updateDoc(doc(db, "users", user.uid), { posts: arrayUnion(post) });
      setTitle("");
      setBody("");
      setMessage("Your post is published.");
    } catch (error) {
      console.error("Unable to publish post:", error);
      setMessage("Could not save this post. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="post-page">
    <header className="post-intro">
      <p className="eyebrow">DEV@Deakin member space</p>
      <h1>Share what you’re working on</h1>
      <p>Write a project update, share an idea, or keep a note about something you learned.</p>
    </header>

    {!authLoading && (user ? <section className="post-composer" aria-labelledby="post-form-title">
      <h2 id="post-form-title">Create a post</h2>
      <p className="post-quota">{Math.max(0, limit - postsThisMonth)} of {limit} posts left this month on your {plan} plan.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="post-title">Title</label>
        <input id="post-title" maxLength={100} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give your post a title" />
        <label htmlFor="post-body">Your post</label>
        <textarea id="post-body" rows={5} maxLength={3000} required value={body} onChange={(event) => setBody(event.target.value)} placeholder="What would you like to share?" />
        <div className="post-form-footer">
          <span>{body.length}/3000</span>
          <button type="submit" disabled={saving || atLimit}>{saving ? "Publishing..." : "Publish post"}</button>
        </div>
        {message && <p className="post-feedback" role="status">{message}</p>}
      </form>
    </section> : <section className="post-login-prompt">
      <h2>Want to publish a post?</h2>
      <p>Log in or create an account to write and save your own posts.</p>
      <Link to="/login">Log in</Link><Link to="/signup">Create an account</Link>
    </section>)}

    <section className="post-feed" aria-labelledby="post-feed-title">
      <h2 id="post-feed-title">Your posts</h2>
      {!user ? <p className="post-empty">Log in to create and view your posts.</p> : feedLoading || postsUserId !== user.uid ? <p>Loading your posts...</p> : feedError ? <p className="post-feedback" role="status">{feedError}</p> : newestFirst.length === 0 ?
        <p className="post-empty">You haven’t posted anything yet.</p> :
        <div className="post-list">{newestFirst.map((post) => <article className="community-post" key={post.id}>
          <div className="community-post-meta"><strong>{post.authorName || "DEV@Deakin member"}</strong><time>{postDate(post)}</time></div>
          <h3>{post.title}</h3>
          <p>{post.body}</p>
        </article>)}</div>}
    </section>
  </main>;
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
