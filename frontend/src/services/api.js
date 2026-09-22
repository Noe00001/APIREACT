/**
 * api.js — Cliente HTTP centralizado para el consumo de la API REST de FastAPI.
 * Café Cato / Café Salomé | Frontend React + Vite
 * Cumple Criterio 10: URL del backend por variable de entorno (import.meta.env.VITE_API_URL).
 */

let viteEnvUrl = '';
try {
  // Safe evaluation to support both Vite ESM and Jest/Babel CommonJS
  // eslint-disable-next-line no-new-func
  viteEnvUrl = new Function('try { return import.meta.env?.VITE_API_URL; } catch(e) { return ""; }')();
} catch (e) {
  viteEnvUrl = '';
}

const API_URL =
  viteEnvUrl ||
  (typeof globalThis !== 'undefined' && globalThis.__CAFE_API_URL__) ||
  (typeof process !== 'undefined' && process.env && (process.env.VITE_API_URL || process.env.REACT_APP_API_URL)) ||
  'http://localhost:8000/api';

/**
 * Función base para todas las peticiones HTTP.
 * Adjunta el token JWT desde localStorage/sessionStorage si existe.
 */
async function request(path, options = {}) {
  const token =
    localStorage.getItem('cafe_salome_token') ||
    sessionStorage.getItem('cafe_salome_token');

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      cache: 'no-store',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    throw new Error(
      `No se pudo conectar con el backend en ${API_URL}. Verifica que el servidor FastAPI esté corriendo en el puerto 8000.`
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Si viene error de validación 422 con array de errores
    if (Array.isArray(data.detail)) {
      const msg = data.detail.map((e) => `${e.campo || ''}: ${e.mensaje || e.msg}`).join(', ');
      throw new Error(msg || data.message || 'Error de validación en el formulario');
    }
    const msg = data.detail || data.message || 'No fue posible completar la solicitud';
    throw new Error(msg);
  }
  return data;
}

// ─── 1. Autenticación ────────────────────────────────────────────────────────────
export const registerUser = (payload) =>
  request('/usuarios/registro', { method: 'POST', body: JSON.stringify(payload) });

export const loginUser = (payload) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });

export const recoverPassword = (payload) =>
  request('/auth/recover', { method: 'POST', body: JSON.stringify(payload) });

export const resetPassword = (payload) =>
  request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) });

export const getCurrentUser = () => request('/auth/me');

