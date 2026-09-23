import RecoverPassword from '../components/auth/RecoverPassword';
import { useNavigate } from 'react-router-dom';

const RecoverPasswordPage = () => {
  const navigate = useNavigate();
  return (
    <div className="auth-shell">
      <RecoverPassword onSent={() => { navigate('/login'); }} />
      <div className="mt-4 text-center">
        <button type="button" onClick={() => navigate('/login')} className="auth-link">Volver a iniciar sesión</button>
      </div>
    </div>
  );
};

export default RecoverPasswordPage;
