import { useState, useEffect } from 'react';
import { createUser, updateUser } from '../../services/api';

const initialUserState = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  direccion: '',
  telefono: '',
  rol: 'Cliente',
  estado: 'Activo',
};

const UserModal = ({ isOpen, onClose, onSaved, userToEdit = null }) => {
  const [formData, setFormData] = useState(initialUserState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        nombre: userToEdit.nombre || '',
        apellido: userToEdit.apellido || '',
        email: userToEdit.email || '',
        password: '',
        tipoDocumento: userToEdit.tipoDocumento || 'CC',
        numeroDocumento: userToEdit.numeroDocumento || '',
        direccion: userToEdit.direccion || '',
        telefono: userToEdit.telefono || '',
        rol: userToEdit.rol || 'Cliente',
        estado: userToEdit.estado || 'Activo',
      });
    } else {
      setFormData(initialUserState);
    }
    setError('');
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      setError('Nombre y apellido son obligatorios.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (!userToEdit && (!formData.password || formData.password.length < 6)) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!formData.numeroDocumento.trim()) {
      setError('El número de documento es obligatorio.');
      return;
    }
    if (!formData.telefono.trim()) {
      setError('El teléfono es obligatorio.');
      return;
    }
    if (!formData.direccion.trim()) {
      setError('La dirección es obligatoria.');
      return;
    }

    setLoading(true);
    try {
      if (userToEdit) {
        const updatePayload = {
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          email: formData.email.trim(),
          tipoDocumento: formData.tipoDocumento,
          numeroDocumento: formData.numeroDocumento.trim(),
          direccion: formData.direccion.trim(),
          telefono: formData.telefono.trim(),
          rol: formData.rol,
          estado: formData.estado,
        };
        if (formData.password && formData.password.trim()) {
          updatePayload.password = formData.password.trim();
        }
        await updateUser(userToEdit.id, updatePayload);
      } else {
        await createUser({
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          email: formData.email.trim(),
          password: formData.password,
          tipoDocumento: formData.tipoDocumento,
          numeroDocumento: formData.numeroDocumento.trim(),
          direccion: formData.direccion.trim(),
          telefono: formData.telefono.trim(),
          rol: formData.rol,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{userToEdit ? `Editar Usuario: ${userToEdit.nombre}` : 'Nuevo Usuario'}</h3>
          <button type="button" className="modal-close-icon" onClick={onClose} aria-label="Cerrar">
            &times;
          </button>
        </div>

        {error && <div className="modal-alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="user-nombre">Nombre *</label>
              <input
                id="user-nombre"
                name="nombre"
                type="text"
                required
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Salome"
              />
            </div>
            <div className="form-group">
              <label htmlFor="user-apellido">Apellido *</label>
              <input
                id="user-apellido"
                name="apellido"
                type="text"
                required
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Ej. Estrada"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="user-email">Correo electrónico *</label>
              <input
                id="user-email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="user-password">
                {userToEdit ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
              </label>
              <input
                id="user-password"
                name="password"
                type="password"
                required={!userToEdit}
                value={formData.password}
                onChange={handleChange}
                placeholder={userToEdit ? 'Sin cambios' : 'Mínimo 6 caracteres'}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="user-tipoDocumento">Tipo de Documento *</label>
              <select
                id="user-tipoDocumento"
                name="tipoDocumento"
                value={formData.tipoDocumento}
                onChange={handleChange}
              >
                <option value="CC">Cédula de Ciudadanía (CC)</option>
                <option value="CE">Cédula de Extranjería (CE)</option>
                <option value="TI">Tarjeta de Identidad (TI)</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="user-numeroDocumento">Número de Documento *</label>
              <input
                id="user-numeroDocumento"
                name="numeroDocumento"
                type="text"
                required
                value={formData.numeroDocumento}
                onChange={handleChange}
                placeholder="Ej. 1020304050"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="user-telefono">Teléfono *</label>
              <input
                id="user-telefono"
                name="telefono"
                type="tel"
                required
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej. 3015528014"
              />
            </div>
            <div className="form-group">
              <label htmlFor="user-direccion">Dirección *</label>
              <input
                id="user-direccion"
                name="direccion"
                type="text"
                required
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Ej. Calle 10 # 40-20"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="user-rol">Rol en el Sistema *</label>
              <select id="user-rol" name="rol" value={formData.rol} onChange={handleChange}>
                <option value="Cliente">Cliente</option>
                <option value="Empleado">Empleado</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
            {userToEdit && (
              <div className="form-group">
                <label htmlFor="user-estado">Estado</label>
                <select
                  id="user-estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Guardando...' : userToEdit ? 'Actualizar Usuario' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
