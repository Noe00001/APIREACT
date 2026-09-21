import { useState, useEffect } from 'react';
import validators from '../utils/validators';
import Input from './ui/Input';
import Button from './ui/Button';
import { registerUser } from '../services/api';

const RegisterModal = ({ isOpen, onClose, onRegistered }) => {
  const [step, setStep] = useState(1);
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
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (k) => (e) => {
    const value = e.target.value;
    setForm((s) => ({ ...s, [k]: value }));
    let err = '';
    switch (k) {
      case 'nombre':
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

  const handleNextStep = (e) => {
    e.preventDefault();
    const emailErr = validators.validateEmail(form.email);
    if (emailErr) {
      setErrors((prev) => ({ ...prev, email: emailErr }));
      return;
    }
    setStep(2);
  };

  const validateAll = () => {
    const e = {};
    e.nombre = validators.validateName(form.nombre);
    e.apellido = validators.validateName(form.apellido);
    e.password = validators.validatePassword(form.password);
    e.confirm = validators.validateConfirmPassword(form.password, form.confirm);
    e.numeroDocumento = validators.validateDocumentNumber(form.numeroDocumento);
    e.telefono = validators.validatePhone(form.telefono);
    setErrors((prev) => ({ ...prev, ...e }));
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
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '6px', background: step >= 1 ? 'var(--brand-color)' : '#e5e7eb', borderRadius: '4px' }} />
          <div style={{ width: '40px', height: '6px', background: step >= 2 ? 'var(--brand-color)' : '#e5e7eb', borderRadius: '4px' }} />
        </div>

        {step === 1 ? (
          <form onSubmit={handleNextStep} className="auth-form">
            <p style={{ marginBottom: '1rem', color: 'var(--text-color)', opacity: 0.8 }}>Paso 1: Ingresa tu correo electrónico</p>
            <Input label="Correo electrónico" id="modal-email" type="email" value={form.email} onChange={handleChange('email')} error={errors.email} />
            <div className="auth-actions" style={{ marginTop: '1rem' }}>
              <Button type="submit" variant="primary">Siguiente</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-grid">
            <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-color)', opacity: 0.8 }}>Continuando como: <strong>{form.email}</strong> <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--brand-color)', textDecoration: 'underline', cursor: 'pointer', marginLeft: '8px' }}>(Cambiar)</button></p>
            </div>
            <Input label="Nombre (10-20 char)" id="modal-nombre" maxLength={50} value={form.nombre} onChange={handleChange('nombre')} error={errors.nombre} />
            <Input label="Apellido (10-20 char)" id="modal-apellido" maxLength={50} value={form.apellido} onChange={handleChange('apellido')} error={errors.apellido} />
            <Input label="Tipo de documento" id="modal-tipodoc" maxLength={20} value={form.tipoDocumento} onChange={handleChange('tipoDocumento')} />
            <Input label="Número de documento" id="modal-numdoc" maxLength={12} value={form.numeroDocumento} onChange={handleChange('numeroDocumento')} error={errors.numeroDocumento} />
            <Input label="Dirección" id="modal-direccion" maxLength={120} value={form.direccion} onChange={handleChange('direccion')} />
            <Input label="Teléfono" id="modal-telefono" maxLength={15} value={form.telefono} onChange={handleChange('telefono')} error={errors.telefono} />
            <Input label="Contraseña" id="modal-password" type="password" maxLength={50} value={form.password} onChange={handleChange('password')} error={errors.password} />
            <div className="field-group" style={{ gridColumn: '1 / -1' }}>
              <Input label="Confirmar contraseña" id="modal-confirm" type="password" maxLength={50} value={form.confirm} onChange={handleChange('confirm')} error={errors.confirm} />
            </div>
            <div className="auth-actions" style={{ gridColumn: '1 / -1' }}>
              <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Guardando...' : 'Crear cuenta'}</Button>
            </div>
            {serverMessage && <p className="form-server-error" role="alert">{serverMessage}</p>}
          </form>
        )}
      </div>
    </div>
  );
};

export default RegisterModal;
