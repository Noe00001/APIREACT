import React, { useState, useEffect } from 'react';
import { getPqrs, createPqr, updatePqrStatus } from '../../services/api';
import { MessageSquare, Plus, X, Search, CheckCircle } from 'lucide-react';

const PQRTab = ({ userRole, userId }) => {
  const [pqrs, setPqrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para Modal de Nueva PQR (Solo clientes)
  const [showModal, setShowModal] = useState(false);
  const [tipo, setTipo] = useState('Peticion');
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  
  // Estados para Modal de Respuesta (Admin/Empleado)
  const [showRespuestaModal, setShowRespuestaModal] = useState(false);
  const [selectedPqr, setSelectedPqr] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [estadoPqr, setEstadoPqr] = useState('Respondida');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPqrs = async () => {
    try {
      setLoading(true);
      const data = await getPqrs();
      setPqrs(data);
    } catch (err) {
      setError(err.message || 'Error cargando PQRs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPqrs();
  }, []);

  const handleCreatePqr = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createPqr({ tipo, asunto, descripcion });
      setShowModal(false);
      setAsunto('');
      setDescripcion('');
      loadPqrs();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRespuesta = (pqr) => {
    setSelectedPqr(pqr);
    setRespuesta(pqr.respuesta || '');
    setEstadoPqr(pqr.estado !== 'Pendiente' ? pqr.estado : 'En Proceso');
    setShowRespuestaModal(true);
  };

  const handleResponderPqr = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updatePqrStatus(selectedPqr.id, {
        estado: estadoPqr,
        respuesta: respuesta
      });
      setShowRespuestaModal(false);
      loadPqrs();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pqr-container">
      <div className="dashboard-heading" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h3>Atención al Cliente (PQR)</h3>
          <span className="table-subtitle">Peticiones, Quejas, Reclamos y Sugerencias</span>
        </div>
        {(userRole === 'Cliente' || userRole === 'Empleado') && (
          <button type="button" className="btn-action-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} style={{ marginRight: '5px' }} /> Radicar PQR
          </button>
        )}
      </div>

      {error && <div className="dashboard-toast error">{error}</div>}

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Radicado</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Asunto</th>
              {userRole !== 'Cliente' && <th>Cliente</th>}
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={userRole !== 'Cliente' ? 7 : 6} style={{ textAlign: 'center' }}>Cargando...</td></tr>
            ) : pqrs.length === 0 ? (
              <tr><td colSpan={userRole !== 'Cliente' ? 7 : 6} style={{ textAlign: 'center' }}>No hay PQR registradas.</td></tr>
            ) : (
              pqrs.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.radicado}</strong></td>
                  <td>{p.tipo}</td>
                  <td>{new Date(p.fecha_creacion).toLocaleDateString()}</td>
                  <td>{p.asunto}</td>
                  {userRole !== 'Cliente' && <td>{p.cliente_nombre}</td>}
                  <td>
                    <span className={`badge-status ${p.estado === 'Pendiente' ? 'status-pendiente' : p.estado === 'Respondida' ? 'status-activo' : p.estado === 'En Proceso' ? 'status-en-proceso' : 'status-inactivo'}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="action-buttons-cell">
                    <button 
                      className="btn-sm btn-edit" 
                      onClick={() => handleOpenRespuesta(p)}
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR PQR (CLIENTE) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3>Radicar Nueva Solicitud</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreatePqr} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Tipo de Solicitud</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="form-input" required>
                  <option value="Peticion">Petición</option>
                  <option value="Queja">Queja</option>
                  <option value="Reclamo">Reclamo</option>
                  <option value="Sugerencia">Sugerencia</option>
                </select>
              </div>
              <div className="form-group">
                <label>Asunto</label>
                <input type="text" value={asunto} onChange={(e) => setAsunto(e.target.value)} className="form-input" required placeholder="Ej. Solicitud de información" />
              </div>
              <div className="form-group">
                <label>Descripción detallada</label>
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="form-input" required rows={5} placeholder="Describe detalladamente tu solicitud..."></textarea>
              </div>
              <button type="submit" className="btn-action-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Radicando...' : 'Enviar Radicado'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VER/RESPONDER PQR */}
      {showRespuestaModal && selectedPqr && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h3>Detalle de {selectedPqr.radicado}</h3>
              <button className="close-btn" onClick={() => setShowRespuestaModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                  <strong>Cliente:</strong> {selectedPqr.cliente_nombre} | <strong>Tipo:</strong> {selectedPqr.tipo} | <strong>Fecha:</strong> {new Date(selectedPqr.fecha_creacion).toLocaleString()}
                </div>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>{selectedPqr.asunto}</h4>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selectedPqr.descripcion}</p>
              </div>

              {/* Formulario de Respuesta para Admin/Empleado */}
              {userRole !== 'Cliente' ? (
                <form onSubmit={handleResponderPqr} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Estado del Ticket</label>
                    <select value={estadoPqr} onChange={(e) => setEstadoPqr(e.target.value)} className="form-input" required>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Respondida">Respondida</option>
                      <option value="Cerrada">Cerrada</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Respuesta (Visible para el cliente)</label>
                    <textarea 
                      value={respuesta} 
                      onChange={(e) => setRespuesta(e.target.value)} 
                      className="form-input" 
                      rows={4} 
                      placeholder="Escribe la respuesta que verá el cliente..."
                      required={estadoPqr === 'Respondida' || estadoPqr === 'Cerrada'}
                    ></textarea>
                  </div>
                  <button type="submit" className="btn-action-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Actualizar PQR'}
                  </button>
                </form>
              ) : (
                /* Vista de Respuesta para el Cliente */
                <div style={{ marginTop: '1rem' }}>
                  <h4>Respuesta de Atención al Cliente</h4>
                  {selectedPqr.respuesta ? (
                    <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px', border: '1px solid #c8e6c9' }}>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selectedPqr.respuesta}</p>
                      <small style={{ display: 'block', marginTop: '0.5rem', color: '#388e3c' }}>Respondido por: {selectedPqr.respondido_por_nombre}</small>
                    </div>
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                      Aún no hay respuesta para este ticket.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PQRTab;
