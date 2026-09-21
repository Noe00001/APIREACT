/**
 * api.js — Cliente HTTP centralizado para el consumo de la API REST de FastAPI.
 * Café Cato / Café Salomé | Frontend React + Vite
 * Cumple Criterio 10: URL del backend por variable de entorno (import.meta.env.VITE_API_URL).
 */

const API_URL =
  import.meta.env?.VITE_API_URL ||
  globalThis.__CAFE_API_URL__ ||
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
