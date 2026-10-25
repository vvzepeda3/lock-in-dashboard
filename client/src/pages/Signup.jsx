import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthForm from '../components/AuthForm.jsx';
import GuestButton from '../components/GuestButton.jsx';

export default function Signup() {
  const { signup, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/" replace />;

  return (
    <AuthForm
      title="Create account"
      submitLabel="Sign up"
      onSubmit={async (email, password) => {
        await signup(email, password);
        navigate('/', { replace: true });
      }}
      footer={
        <>
          <GuestButton />
          <p className="muted">Already have an account? <Link to="/login">Log in</Link></p>
        </>
      }
    />
  );
}
