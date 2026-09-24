import React, { useState, useEffect } from 'react';
import { getReservas, updateReservaStatus } from '../../services/api';
import { Calendar, CheckCircle, XCircle, Clock, Search, MessageSquare } from 'lucide-react';

const ReservasTab = ({ userRole, searchTerm = '' }) => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [editingReserva, setEditingReserva] = useState(null);
  const [editForm, setEditForm] = useState({ estado: '', respuesta: '' });

  const loadReservas = async () => {
    try {
      setLoading(true);
      const data = await getReservas();
      setReservas(data);
    } catch (err) {
      setError(err.message || 'Error cargando reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservas();
  }, []);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      const payload = { estado: editForm.estado, respuesta: editForm.respuesta || null };
      await updateReservaStatus(editingReserva.id, payload);
      // Actualizar estado localmente
      setReservas(reservas.map(r => r.id === editingReserva.id ? { ...r, ...payload } : r));
      setEditingReserva(null);
    } catch (err) {
      alert(err.message || 'Error al actualizar la solicitud');
    }
  };

  const openEditModal = (reserva) => {
    setEditingReserva(reserva);
    setEditForm({ estado: reserva.estado, respuesta: reserva.respuesta || '' });
  };

  const filteredReservas = reservas.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.nombre?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term) ||
      r.motivo?.toLowerCase().includes(term) ||
      r.estado?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="reservas-container">
      <div className="dashboard-heading" style={{ marginBottom: '1rem' }}>
        <div>
          <h3>Reservas y Mensajes</h3>
          <span className="table-subtitle">Gestión de reservas de mesa, adopciones y contacto general</span>
        </div>
      </div>

      {error && <div className="dashboard-toast error">{error}</div>}

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Fecha Solicitud</th>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Motivo</th>
              <th>Detalles</th>
              <th>Estado</th>
              {userRole !== 'Cliente' && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>Cargando...</td></tr>
            ) : filteredReservas.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No hay solicitudes registradas o coincidentes.</td></tr>
            ) : (
              filteredReservas.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.creado_en).toLocaleString()}</td>
                  <td><strong>{r.nombre}</strong></td>
                  <td>
                    <div style={{ fontSize: '0.85em', color: 'var(--text-light)' }}>
                      <MailIcon email={r.email} />
                      <PhoneIcon phone={r.telefono} />
                    </div>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                      {r.motivo}
                    </span>
                  </td>
                  <td>
                    <div style={{ maxWidth: '200px', whiteSpace: 'pre-wrap', fontSize: '0.85em' }}>
                      {(r.fecha_tentativa || r.personas) && (
                        <div style={{ marginBottom: '4px', color: 'var(--brand-color)' }}>
                          <strong>{r.fecha_tentativa ? new Date(r.fecha_tentativa).toLocaleString() : 'Sin fecha'}</strong> {r.personas && `(${r.personas} pers.)`}
                        </div>
                      )}
                      {r.mensaje && <div style={{ marginTop: '8px' }}>{r.mensaje}</div>}
                      {r.respuesta && (
                        <div style={{ marginTop: '8px', padding: '6px', background: 'var(--bg-light)', borderRadius: '4px', borderLeft: '3px solid var(--brand-color)' }}>
                          <strong>Respuesta enviada:</strong><br/>
                          {r.respuesta}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge-status ${
                      r.estado === 'Pendiente' ? 'status-pendiente' :
                      r.estado === 'Contactado' ? 'status-en-proceso' :
                      r.estado === 'Confirmada' ? 'status-activo' : 'status-inactivo'
                    }`}>
                      {r.estado}
                    </span>
                  </td>
                  {userRole !== 'Cliente' && (
                    <td className="action-buttons-cell">
                      <button
                        type="button"
                        className="btn-action-primary"
                        onClick={() => openEditModal(r)}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        Gestionar
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingReserva && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Gestionar Solicitud</h3>
              <button type="button" className="close-btn" onClick={() => setEditingReserva(null)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateStatus} className="modal-body">
              <div className="form-group">
                <label>Estado de la solicitud</label>
                <select
                  value={editForm.estado}
                  onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                  className="form-input"
                  required
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Contactado">Contactado</option>
                  <option value="Confirmada">Confirmada</option>
                  <option value="Cancelada">Cancelada / Rechazada</option>
                </select>
              </div>
              <div className="form-group">
                <label>Respuesta o Nota para el cliente</label>
                <textarea
                  value={editForm.respuesta}
                  onChange={(e) => setEditForm({ ...editForm, respuesta: e.target.value })}
                  className="form-input"
                  rows={4}
                  placeholder="Estariamos muy contentos de celebrar contigo tu evento..."
                />
              </div>
              <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-action-outline" onClick={() => setEditingReserva(null)}>Cancelar</button>
                <button type="submit" className="btn-action-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MailIcon = ({ email }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    <MessageSquare size={12} /> <a href={`mailto:${email}`}>{email}</a>
  </div>
);

const PhoneIcon = ({ phone }) => {
  if (!phone) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
      <span style={{ fontSize: '12px' }}>📞</span> <a href={`tel:${phone}`}>{phone}</a>
    </div>
  );
};

export default ReservasTab;