// ─── 2. Usuarios (Admin) ─────────────────────────────────────────────────────────
export const getUsers = (search = '') =>
  request(`/usuarios${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const getUserById = (id) => request(`/usuarios/${id}`);

export const createUser = (payload) =>
  request('/usuarios', { method: 'POST', body: JSON.stringify(payload) });

export const updateUser = (id, payload) =>
  request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const updateUserStatus = (id, estado) =>
  request(`/usuarios/${id}/status`, { method: 'PATCH', body: JSON.stringify({ estado }) });

export const deleteUser = (id) =>
  request(`/usuarios/${id}`, { method: 'DELETE' });

// ─── 3. Productos ────────────────────────────────────────────────────────────────
export const getProducts = (search = '') =>
  request(`/productos${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const getAdminProducts = () => request('/productos/admin');

export const getProductById = (id) => request(`/productos/${id}`);

export const createProduct = (payload) =>
  request('/productos', { method: 'POST', body: JSON.stringify(payload) });

export const updateProduct = (id, payload) =>
  request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const updateProductStatus = (id, estado) =>
  request(`/productos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ estado }) });

export const deleteProduct = (id) =>
  request(`/productos/${id}`, { method: 'DELETE' });

// ─── 4. Servicios ────────────────────────────────────────────────────────────────
export const getServices = (search = '') =>
  request(`/servicios${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const getAdminServices = () => request('/servicios/admin');

export const getServiceById = (id) => request(`/servicios/${id}`);

export const createService = (payload) =>
  request('/servicios', { method: 'POST', body: JSON.stringify(payload) });

export const updateService = (id, payload) =>
  request(`/servicios/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const updateServiceStatus = (id, estado) =>
  request(`/servicios/${id}/status`, { method: 'PATCH', body: JSON.stringify({ estado }) });

export const deleteService = (id) =>
  request(`/servicios/${id}`, { method: 'DELETE' });

// ─── 5. Gatos en Adopción ────────────────────────────────────────────────────────
export const getGatos = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.sexo) params.append('sexo', filters.sexo);
  if (filters.esterilizado !== undefined) params.append('esterilizado', filters.esterilizado);
  if (filters.search) params.append('search', filters.search);
  const qs = params.toString();
  return request(`/gatos${qs ? `?${qs}` : ''}`);
};

export const getAdminGatos = () => request('/gatos/admin');

export const getGatoById = (id) => request(`/gatos/${id}`);

export const createGato = (payload) =>
  request('/gatos', { method: 'POST', body: JSON.stringify(payload) });

export const updateGato = (id, payload) =>
  request(`/gatos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const updateGatoStatus = (id, estado) =>
  request(`/gatos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ estado }) });

export const deleteGato = (id) =>
  request(`/gatos/${id}`, { method: 'DELETE' });

// ─── 6. Inteligencia Artificial (Criterio 7) ─────────────────────────────────────
export const getAiRecommendation = (payload) =>
  request('/ia/recomendar', { method: 'POST', body: JSON.stringify(payload) });

// ─── 7. Ventas ───────────────────────────────────────────────────────────────────
export const getVentas = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
  if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
  if (filters.cliente_id) params.append('cliente_id', filters.cliente_id);
  if (filters.estado) params.append('estado', filters.estado);
  if (filters.search) params.append('search', filters.search);
  const qs = params.toString();
  return request(`/ventas${qs ? `?${qs}` : ''}`);
};

export const getVentaById = (id) => request(`/ventas/${id}`);

export const createVenta = (payload) =>
  request('/ventas/', { method: 'POST', body: JSON.stringify(payload) });

export const updateVentaStatus = (id, nuevo_estado) =>
  request(`/ventas/${id}/estado?nuevo_estado=${nuevo_estado}`, { method: 'PATCH' });

// ─── 8. Facturas ─────────────────────────────────────────────────────────────────
export const getFacturas = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  const qs = params.toString();
  return request(`/facturas${qs ? `?${qs}` : ''}`);
};

export const getFacturaById = (id) => request(`/facturas/${id}`);

// Nota: La descarga de PDF y Excel a menudo es mejor hacerla construyendo la URL directamente y usando window.open() 
// o un <a> tag, ya que `request` espera JSON y el archivo es un Blob. Exponemos la URL base aquí:
export const getBaseApiUrl = () => API_URL;

// ─── 9. Reportes ─────────────────────────────────────────────────────────────────
export const downloadFile = async (path, filename) => {
  const token = localStorage.getItem('cafe_salome_token') || sessionStorage.getItem('cafe_salome_token');
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al descargar el archivo');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// Rutas de reporte: /reportes/diario/pdf, /reportes/diario/excel, /reportes/factura/{id}/pdf

// ─── 10. PQR (Peticiones, Quejas y Reclamos) ─────────────────────────────────────
export const getPqrs = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.estado) params.append('estado', filters.estado);
  if (filters.tipo) params.append('tipo', filters.tipo);
  const qs = params.toString();
  return request(`/pqr${qs ? `?${qs}` : ''}`);
};

export const createPqr = (payload) =>
  request('/pqr/', { method: 'POST', body: JSON.stringify(payload) });

export const updatePqrStatus = (id, payload) =>
  request(`/pqr/${id}/respuesta`, { method: 'PATCH', body: JSON.stringify(payload) });

// ─── 11. Dashboards y Analítica ──────────────────────────────────────────────────
export const getDashboardMetrics = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
  if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
  if (filters.cliente_id) params.append('cliente_id', filters.cliente_id);
  if (filters.producto_id) params.append('producto_id', filters.producto_id);
  if (filters.servicio_id) params.append('servicio_id', filters.servicio_id);
  if (filters.estado) params.append('estado', filters.estado);
  const qs = params.toString();
  return request(`/analytics/dashboard${qs ? `?${qs}` : ''}`);
};

// ─── 12. Chatbot ─────────────────────────────────────────────────────────────────
export const startChatSession = () =>
  request('/chatbot/iniciar', { method: 'POST' });

export const sendChatMessage = (payload) =>
  request('/chatbot/chat', { method: 'POST', body: JSON.stringify(payload) });
