import React, { useState, useEffect } from 'react';
import { getVentas, createVenta, getGatos, getServices, getProducts, getUsers, updateVentaStatus } from '../../services/api';
import { FileText, Plus, X, Search, Check, AlertCircle } from 'lucide-react';

const VentasTab = ({ userRole, userId }) => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para Modal de Nueva Venta
  const [showModal, setShowModal] = useState(false);
  const [catalogo, setCatalogo] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadVentas = async () => {
    try {
      setLoading(true);
      const data = await getVentas();
      setVentas(data);
    } catch (err) {
      setError(err.message || 'Error cargando ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVentas();
  }, []);

  const prepareNuevaVenta = async () => {
    try {
      // Cargar gatos, servicios y productos
      const [gatos_list, servs, prods] = await Promise.all([getGatos(), getServices(), getProducts()]);
      const mappedCatalog = [
        ...gatos_list.filter(g => g.estado === 'Activo').map(g => ({ ...g, tipo_item: 'Gato', precio: 0 })),
        ...servs.filter(s => s.estado === 'Activo').map(s => ({ ...s, tipo_item: 'Servicio' })),
        ...prods.filter(p => p.estado === 'Activo').map(p => ({ ...p, tipo_item: 'Producto' }))
      ];
      setCatalogo(mappedCatalog);

      if (userRole === 'Administrador' || userRole === 'Empleado') {
        const usrs = await getUsers();
        setClientes(usrs.filter(u => u.rol === 'Cliente' && u.estado === 'Activo'));
      }
      
      setCart([]);
      setSelectedCliente('');
      setMetodoPago('Efectivo');
      setShowModal(true);
    } catch (err) {
      alert('Error cargando catálogo: ' + err.message);
    }
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id && c.tipo_item === item.tipo_item);
    
    if (item.tipo_item === 'Gato') {
      if (existing) return alert('No puedes adoptar el mismo gato más de una vez.');
      setCart([...cart, { ...item, cantidad: 1, subtotal: Number(item.precio) }]);
      return;
    }

    const currentQty = existing ? existing.cantidad : 0;
    if (currentQty + 1 > item.stock) {
      return alert(`Stock insuficiente. Solo hay ${item.stock} unidades disponibles.`);
    }

    if (existing) {
      setCart(cart.map(c => 
        (c.id === item.id && c.tipo_item === item.tipo_item) 
        ? { ...c, cantidad: c.cantidad + 1, subtotal: (c.cantidad + 1) * c.precio }
        : c
      ));
    } else {
      setCart([...cart, { ...item, cantidad: 1, subtotal: Number(item.precio) }]);
    }
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const cartTotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleCreateVenta = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert('El carrito está vacío');
    
    setIsSubmitting(true);
    try {
      const payload = {
        cliente_id: (userRole === 'Cliente') ? userId : (selectedCliente || null),
        detalles: cart.map(c => ({
          tipo_item: c.tipo_item,
          producto_id: c.tipo_item === 'Producto' ? c.id : null,
          servicio_id: c.tipo_item === 'Servicio' ? c.id : null,
          gato_id: c.tipo_item === 'Gato' ? c.id : null,
          nombre_item: c.nombre,
          cantidad: c.cantidad,
          precio_unitario: Number(c.precio),
          subtotal: c.subtotal
        })),
        descuentos: 0,
        impuestos: 0,
        metodo_pago: metodoPago
      };

      await createVenta(payload);
      setShowModal(false);
      loadVentas();
    } catch (err) {
      alert(err.message || 'Error al procesar la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEstado = async (id, estado) => {
    if (!window.confirm(`¿Seguro que deseas marcar la venta como ${estado}?`)) return;
    try {
      await updateVentaStatus(id, estado);
      loadVentas();
    } catch(err) {
      alert(err.message);
    }
  };

  const filteredVentas = ventas.filter(v => 
    v.numero_venta.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ventas-container">
      <div className="dashboard-heading" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h3>Historial de Adopciones y Experiencias</h3>
          <span className="table-subtitle">Registro de operaciones y contrataciones</span>
        </div>
        <button type="button" className="btn-action-primary" onClick={prepareNuevaVenta}>
          <Plus size={16} style={{ marginRight: '5px' }} /> Registrar Operación
        </button>
      </div>

      {error && <div className="dashboard-toast error">{error}</div>}

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          placeholder="Buscar por número de venta o cliente..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="dashboard-search-input"
          style={{ width: '100%', maxWidth: '400px' }}
        />
      </div>

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>No. Venta</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Método</th>
              <th>Total</th>
              <th>Estado</th>
              {userRole !== 'Cliente' && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>Cargando...</td></tr>
            ) : filteredVentas.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No hay adopciones ni servicios registrados.</td></tr>
            ) : (
              filteredVentas.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.numero_venta}</strong></td>
                  <td>{new Date(v.fecha_hora).toLocaleDateString()}</td>
                  <td>{v.cliente_nombre}</td>
                  <td>{v.metodo_pago}</td>
                  <td><strong>${Number(v.total).toLocaleString('es-CO')}</strong></td>
                  <td>
                    <span className={`badge-status ${v.estado === 'Completada' ? 'status-activo' : v.estado === 'Cancelada' ? 'status-inactivo' : 'status-pendiente'}`}>
                      {v.estado}
                    </span>
                  </td>
                  {userRole !== 'Cliente' && (
                    <td className="action-buttons-cell">
                      {v.estado !== 'Cancelada' && (
                        <button className="btn-sm btn-delete" onClick={() => handleEstado(v.id, 'Cancelada')}>Anular</button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL NUEVA VENTA */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h3>Registrar Adopción / Servicio</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              
              {/* IZQUIERDA: CATÁLOGO */}
              <div>
                <h4>Catálogo</h4>
                <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
                  {catalogo.map(item => (
                    <div 
                      key={item.tipo_item + item.id} 
                      onClick={() => addToCart(item)}
                      title="Haz clic para agregar al carrito"
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '8px', 
                        padding: '0.8rem',
                        cursor: 'pointer',
                        backgroundColor: 'var(--bg-light, #fafafa)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div>
                        <strong>{item.nombre}</strong>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '4px' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--brand-color)' }}>{item.tipo_item}</span> • ${Number(item.precio).toLocaleString('es-CO')}
                          <span style={{ marginLeft: '10px', backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                            Stock: {item.tipo_item === 'Gato' ? 1 : item.stock}
                          </span>
                        </div>
                      </div>
                      <div style={{
                        background: 'var(--brand-color, #3d2314)', 
                        color: '#fff', 
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        fontWeight: 'bold',
                        fontSize: '1.2rem'
                      }}>
                        +
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DERECHA: CARRITO Y CHECKOUT */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h4>Carrito</h4>
                <div style={{ flex: 1, minHeight: '150px', maxHeight: '200px', overflowY: 'auto', border: '1px dashed var(--border-color)', padding: '0.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  {cart.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: '2rem' }}>Carrito vacío</p> : 
                    cart.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                        <div>{c.cantidad}x {c.nombre}</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span>${c.subtotal.toLocaleString('es-CO')}</span>
                          <button onClick={() => removeFromCart(i)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                        </div>
                      </div>
                    ))
                  }
                </div>

                <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
                    <strong>Total:</strong>
                    <strong>${cartTotal.toLocaleString('es-CO')}</strong>
                  </div>
                </div>

                <form onSubmit={handleCreateVenta} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(userRole === 'Administrador' || userRole === 'Empleado') && (
                    <div className="form-group">
                      <label>Cliente (Opcional)</label>
                      <select value={selectedCliente} onChange={(e) => setSelectedCliente(e.target.value)} className="form-input">
                        <option value="">-- Cliente General / Mostrador --</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido} - {c.numero_documento}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Método de Pago</label>
                    <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="form-input" required>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                      <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>

                  <button type="submit" className="btn-action-primary" style={{ width: '100%' }} disabled={isSubmitting || cart.length === 0}>
                    {isSubmitting ? 'Procesando...' : 'Confirmar Registro'}
                  </button>
                </form>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentasTab;
