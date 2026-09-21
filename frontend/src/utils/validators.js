const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digitsRe = /^\d+$/;

export function validateEmail(value) {
  if (!value) return 'El correo es requerido';
  if (!emailRe.test(value)) return 'Correo inválido';
  if (value.length > 100) return 'Correo demasiado largo';
  return '';
}

export function validatePassword(value) {
  if (!value) return 'La contraseña es requerida';
  if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
  if (value.length > 128) return 'La contraseña es demasiado larga';
  return '';
}

export function validateName(value) {
  if (!value) return 'Requerido';
  if (value.length < 2) return 'Muy corto';
  if (value.length > 50) return 'Muy largo';
  return '';
}

export function validateDocumentNumber(value) {
  if (!value) return 'Número de documento requerido';
  if (!digitsRe.test(value)) return 'Solo dígitos';
  if (value.length < 6 || value.length > 12) return 'Número inválido';
  return '';
}

export function validatePhone(value) {
  if (!value) return 'Teléfono requerido';
  if (!digitsRe.test(value)) return 'Solo dígitos';
  if (value.length < 7 || value.length > 15) return 'Número telefónico inválido';
  return '';
}

export function validateConfirmPassword(password, confirm) {
  if (!confirm) return 'Confirmación requerida';
  if (password !== confirm) return 'Las contraseñas no coinciden';
  return '';
}

const validators = {
  validateEmail,
  validatePassword,
  validateName,
  validateDocumentNumber,
  validatePhone,
  validateConfirmPassword,
};

export default validators;
