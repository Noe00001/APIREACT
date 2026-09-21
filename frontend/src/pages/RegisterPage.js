import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { registerUser } from '../services/api';
import validators from '../utils/validators';

const RegisterPage = () => {
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
    // validar en tiempo real
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

  const validate = () => {
    const e = {};
    const v = validators;
    e.nombre = v.validateName(form.nombre);
    e.apellido = v.validateName(form.apellido);
    e.email = v.validateEmail(form.email);
    e.password = v.validatePassword(form.password);
    e.confirm = v.validateConfirmPassword(form.password, form.confirm);
    e.numeroDocumento = v.validateDocumentNumber(form.numeroDocumento);
    e.telefono = v.validatePhone(form.telefono);
    setErrors(e);
    return Object.values(e).every((x) => !x);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
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
        <form onSubmit={handleSubmit} className="auth-form auth-grid">
          <Input label="Nombre" id="reg-nombre" value={form.nombre} onChange={handleChange('nombre')} error={errors.nombre} />
          <Input label="Apellido" id="reg-apellido" value={form.apellido} onChange={handleChange('apellido')} error={errors.apellido} />
          <Input label="Tipo de documento" id="reg-tipodoc" value={form.tipoDocumento} onChange={handleChange('tipoDocumento')} />
          <Input label="Número de documento" id="reg-numdoc" value={form.numeroDocumento} onChange={handleChange('numeroDocumento')} error={errors.numeroDocumento} />
          <Input label="Dirección" id="reg-direccion" value={form.direccion} onChange={handleChange('direccion')} />
          <Input label="Teléfono" id="reg-telefono" value={form.telefono} onChange={handleChange('telefono')} error={errors.telefono} />
          <Input label="Correo" id="reg-email" type="email" value={form.email} onChange={handleChange('email')} error={errors.email} />
          <Input label="Contraseña" id="reg-password" type="password" value={form.password} onChange={handleChange('password')} error={errors.password} />
          <div className="field-group" style={{ gridColumn: '1 / -1' }}>
            <Input label="Confirmar contraseña" id="reg-confirm" type="password" value={form.confirm} onChange={handleChange('confirm')} error={errors.confirm} />
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

export default RegisterPage;
