import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function NavBar() {
  const { user, isGuest, isAuthenticated, logout } = useAuth();

  return (
    <header className="nav">
      <Link to="/" className="brand">Lock In</Link>
      {isAuthenticated && (
        <nav className="nav-links">
          <NavLink to="/" end>Timer</NavLink>
          <span className="muted">{isGuest ? 'Guest' : user?.email}</span>
          <button className="btn btn-ghost" onClick={logout}>
            {isGuest ? 'Exit guest' : 'Log out'}
          </button>
        </nav>
      )}
    </header>
  );
}
