import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user, isGuest } = useAuth();

  return (
    <section className="card">
      <h1>Welcome{user ? `, ${user.email}` : ''}</h1>
      <p className="muted">
        {isGuest
          ? 'You are in guest mode. Your data will be stored in this browser only.'
          : 'You are logged in. Your data is saved to your account.'}
      </p>
      <p className="muted">The timer arrives in stage 2.</p>
    </section>
  );
}
