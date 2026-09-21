import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { registerUser } from '../services/api';
import validators from '../utils/validators';

const RegisterPage = () => {
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
  const navigate = useNavigate();

  const handleChange = (k) => (e) => {
    const val = e.target.value;
    setForm((s) => ({ ...s, [k]: val }));
    let err = '';
    switch (k) {
      case 'nombre':
      case 'apellido':
        err = validators.validateName(val);
        break;
      case 'email':
        err = validators.validateEmail(val);
        break;
      case 'password':
        err = validators.validatePassword(val);
        if (form.confirm) {
          const ce = validators.validateConfirmPassword(val, form.confirm);
          setErrors((prev) => ({ ...prev, confirm: ce }));
        }
        break;
      case 'confirm':
        err = validators.validateConfirmPassword(form.password, val);
        break;
      case 'numeroDocumento':
        err = validators.validateDocumentNumber(val);
        break;
      case 'telefono':
        err = validators.validatePhone(val);
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
    const v = validators;
    e.nombre = v.validateName(form.nombre);
    e.apellido = v.validateName(form.apellido);
    e.password = v.validatePassword(form.password);
    e.confirm = v.validateConfirmPassword(form.password, form.confirm);
    e.numeroDocumento = v.validateDocumentNumber(form.numeroDocumento);
    e.telefono = v.validatePhone(form.telefono);
    setErrors((prev) => ({ ...prev, ...e }));
    return Object.values(e).every((x) => !x);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateAll()) return;
    setSubmitting(true);
    setServerMessage('');
    try {
      await registerUser({ ...form, confirm: undefined });
      navigate('/login', { state: { message: 'Cuenta creada. Ahora puedes iniciar sesión.' } });
    } catch (error) {
      setServerMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2>Registrarse</h2>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '6px', background: step >= 1 ? 'var(--brand-color)' : '#e5e7eb', borderRadius: '4px' }} />
          <div style={{ width: '40px', height: '6px', background: step >= 2 ? 'var(--brand-color)' : '#e5e7eb', borderRadius: '4px' }} />
        </div>
        
        {step === 1 ? (
          <form onSubmit={handleNextStep} className="auth-form">
            <p style={{ marginBottom: '1rem', color: 'var(--text-color)', opacity: 0.8 }}>Paso 1: Ingresa tu correo electrónico</p>
            <Input label="Correo electrónico" id="reg-email" type="email" value={form.email} onChange={handleChange('email')} error={errors.email} />
            <div className="auth-actions" style={{ marginTop: '1rem' }}>
              <Button type="submit" variant="primary">Siguiente</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form auth-grid">
            <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-color)', opacity: 0.8 }}>Continuando como: <strong>{form.email}</strong> <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--brand-color)', textDecoration: 'underline', cursor: 'pointer', marginLeft: '8px' }}>(Cambiar)</button></p>
            </div>
            <Input label="Nombre (10-20 char)" id="reg-nombre" value={form.nombre} onChange={handleChange('nombre')} error={errors.nombre} />
            <Input label="Apellido (10-20 char)" id="reg-apellido" value={form.apellido} onChange={handleChange('apellido')} error={errors.apellido} />
            <Input label="Tipo de documento" id="reg-tipodoc" value={form.tipoDocumento} onChange={handleChange('tipoDocumento')} />
            <Input label="Número de documento" id="reg-numdoc" value={form.numeroDocumento} onChange={handleChange('numeroDocumento')} error={errors.numeroDocumento} />
            <Input label="Dirección" id="reg-direccion" value={form.direccion} onChange={handleChange('direccion')} />
            <Input label="Teléfono" id="reg-telefono" value={form.telefono} onChange={handleChange('telefono')} error={errors.telefono} />
            <Input label="Contraseña" id="reg-password" type="password" value={form.password} onChange={handleChange('password')} error={errors.password} />
            <div className="field-group" style={{ gridColumn: '1 / -1' }}>
              <Input label="Confirmar contraseña" id="reg-confirm" type="password" value={form.confirm} onChange={handleChange('confirm')} error={errors.confirm} />
            </div>
            <div className="auth-actions" style={{ gridColumn: '1 / -1' }}>
              <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Guardando...' : 'Crear cuenta'}</Button>
            </div>
            {serverMessage && <p className="form-server-error" role="alert" style={{ gridColumn: '1 / -1' }}>{serverMessage}</p>}
          </form>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
