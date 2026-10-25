import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function GuestButton() {
  const { continueAsGuest } = useAuth();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={() => {
        continueAsGuest();
        navigate('/');
      }}
    >
      Continue as guest
    </button>
  );
}
