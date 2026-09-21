import { useState, useEffect } from 'react';
import validators from '../utils/validators';
import Input from './ui/Input';
import Button from './ui/Button';
import { registerUser } from '../services/api';

const RegisterModal = ({ isOpen, onClose, onRegistered }) => {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    tipoDocumento: '',
    numeroDocumento: '',
    direccion: '',
    telefono: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm({ nombre: '', apellido: '', tipoDocumento: '', numeroDocumento: '', direccion: '', telefono: '', email: '', password: '', confirm: '' });
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (k) => (e) => {
    const value = e.target.value;
    setForm((s) => ({ ...s, [k]: value }));
    // Validar en tiempo real.
    let err = '';
    switch (k) {
      case 'nombre':
        err = validators.validateName(value);
        break;
      case 'apellido':
        err = validators.validateName(value);
        break;
      case 'numeroDocumento':
        err = validators.validateDocumentNumber(value);
        break;
      case 'telefono':
        err = validators.validatePhone(value);
        break;
      case 'email':
        err = validators.validateEmail(value);
        break;
      case 'password':
        err = validators.validatePassword(value);
        // update confirm error as well
        if (form.confirm) {
          const ce = validators.validateConfirmPassword(value, form.confirm);
          setErrors((prev) => ({ ...prev, confirm: ce }));
        }
        break;
      case 'confirm':
        err = validators.validateConfirmPassword(form.password, value);
        break;
      default:
        err = '';
    }
    setErrors((prev) => ({ ...prev, [k]: err }));
  };

  const validateAll = () => {
    const e = {};
    e.nombre = validators.validateName(form.nombre);
    e.apellido = validators.validateName(form.apellido);
    e.email = validators.validateEmail(form.email);
    e.password = validators.validatePassword(form.password);
    e.confirm = validators.validateConfirmPassword(form.password, form.confirm);
    e.numeroDocumento = validators.validateDocumentNumber(form.numeroDocumento);
    e.telefono = validators.validatePhone(form.telefono);
    setErrors(e);
    return Object.values(e).every((v) => !v);
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validateAll()) return;
    setSubmitting(true);
    setServerMessage('');
    registerUser({ ...form, confirm: undefined })
      .then(() => {
        if (onRegistered) onRegistered(form);
        onClose();
      })
      .catch((error) => setServerMessage(error.message))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Crear cuenta</h3>
          <button type="button" onClick={onClose} className="modal-close-button">Cerrar</button>
        </div>
        <form onSubmit={handleSubmit} className="auth-grid">
          <Input label="Nombre" id="modal-nombre" maxLength={50} value={form.nombre} onChange={handleChange('nombre')} error={errors.nombre} />
          <Input label="Apellido" id="modal-apellido" maxLength={50} value={form.apellido} onChange={handleChange('apellido')} error={errors.apellido} />
          <Input label="Tipo de documento" id="modal-tipodoc" maxLength={20} value={form.tipoDocumento} onChange={handleChange('tipoDocumento')} />
          <Input label="Número de documento" id="modal-numdoc" maxLength={12} value={form.numeroDocumento} onChange={handleChange('numeroDocumento')} error={errors.numeroDocumento} />
          <Input label="Dirección" id="modal-direccion" maxLength={120} value={form.direccion} onChange={handleChange('direccion')} />
          <Input label="Teléfono" id="modal-telefono" maxLength={15} value={form.telefono} onChange={handleChange('telefono')} error={errors.telefono} />
          <Input label="Correo" id="modal-email" type="email" maxLength={100} value={form.email} onChange={handleChange('email')} error={errors.email} />
          <Input label="Contraseña" id="modal-password" type="password" maxLength={128} value={form.password} onChange={handleChange('password')} error={errors.password} />
          <div className="field-group" style={{ gridColumn: '1 / -1' }}>
            <Input label="Confirmar contraseña" id="modal-confirm" type="password" maxLength={128} value={form.confirm} onChange={handleChange('confirm')} error={errors.confirm} />
          </div>
          <div className="auth-actions" style={{ gridColumn: '1 / -1' }}>
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Guardando...' : 'Crear cuenta'}</Button>
          </div>
          {serverMessage && <p className="form-server-error" role="alert">{serverMessage}</p>}
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;
