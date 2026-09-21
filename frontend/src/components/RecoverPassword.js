import { useState } from 'react';
import PropTypes from 'prop-types';
import Input from './ui/Input';
import Button from './ui/Button';
import { recoverPassword, resetPassword } from '../services/api';
import validators from '../utils/validators';

const RecoverPassword = ({ onSent, defaultEmail }) => {
  const [email, setEmail] = useState(defaultEmail || '');
  const [error, setError] = useState('');
  const [serverMessage, setServerMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validate = () => {
    const err = validators.validateEmail(email);
    setError(err);
    return !err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerMessage('');
    try {
      const result = await recoverPassword({ email });
      setServerMessage(result.message);
      setResetToken(result.resetToken || '');
    } catch (requestError) {
      setServerMessage(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    if (newPassword.length < 6 || newPassword.length > 128) {
      setServerMessage('La nueva contraseña debe tener entre 6 y 128 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setServerMessage('Las contraseñas no coinciden');
      return;
    }
    setSubmitting(true);
    try {
      const result = await resetPassword({ token: resetToken, password: newPassword });
      setServerMessage(result.message);
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      if (onSent) onSent(email);
    } catch (requestError) {
      setServerMessage(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h3>Recuperar contraseña</h3>
        <form onSubmit={handleSubmit} className="auth-form">
          <Input label="Correo electrónico" id="recover-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <div className="auth-actions">
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Enviando...' : 'Recuperar contraseña'}</Button>
          </div>
          {serverMessage && <p className="form-server-error" role="status">{serverMessage}</p>}
        </form>
        {resetToken && (
          <form onSubmit={handleReset} className="auth-form reset-form">
            <p>Token temporal generado. Define una nueva contraseña para recuperar tu cuenta.</p>
            <Input label="Nueva contraseña" id="reset-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            <Input label="Confirmar nueva contraseña" id="reset-confirm" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Actualizando...' : 'Actualizar contraseña'}</Button>
          </form>
        )}
      </div>
    </div>
  );
};

RecoverPassword.propTypes = {
  onSent: PropTypes.func,
  defaultEmail: PropTypes.string,
};

export default RecoverPassword;
