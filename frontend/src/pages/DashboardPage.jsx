import { useEffect, useState } from 'react';
import {
  deleteProduct,
  deleteService,
  deleteGato,
  deleteUser,
  getAdminGatos,
  getAdminProducts,
  getAdminServices,
  getGatos,
  getProducts,
  getServices,
  getUsers,
  updateGatoStatus,
  updateProductStatus,
  updateServiceStatus,
  updateUserStatus,
  getReservas,
} from '../services/api';
import AdminCatalogForm from '../components/admin/AdminCatalogForm';
import UserModal from '../components/modals/UserModal';
import CatalogItemModal from '../components/modals/CatalogItemModal';
import AnalyticsTab from '../components/tabs/AnalyticsTab';
import VentasTab from '../components/tabs/VentasTab';
import FacturasTab from '../components/tabs/FacturasTab';
import PQRTab from '../components/tabs/PQRTab';
import ReservasTab from '../components/tabs/ReservasTab';
import { Users, Coffee, Sparkles, PawPrint, SlidersHorizontal, X, BarChart2, ShoppingCart, FileText, MessageSquare, Home, Calendar } from 'lucide-react';
import placeholderImage from '../assets/images/placeholder.svg';

const DashboardPage = () => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('cafe_salome_user') || 'null');
  } catch (error) {
    localStorage.removeItem('cafe_salome_user');
  }

  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [gatos, setGatos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [activeTab, setActiveTab] = useState(
    user?.rol === 'Administrador' ? 'usuarios' : 'productos'
  );
  const [message, setMessage] = useState('Cargando información...');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCatalogForm, setShowCatalogForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // User modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  // Catalog item modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemModalType, setItemModalType] = useState('producto');

  const userId = user?.id;
  const userRole = user?.rol;

  const refresh = async () => {
    try {
      const productRequest =
        userRole === 'Administrador' ? getAdminProducts() : getProducts();
      const serviceRequest =
        userRole === 'Administrador' ? getAdminServices() : getServices();
      const gatoRequest =
        userRole === 'Administrador' ? getAdminGatos() : getGatos();

      const requests = [
        productRequest.then(setProducts),
        serviceRequest.then(setServices),
        gatoRequest.then(setGatos),
        getReservas().then(setReservas),
      ];

      if (userRole === 'Administrador') {
        requests.push(getUsers().then(setUsers));
      }

      await Promise.all(requests);
      
      // Update local catalog
      window.dispatchEvent(new Event('catalog-updated'));
      
      // Trigger cross-tab update (for when admin panel and home are in different tabs)
      localStorage.setItem('last_catalog_update', Date.now().toString());
      
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Error al actualizar datos');
    }
  };

  useEffect(() => {
    if (!userId) return;
    refresh();
  }, [userId, userRole]);

  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // User handlers
  const handleOpenAddUser = () => {
    setUserToEdit(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (item) => {
    setUserToEdit(item);
    setIsUserModalOpen(true);
  };

  const toggleUser = async (item) => {
    try {
      const nextState = item.estado === 'Activo' ? 'Inactivo' : 'Activo';
      await updateUserStatus(item.id, nextState);
      showNotification(`Usuario ${item.nombre} ahora está ${nextState}.`);
      refresh();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const removeUser = async (id, nombre) => {
    if (!window.confirm(`¿Seguro que deseas eliminar al usuario "${nombre}"?`)) return;
    try {
      await deleteUser(id);
      showNotification(`Usuario "${nombre}" eliminado.`);
      refresh();
    } catch (err) {
      setMessage(err.message);
    }
  };

  // Catalog item handlers
  const handleOpenAddItem = (type) => {
    setItemToEdit(null);
    setItemModalType(type);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item, type) => {
    setItemToEdit(item);
    setItemModalType(type);
    setIsItemModalOpen(true);
  };

  const removeCatalogItem = async (item, type) => {
    if (!window.confirm(`¿Eliminar ${type} "${item.nombre}"?`)) return;
    try {
      const action =
        type === 'producto'
          ? deleteProduct
          : type === 'servicio'
          ? deleteService
          : deleteGato;
      await action(item.id);
      showNotification(`${type} "${item.nombre}" eliminado.`);
      refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const toggleCatalogItem = async (item, type) => {
    try {
      const nextState = item.estado === 'Activo' ? 'Inactivo' : 'Activo';
      const action =
        type === 'producto'
          ? updateProductStatus
          : type === 'servicio'
          ? updateServiceStatus
          : updateGatoStatus;
      await action(item.id, nextState);
      showNotification(`${item.nombre} ahora está ${nextState}.`);
      refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (!user) {
    return (
      <section className="page-section">
        <div className="page-card">
          <h2>Acceso restringido</h2>
          <p>Inicia sesión con tu cuenta para consultar tu panel administrativo.</p>
        </div>
      </section>
    );
  }

  // Filtered lists
  const filteredUsers = users.filter(
    (u) =>
      u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.rol?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = services.filter(
    (s) =>
      s.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGatos = gatos.filter(
    (g) =>
      g.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.raza?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.color?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="page-section" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0 }}>
      <div className="page-card dashboard-page" style={{ flex: 1, display: 'flex', flexDirection: 'row', padding: 0, overflow: 'hidden', margin: 0, maxWidth: '100%', borderRadius: 0 }}>
        {/* Sidebar */}
        <aside style={{ width: '250px', background: 'var(--card-bg)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '1rem', overflowY: 'auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <span className="eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Panel de control</span>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{user.nombre} {user.apellido}</h2>
            <span className={`badge-role role-${user.rol?.toLowerCase()}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>{user.rol}</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {user.rol === 'Administrador' && (
              <>
                <button
                  type="button"
                  className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('analytics'); setSearchTerm(''); }}
                  style={{ textAlign: 'left', padding: '0.75rem', borderRadius: '4px', background: activeTab === 'analytics' ? 'var(--brand-color)' : 'transparent', color: activeTab === 'analytics' ? '#fff' : 'inherit', border: 'none', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <BarChart2 size={18} /> Analítica
                </button>
                <button
                  type="button"
                  className={`sidebar-link ${activeTab === 'usuarios' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('usuarios'); setSearchTerm(''); }}
                  style={{ textAlign: 'left', padding: '0.75rem', borderRadius: '4px', background: activeTab === 'usuarios' ? 'var(--brand-color)' : 'transparent', color: activeTab === 'usuarios' ? '#fff' : 'inherit', border: 'none', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Users size={18} /> Usuarios ({users.length})
                </button>
              </>
            )}
            <button
              type="button"
              className={`sidebar-link ${activeTab === 'productos' ? 'active' : ''}`}
              onClick={() => { setActiveTab('productos'); setSearchTerm(''); }}
              style={{ textAlign: 'left', padding: '0.75rem', borderRadius: '4px', background: activeTab === 'productos' ? 'var(--brand-color)' : 'transparent', color: activeTab === 'productos' ? '#fff' : 'inherit', border: 'none', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Coffee size={18} /> Productos ({products.length})
            </button>
            <button
              type="button"
              className={`sidebar-link ${activeTab === 'servicios' ? 'active' : ''}`}
              onClick={() => { setActiveTab('servicios'); setSearchTerm(''); }}
              style={{ textAlign: 'left', padding: '0.75rem', borderRadius: '4px', background: activeTab === 'servicios' ? 'var(--brand-color)' : 'transparent', color: activeTab === 'servicios' ? '#fff' : 'inherit', border: 'none', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Sparkles size={18} /> Servicios ({services.length})
            </button>
            <button
              type="button"
              className={`sidebar-link ${activeTab === 'gatos' ? 'active' : ''}`}
              onClick={() => { setActiveTab('gatos'); setSearchTerm(''); }}
              style={{ textAlign: 'left', padding: '0.75rem', borderRadius: '4px', background: activeTab === 'gatos' ? 'var(--brand-color)' : 'transparent', color: activeTab === 'gatos' ? '#fff' : 'inherit', border: 'none', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <PawPrint size={18} /> Gatos ({gatos.length})
            </button>
            {user.rol === 'Administrador' && (
              <button
                type="button"
                className={`sidebar-link ${activeTab === 'catalogo' ? 'active' : ''}`}
                onClick={() => { setActiveTab('catalogo'); setSearchTerm(''); }}
                style={{ textAlign: 'left', padding: '0.75rem', borderRadius: '4px', background: activeTab === 'catalogo' ? 'var(--brand-color)' : 'transparent', color: activeTab === 'catalogo' ? '#fff' : 'inherit', border: 'none', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <SlidersHorizontal size={18} /> Gestión Rápida
              </button>
            )}
            <button
              type="button"
              className={`sidebar-link ${activeTab === 'ventas' ? 'active' : ''}`}
              onClick={() => { setActiveTab('ventas'); setSearchTerm(''); }}
              style={{ textAlign: 'left', padding: '0.75rem', borderRadius: '4px', background: activeTab === 'ventas' ? 'var(--brand-color)' : 'transparent', color: activeTab === 'ventas' ? '#fff' : 'inherit', border: 'none', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}
            >
              <ShoppingCart size={18} /> Adopciones y Servicios
            </button>
            <button
              type="button"
              className={`sidebar-link ${activeTab === 'facturas' ? 'active' : ''}`}
              onClick={() => { setActiveTab('facturas'); setSearchTerm(''); }}
              style={{ textAlign: 'left', padding: '0.75rem', borderRadius: '4px', background: activeTab === 'facturas' ? 'var(--brand-color)' : 'transparent', color: activeTab === 'facturas' ? '#fff' : 'inherit', border: 'none', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FileText size={18} /> Certificados y Comprobantes
            </button>
            <button
              type="button"
              className={`sidebar-link ${activeTab === 'pqr' ? 'active' : ''}`}
              onClick={() => { setActiveTab('pqr'); setSearchTerm(''); }}
              style={{ textAlign: 'left', padding: '0.75rem', borderRadius: '4px', background: activeTab === 'pqr' ? 'var(--brand-color)' : 'transparent', color: activeTab === 'pqr' ? '#fff' : 'inherit', border: 'none', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <MessageSquare size={18} /> Atención (PQR)
            </button>
            <button
              type="button"
              className={`sidebar-link ${activeTab === 'reservas' ? 'active' : ''}`}
              onClick={() => { setActiveTab('reservas'); setSearchTerm(''); }}
              style={{ textAlign: 'left', padding: '0.75rem', borderRadius: '4px', background: activeTab === 'reservas' ? 'var(--brand-color)' : 'transparent', color: activeTab === 'reservas' ? '#fff' : 'inherit', border: 'none', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Calendar size={18} /> Reservas y Mensajes
            </button>
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <a
                href="/"
                className="sidebar-link"
                style={{ textAlign: 'left', padding: '0.75rem', borderRadius: '4px', background: 'transparent', color: 'inherit', border: 'none', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <Home size={18} /> Volver al Inicio
              </a>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          <div className="dashboard-header-block" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="eyebrow">Panel de control • {user.rol}</span>
              <h2>Catálogo y Gestión</h2>
              <p>
                {user.rol === 'Administrador'
                  ? 'Control integral de usuarios, catálogo de cafetería, servicios y adopciones felinas.'
                  : 'Gestión y consulta de catálogo y operaciones de Café Salome.'}
              </p>
            </div>

          <div className="dashboard-stats-row">
            <div className="dashboard-stat-card">
              <span className="stat-value">{products.filter((p) => p.estado === 'Activo').length}</span>
              <span className="stat-label">Productos Activos</span>
            </div>
            <div className="dashboard-stat-card">
              <span className="stat-value">{services.filter((s) => s.estado === 'Activo').length}</span>
              <span className="stat-label">Servicios Activos</span>
            </div>
            <div className="dashboard-stat-card">
              <span className="stat-value">{reservas.filter((r) => r.estado === 'Pendiente').length}</span>
              <span className="stat-label">Reservas Pendientes</span>
            </div>
            <div className="dashboard-stat-card">
              <span className="stat-value">{gatos.filter((g) => g.estado === 'Activo').length}</span>
              <span className="stat-label">Gatos en Adopción</span>
            </div>
            {user.rol === 'Administrador' && (
              <div className="dashboard-stat-card">
                <span className="stat-value">{users.length}</span>
                <span className="stat-label">Usuarios Totales</span>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        {successMessage && <div className="dashboard-toast success">{successMessage}</div>}
        {message && <div className="dashboard-toast error">{message}</div>}

          {/* Search Bar */}
          <div className="dashboard-search-wrap" style={{ display: 'flex', marginBottom: '2rem' }}>
            <input
              type="text"
              placeholder={`Buscar en ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dashboard-search-input"
              style={{ flex: 1 }}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                <X size={16} />
              </button>
            )}
          </div>

        {/* Quick add toggle for Admin */}
        {user.rol === 'Administrador' && (
          <div className="catalog-admin-area">
            <button
              type="button"
              className="catalog-add-button"
              onClick={() => setShowCatalogForm((curr) => !curr)}
            >
              {showCatalogForm ? '▲ Ocultar creador rápido' : '＋ Creador rápido de catálogo'}
            </button>
            {showCatalogForm && (
              <AdminCatalogForm
                onSaved={() => {
                  refresh();
                  showNotification('Elemento guardado con éxito');
                }}
              />
            )}
          </div>
        )}

        {/* NUEVOS TABS: ANALYTICS, VENTAS, FACTURAS, PQR */}
        {activeTab === 'analytics' && <AnalyticsTab userRole={user.rol} />}
        {activeTab === 'ventas' && <VentasTab userRole={user.rol} userId={user.id} searchTerm={searchTerm} />}
        {activeTab === 'facturas' && <FacturasTab userRole={user.rol} searchTerm={searchTerm} />}
        {activeTab === 'pqr' && <PQRTab userRole={user.rol} userId={user.id} searchTerm={searchTerm} />}
        {activeTab === 'reservas' && <ReservasTab userRole={user.rol} searchTerm={searchTerm} />}

        {/* Tab: USUARIOS */}
        {activeTab === 'usuarios' && user.rol === 'Administrador' && (
          <div className="dashboard-table-wrap">
            <div className="dashboard-heading">
              <div>
                <h3>Usuarios Registrados</h3>
                <span className="table-subtitle">Lista de cuentas, roles y estados</span>
              </div>
              <button type="button" className="btn-action-primary" onClick={handleOpenAddUser}>
                ＋ Nuevo Usuario
              </button>
            </div>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Documento</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.nombre} {item.apellido}</strong>
                      </td>
                      <td>{item.email}</td>
                      <td>{item.tipoDocumento} {item.numeroDocumento}</td>
                      <td>{item.telefono || '-'}</td>
                      <td>
                        <span className={`badge-role role-${item.rol?.toLowerCase()}`}>
                          {item.rol}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status status-${item.estado?.toLowerCase()}`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="action-buttons-cell">
                        <button
                          type="button"
                          className="btn-sm btn-edit"
                          onClick={() => handleOpenEditUser(item)}
                          title="Editar usuario"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-sm btn-toggle"
                          onClick={() => toggleUser(item)}
                          title={item.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        >
                          {item.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        {item.id !== user.id && (
                          <button
                            type="button"
                            className="btn-sm btn-delete"
                            onClick={() => removeUser(item.id, `${item.nombre} ${item.apellido}`)}
                            title="Eliminar usuario"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: PRODUCTOS */}
        {activeTab === 'productos' && (
          <div className="dashboard-table-wrap">
            <div className="dashboard-heading">
              <div>
                <h3>Carta de Productos</h3>
                <span className="table-subtitle">Bebidas calientes, frías y especialidades</span>
              </div>
              {user.rol === 'Administrador' && (
                <button
                  type="button"
                  className="btn-action-primary"
                  onClick={() => handleOpenAddItem('producto')}
                >
                  ＋ Nuevo Producto
                </button>
              )}
            </div>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  {user.rol === 'Administrador' && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      No hay productos que coincidan.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((item) => (
                    <tr key={item.id}>
                      <td className="thumbnail-cell">
                        {item.imagen ? (
                          <img
                            src={item.imagen}
                            alt={item.nombre}
                            className="table-thumbnail"
                            onError={(e) => {
                              e.currentTarget.src = placeholderImage;
                              e.currentTarget.onerror = null;
                            }}
                          />
                        ) : (
                          <span className="no-thumbnail"><Coffee size={20} /></span>
                        )}
                      </td>
                      <td><strong>{item.nombre}</strong></td>
                      <td className="desc-cell">{item.descripcion || '-'}</td>
                      <td><strong>${Number(item.precio).toLocaleString('es-CO')}</strong></td>
                      <td>
                        <span className={`badge-status status-${item.estado?.toLowerCase()}`}>
                          {item.estado}
                        </span>
                      </td>
                      {user.rol === 'Administrador' && (
                        <td className="action-buttons-cell">
                          <button
                            type="button"
                            className="btn-sm btn-edit"
                            onClick={() => handleOpenEditItem(item, 'producto')}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn-sm btn-toggle"
                            onClick={() => toggleCatalogItem(item, 'producto')}
                          >
                            {item.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            type="button"
                            className="btn-sm btn-delete"
                            onClick={() => removeCatalogItem(item, 'producto')}
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: SERVICIOS */}
        {activeTab === 'servicios' && (
          <div className="dashboard-table-wrap">
            <div className="dashboard-heading">
              <div>
                <h3>Servicios y Repostería</h3>
                <span className="table-subtitle">Postres, reservas y experiencias</span>
              </div>
              {user.rol === 'Administrador' && (
                <button
                  type="button"
                  className="btn-action-primary"
                  onClick={() => handleOpenAddItem('servicio')}
                >
                  ＋ Nuevo Servicio
                </button>
              )}
            </div>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  {user.rol === 'Administrador' && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      No hay servicios que coincidan.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((item) => (
                    <tr key={item.id}>
                      <td className="thumbnail-cell">
                        {item.imagen ? (
                          <img
                            src={item.imagen}
                            alt={item.nombre}
                            className="table-thumbnail"
                            onError={(e) => {
                              e.currentTarget.src = placeholderImage;
                              e.currentTarget.onerror = null;
                            }}
                          />
                        ) : (
                          <span className="no-thumbnail"><Sparkles size={20} /></span>
                        )}
                      </td>
                      <td><strong>{item.nombre}</strong></td>
                      <td className="desc-cell">{item.descripcion || '-'}</td>
                      <td>
                        {item.precio ? `$${Number(item.precio).toLocaleString('es-CO')}` : 'A consultar'}
                      </td>
                      <td>
                        <span className={`badge-status status-${item.estado?.toLowerCase()}`}>
                          {item.estado}
                        </span>
                      </td>
                      {user.rol === 'Administrador' && (
                        <td className="action-buttons-cell">
                          <button
                            type="button"
                            className="btn-sm btn-edit"
                            onClick={() => handleOpenEditItem(item, 'servicio')}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn-sm btn-toggle"
                            onClick={() => toggleCatalogItem(item, 'servicio')}
                          >
                            {item.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            type="button"
                            className="btn-sm btn-delete"
                            onClick={() => removeCatalogItem(item, 'servicio')}
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: GATOS */}
        {activeTab === 'gatos' && (
          <div className="dashboard-table-wrap">
            <div className="dashboard-heading">
              <div>
                <h3>Gatos en Adopción</h3>
                <span className="table-subtitle">Compañeros felinos rescatados</span>
              </div>
              {user.rol === 'Administrador' && (
                <button
                  type="button"
                  className="btn-action-primary"
                  onClick={() => handleOpenAddItem('gato')}
                >
                  ＋ Nuevo Gato
                </button>
              )}
            </div>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Nombre</th>
                  <th>Edad</th>
                  <th>Raza / Color</th>
                  <th>Sexo</th>
                  <th>Salud</th>
                  <th>Estado</th>
                  {user.rol === 'Administrador' && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredGatos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      No hay gatos que coincidan.
                    </td>
                  </tr>
                ) : (
                  filteredGatos.map((item) => (
                    <tr key={item.id}>
                      <td className="thumbnail-cell">
                        {item.imagen ? (
                          <img
                            src={item.imagen}
                            alt={item.nombre}
                            className="table-thumbnail round"
                            onError={(e) => {
                              e.currentTarget.src = placeholderImage;
                              e.currentTarget.onerror = null;
                            }}
                          />
                        ) : (
                          <span className="no-thumbnail"><PawPrint size={20} /></span>
                        )}
                      </td>
                      <td><strong>{item.nombre}</strong></td>
                      <td>{item.edad} {item.edad === 1 ? 'año' : 'años'}</td>
                      <td>{item.raza || 'Mestizo'} {item.color ? `• ${item.color}` : ''}</td>
                      <td>{item.sexo}</td>
                      <td>
                        <div className="health-badges">
                          {item.esterilizado && <span className="mini-badge">Esterilizado</span>}
                          {item.vacunado && <span className="mini-badge">Vacunado</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`badge-status status-${item.estado?.toLowerCase()}`}>
                          {item.estado === 'Activo' ? 'Disponible' : 'Adoptado'}
                        </span>
                      </td>
                      {user.rol === 'Administrador' && (
                        <td className="action-buttons-cell">
                          <button
                            type="button"
                            className="btn-sm btn-edit"
                            onClick={() => handleOpenEditItem(item, 'gato')}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn-sm btn-toggle"
                            onClick={() => toggleCatalogItem(item, 'gato')}
                          >
                            {item.estado === 'Activo' ? 'Marcar Adoptado' : 'Habilitar'}
                          </button>
                          <button
                            type="button"
                            className="btn-sm btn-delete"
                            onClick={() => removeCatalogItem(item, 'gato')}
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: GESTION RAPIDA (ADMIN) */}
        {activeTab === 'catalogo' && user.rol === 'Administrador' && (
          <div className="catalog-management">
            <div className="dashboard-heading">
              <div>
                <span className="section-label">Supervisión</span>
                <h3>Gestión Rápida de Publicación</h3>
              </div>
              <span>{products.length + services.length + gatos.length} registros en total</span>
            </div>
            <p>Activa o desactiva rápidamente los ítems visibles en la página principal.</p>

            <div className="catalog-management-grid">
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Coffee size={18} /> Productos ({products.length})</h4>
                {products.map((item) => (
                  <div className="catalog-management-item" key={`quick-p-${item.id}`}>
                    <span>
                      {item.nombre} <small>({item.estado})</small>
                    </span>
                    <div>
                      <button type="button" onClick={() => toggleCatalogItem(item, 'producto')}>
                        {item.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Sparkles size={18} /> Servicios ({services.length})</h4>
                {services.map((item) => (
                  <div className="catalog-management-item" key={`quick-s-${item.id}`}>
                    <span>
                      {item.nombre} <small>({item.estado})</small>
                    </span>
                    <div>
                      <button type="button" onClick={() => toggleCatalogItem(item, 'servicio')}>
                        {item.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PawPrint size={18} /> Gatos ({gatos.length})</h4>
                {gatos.map((item) => (
                  <div className="catalog-management-item" key={`quick-g-${item.id}`}>
                    <span>
                      {item.nombre} <small>({item.estado === 'Activo' ? 'Disponible' : 'Adoptado'})</small>
                    </span>
                    <div>
                      <button type="button" onClick={() => toggleCatalogItem(item, 'gato')}>
                        {item.estado === 'Activo' ? 'Marcar Adoptado' : 'Habilitar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </main>
      </div>

      {/* MODALS */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSaved={() => {
          refresh();
          showNotification(userToEdit ? 'Usuario actualizado con éxito' : 'Usuario creado con éxito');
        }}
        userToEdit={userToEdit}
      />

      <CatalogItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSaved={() => {
          refresh();
          showNotification(itemToEdit ? 'Cambios guardados con éxito' : 'Elemento creado con éxito');
        }}
        item={itemToEdit}
        type={itemModalType}
      />
    </section>
  );
};

export default DashboardPage;
