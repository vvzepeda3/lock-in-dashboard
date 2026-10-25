import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthForm from '../components/AuthForm.jsx';
import GuestButton from '../components/GuestButton.jsx';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from?.pathname || '/';

  if (user) return <Navigate to={from} replace />;

  return (
    <AuthForm
      title="Log in"
      submitLabel="Log in"
      onSubmit={async (email, password) => {
        await login(email, password);
        navigate(from, { replace: true });
      }}
      footer={
        <>
          <GuestButton />
          <p className="muted">No account? <Link to="/signup">Sign up</Link></p>
        </>
      }
    />
  );
}
