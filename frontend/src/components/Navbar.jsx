import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const homeLink = (section) => location.pathname === "/" ? `#${section}` : `/#${section}`;

  return <nav className="navbar" aria-label="Main navigation">
    <Link className="navbar-brand" to="/">DEV@Deakin</Link>
    <form className="nav-search" role="search" onSubmit={(e) => e.preventDefault()}>
      <input type="search" aria-label="Search DEV@Deakin" placeholder="Search..." />
    </form>
    <div className="nav-actions">
      <Link to={homeLink("work")}>Post</Link><Link to="/pricing">Pricing</Link>
      {user ? <><span className="nav-plan">{profile?.plan || "Free"} plan</span><button className="nav-login" type="button" onClick={() => signOut(auth)}>Logout</button></>
        : <Link className="nav-login" to="/login">Login</Link>}
    </div>
  </nav>;
}
