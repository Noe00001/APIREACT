import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterModal from '../components/modals/RegisterModal';
import validators from '../utils/validators';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { loginUser, checkEmail } from '../services/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [openRegister, setOpenRegister] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (step === 1) {
      e.email = validators.validateEmail(email);
    } else {
      e.password = validators.validatePassword(password);
    }
    setErrors(e);
    return Object.values(e).every((v) => !v);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerMessage('');
    try {
      if (step === 1) {
        await checkEmail({ email });
        setStep(2);
      } else {
        const result = await loginUser({ email, password });
        const storage = remember ? localStorage : sessionStorage;
        localStorage.removeItem('cafe_salome_token');
        sessionStorage.removeItem('cafe_salome_token');
        storage.setItem('cafe_salome_token', result.access_token);
        localStorage.setItem('cafe_salome_user', JSON.stringify(result.user));
        window.dispatchEvent(new Event('auth-changed'));
        navigate('/panel');
      }
    } catch (error) {
      setServerMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2>Iniciar sesión</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          {step === 1 ? (
            <Input label="Correo" id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-color)', fontWeight: 'bold' }}>{email}</span>
                <button type="button" onClick={() => { setStep(1); setPassword(''); setServerMessage(''); }} className="auth-link" style={{ margin: 0 }}>Cambiar correo</button>
              </div>
              <Input label="Contraseña" id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
            </>
          )}

          <div className="auth-actions">
            {step === 2 && (
              <div className="inline-options">
                <label className="checkbox-label">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  Recordarme
                </label>
                <button type="button" onClick={() => navigate('/recover')} className="auth-link">¿Olvidaste tu contraseña?</button>
              </div>
            )}

            <div className="inline-options">
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Procesando...' : step === 1 ? 'Continuar' : 'Entrar'}
              </Button>
              {step === 1 && (
                <Button type="button" variant="secondary" onClick={() => setOpenRegister(true)}>Crear cuenta</Button>
              )}
            </div>
          </div>
        </form>
        {serverMessage && <p className="form-server-error" role="alert">{serverMessage}</p>}
      </div>

      <RegisterModal isOpen={openRegister} onClose={() => setOpenRegister(false)} onRegistered={() => {}} />
    </div>
  );
};

export default LoginPage;
