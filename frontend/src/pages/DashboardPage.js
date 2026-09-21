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
} from '../services/api';
import AdminCatalogForm from '../components/AdminCatalogForm';
import UserModal from '../components/UserModal';
import CatalogItemModal from '../components/CatalogItemModal';

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
      ];

      if (userRole === 'Administrador') {
        requests.push(getUsers().then(setUsers));
      }

      await Promise.all(requests);
      window.dispatchEvent(new Event('catalog-updated'));
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
    <section className="page-section">
      <div className="page-card dashboard-page">
        <div className="dashboard-header-block">
          <div>
            <span className="eyebrow">Panel de control • {user.rol}</span>
            <h2>Bienvenido, {user.nombre} {user.apellido}</h2>
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

        {/* Search & Tabs */}
        <div className="dashboard-nav-bar">
          <div className="dashboard-tabs">
            {user.rol === 'Administrador' && (
              <button
                type="button"
                className={activeTab === 'usuarios' ? 'active-tab' : ''}
                onClick={() => { setActiveTab('usuarios'); setSearchTerm(''); }}
              >
                👥 Usuarios ({users.length})
              </button>
            )}
            <button
              type="button"
              className={activeTab === 'productos' ? 'active-tab' : ''}
              onClick={() => { setActiveTab('productos'); setSearchTerm(''); }}
            >
              ☕ Productos ({products.length})
            </button>
            <button
              type="button"
              className={activeTab === 'servicios' ? 'active-tab' : ''}
              onClick={() => { setActiveTab('servicios'); setSearchTerm(''); }}
            >
              🍰 Servicios ({services.length})
            </button>
            <button
              type="button"
              className={activeTab === 'gatos' ? 'active-tab' : ''}
              onClick={() => { setActiveTab('gatos'); setSearchTerm(''); }}
            >
              🐾 Gatos ({gatos.length})
            </button>
            {user.rol === 'Administrador' && (
              <button
                type="button"
                className={activeTab === 'catalogo' ? 'active-tab' : ''}
                onClick={() => { setActiveTab('catalogo'); setSearchTerm(''); }}
              >
                ⚙️ Gestión Rápida
              </button>
            )}
          </div>

          <div className="dashboard-search-wrap">
            <input
              type="text"
              placeholder={`Buscar en ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dashboard-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
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
                          <img src={item.imagen} alt={item.nombre} className="table-thumbnail" />
                        ) : (
                          <span className="no-thumbnail">☕</span>
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
                          <img src={item.imagen} alt={item.nombre} className="table-thumbnail" />
                        ) : (
                          <span className="no-thumbnail">🍰</span>
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
                          <img src={item.imagen} alt={item.nombre} className="table-thumbnail round" />
                        ) : (
                          <span className="no-thumbnail">🐾</span>
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
                <h4>☕ Productos ({products.length})</h4>
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
                <h4>🍰 Servicios ({services.length})</h4>
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
                <h4>🐾 Gatos ({gatos.length})</h4>
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
