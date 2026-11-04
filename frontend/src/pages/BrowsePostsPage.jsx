import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

export default function BrowsePostsPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [pagePlan, setPagePlan] = useState("Visitor");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [hiddenIds, setHiddenIds] = useState([]);
  const [expandedIds, setExpandedIds] = useState([]);

  const loadPosts = useCallback(async (signal) => {
    if (authLoading) return;
    setLoading(true);
    setError("");
    try {
      const headers = {};
      if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
      const response = await fetch(`${API_BASE}/posts`, { headers, signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not load posts.");
      setPosts(Array.isArray(result.posts) ? result.posts : []);
      setPagePlan(result.plan || "Free");
    } catch (requestError) {
      if (requestError.name !== "AbortError") setError(requestError.message || "Could not load posts.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    const controller = new AbortController();
    loadPosts(controller.signal);
    return () => controller.abort();
  }, [loadPosts]);

  const visiblePosts = useMemo(() => posts.filter((post) => {
    if (hiddenIds.includes(post.id)) return false;
    if (typeFilter !== "All" && post.type !== typeFilter) return false;
    if (planFilter !== "All" && post.plan !== planFilter) return false;
    if (tagFilter.trim() && !(post.tags || []).some((tag) => tag.toLowerCase().includes(tagFilter.trim().toLowerCase()))) return false;
    if (dateFilter && post.createdAt) {
      const createdDate = new Date(post.createdAt);
      if (Number.isNaN(createdDate.getTime()) || createdDate.toISOString().slice(0, 10) !== dateFilter) return false;
    }
    return true;
  }), [posts, hiddenIds, typeFilter, planFilter, tagFilter, dateFilter]);

  function resetView() {
    setTypeFilter("All"); setPlanFilter("All"); setTagFilter(""); setDateFilter("");
    setHiddenIds([]); setExpandedIds([]);
  }
  function toggleId(setList, id) {
    setList((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return <main className="browse-page">
    <header className="browse-header">
      <div><p className="eyebrow">DEV@Deakin community</p><h1>Browse Posts</h1><p>Showing posts available to: <strong>{pagePlan}</strong></p></div>
      <button type="button" className="browse-reset" onClick={resetView}>Reset filters and hidden posts</button>
    </header>
    <section className="browse-filters" aria-label="Filter posts">
      <label>Type<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All</option><option>Question</option><option>Article</option></select></label>
      <label>Plan<select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)}><option>All</option><option>Free</option>{pagePlan === "Paid" && <option>Paid</option>}</select></label>
      <label>Tag<input value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} placeholder="Filter by tag" /></label>
      <label>Created date<input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></label>
    </section>
    {loading && <p className="browse-status" role="status">Loading posts…</p>}
    {error && <div className="browse-error" role="alert"><p>{error}</p><button type="button" onClick={() => loadPosts()}>Try again</button></div>}
    {!loading && !error && visiblePosts.length === 0 && <p className="browse-status">No posts match these filters.</p>}
    <section className="browse-list" aria-label="Community posts">
      {visiblePosts.map((post) => {
        const expanded = expandedIds.includes(post.id);
        return <article className="browse-post-card" key={post.id}>
          <div className="browse-post-meta"><span className="browse-badge">{post.type}</span><span className={`browse-badge ${post.plan === "Paid" ? "paid" : "free"}`}>{post.plan}</span><span>{formatDate(post.createdAt)}</span></div>
          <h2>{post.title}</h2><p className={expanded ? "browse-post-body expanded" : "browse-post-body"}>{post.body}</p>
          {post.tags?.length > 0 && <ul className="browse-tags">{post.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
          <p className="browse-author">By {post.authorName || "DEV@Deakin member"}</p>
          <div className="browse-post-actions"><button type="button" onClick={() => toggleId(setExpandedIds, post.id)}>{expanded ? "Show preview" : "Read full post"}</button><button type="button" className="subtle" onClick={() => toggleId(setHiddenIds, post.id)}>Hide</button></div>
        </article>;
      })}
    </section>
  </main>;
}
