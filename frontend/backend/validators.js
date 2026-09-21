const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digitsPattern = /^\d+$/;

function validateUserInput(data, includePassword = true) {
  const fields = ['nombre', 'apellido', 'tipoDocumento', 'numeroDocumento', 'direccion', 'telefono', 'email'];
  if (includePassword) fields.push('password');
  if (fields.some((field) => !String(data[field] || '').trim())) return 'Todos los campos son obligatorios';
  if (String(data.nombre).trim().length > 50 || String(data.apellido).trim().length > 50) return 'Nombre o apellido demasiado largo';
  if (String(data.tipoDocumento).trim().length > 20 || String(data.direccion).trim().length > 120) return 'Tipo de documento o dirección demasiado largo';
  if (!digitsPattern.test(String(data.numeroDocumento)) || String(data.numeroDocumento).length < 6 || String(data.numeroDocumento).length > 12) return 'Número de documento inválido';
  if (!digitsPattern.test(String(data.telefono)) || String(data.telefono).length < 7 || String(data.telefono).length > 15) return 'Número telefónico inválido';
  if (!emailPattern.test(String(data.email)) || String(data.email).length > 100) return 'Correo inválido';
  if (includePassword && (String(data.password).length < 6 || String(data.password).length > 128)) return 'La contraseña debe tener entre 6 y 128 caracteres';
  return '';
}

function validateCatalogInput(data, allowEmptyPrice = false) {
  if (!String(data.nombre || '').trim() || String(data.nombre).length > 100) return 'El nombre es obligatorio y debe tener máximo 100 caracteres';
  if (data.descripcion && String(data.descripcion).length > 255) return 'La descripción debe tener máximo 255 caracteres';
  if (!allowEmptyPrice && (data.precio === undefined || data.precio === null || data.precio === '')) return 'El precio es obligatorio';
  if (data.precio !== undefined && data.precio !== null && data.precio !== '' && (!Number.isFinite(Number(data.precio)) || Number(data.precio) < 0)) return 'El precio debe ser un número positivo';
  return '';
}

module.exports = { validateUserInput, validateCatalogInput };
