import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { PINK } from '../lib/pixel.js';
import PixelPlanet from './PixelPlanet.jsx';

export default function NavBar() {
  const { user, isGuest, isAuthenticated, logout } = useAuth();

  return (
    <header className="nav">
      <Link to="/" className="brand">
        <PixelPlanet size={20} radius={5} pal={PINK} withRing />
        Lock In
      </Link>
      {isAuthenticated && (
        <>
          <nav className="tabs" aria-label="Views">
            <NavLink to="/" end>Timer</NavLink>
            <NavLink to="/stats">Stats</NavLink>
          </nav>
          <div className="account">
            <span className="who">{isGuest ? 'Guest mode' : user?.email}</span>
            <button className="btn btn-quiet" onClick={logout}>
              {isGuest ? 'Exit guest' : 'Log out'}
            </button>
          </div>
        </>
      )}
    </header>
  );
}
