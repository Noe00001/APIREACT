const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const { requireAuth, requireRole } = require('./middleware/auth');
const { validateUserInput, validateCatalogInput } = require('./validators');
require('dotenv').config();

const app = express();
const port = Number(process.env.PORT || 5000);
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === clientUrl || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido por CORS'));
  },
}));
app.use(express.json({ limit: '5mb' }));

const publicUserFields = `u.id, u.nombre, u.apellido, u.tipo_documento AS tipoDocumento,
  u.numero_documento AS numeroDocumento, u.direccion, u.telefono, u.email,
  u.estado, r.nombre AS rol`;

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email, rol: user.rol }, process.env.JWT_SECRET || 'cambia-esta-clave', { expiresIn: '2h' });
}

function validateImage(image) {
  if (!image) return '';
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,/.test(image)) return 'La imagen debe ser JPG, PNG o WebP';
  if (image.length > 5 * 1024 * 1024) return 'La imagen no puede superar 5 MB';
  return '';
}

function databaseUnavailable(error) {
  return error && ['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ECONNRESET'].includes(error.code);
}

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'Café Salome API' }));

app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, apellido, tipoDocumento, numeroDocumento, direccion, telefono, email, password } = req.body;
    const validationError = validateUserInput(req.body);
    if (validationError) return res.status(400).json({ message: validationError });
    const normalizedEmail = email.trim().toLowerCase();
    const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ? OR numero_documento = ?', [normalizedEmail, numeroDocumento]);
    if (existing.length) return res.status(409).json({ message: 'El correo o documento ya está registrado' });
    const [roles] = await pool.query("SELECT id FROM roles WHERE nombre = 'Cliente'");
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query(`INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password_hash, rol_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [nombre.trim(), apellido.trim(), tipoDocumento.trim(), numeroDocumento, direccion.trim(), telefono, normalizedEmail, passwordHash, roles[0].id]);
    return res.status(201).json({ message: 'Registro exitoso' });
  } catch (error) {
    console.error('Error en /api/auth/register:', error.message);
    if (databaseUnavailable(error)) return res.status(503).json({ message: 'MySQL no está disponible. Abre XAMPP e inicia MySQL.' });
    return res.status(500).json({ message: 'Error al registrar el usuario' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Correo y contraseña son obligatorios' });
    const [rows] = await pool.query(`SELECT u.id, u.email, u.password_hash, u.estado, r.nombre AS rol, u.nombre, u.apellido
      FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.email = ? LIMIT 1`, [email.trim().toLowerCase()]);
        const user = rows[0];
        const passwordMatches = user && typeof user.password_hash === 'string'
          ? await bcrypt.compare(password, user.password_hash)
          : false;
        if (!user || user.estado !== 'Activo' || !passwordMatches) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }
    return res.json({ token: createToken(user), user: { id: user.id, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol } });
  } catch (error) {
    console.error('Error en /api/auth/login:', error.message);
    if (databaseUnavailable(error)) return res.status(503).json({ message: 'MySQL no está disponible. Abre XAMPP e inicia MySQL.' });
    return res.status(500).json({ message: process.env.NODE_ENV === 'development' ? error.message : 'Error al iniciar sesión' });
  }
});

app.post('/api/auth/recover', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'El correo es obligatorio' });
    const normalizedEmail = email.trim().toLowerCase();
    const [rows] = await pool.query('SELECT id FROM usuarios WHERE email = ? AND estado = \'Activo\' LIMIT 1', [normalizedEmail]);
    if (!rows.length) return res.status(404).json({ message: 'No existe un usuario con ese correo' });
    const resetToken = jwt.sign({ id: rows[0].id, purpose: 'password-reset' }, process.env.JWT_SECRET || 'cambia-esta-clave', { expiresIn: '15m' });
    return res.json({ message: 'Solicitud válida. Define una nueva contraseña.', resetToken });
  } catch (error) {
    console.error('Error en /api/auth/recover:', error.message);
    if (databaseUnavailable(error)) return res.status(503).json({ message: 'MySQL no está disponible. Abre XAMPP e inicia MySQL.' });
    return res.status(500).json({ message: 'Error al procesar la recuperación' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6 || password.length > 128) {
      return res.status(400).json({ message: 'Token y contraseña de 6 a 128 caracteres son obligatorios' });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'cambia-esta-clave');
    if (payload.purpose !== 'password-reset') return res.status(401).json({ message: 'Token de recuperación inválido' });
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.query("UPDATE usuarios SET password_hash = ?, estado = 'Activo' WHERE id = ?", [passwordHash, payload.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Usuario no encontrado' });
    return res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  } catch (error) {
    return res.status(401).json({ message: 'El enlace de recuperación expiró o no es válido' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query(`SELECT ${publicUserFields} FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.id = ?`, [req.user.id]);
  return rows[0] ? res.json({ user: rows[0] }) : res.status(404).json({ message: 'Usuario no encontrado' });
});

app.get('/api/users', requireAuth, requireRole('Administrador'), async (req, res) => {
  const [rows] = await pool.query(`SELECT ${publicUserFields} FROM usuarios u JOIN roles r ON r.id = u.rol_id ORDER BY u.creado_en DESC`);
  return res.json(rows);
});

app.post('/api/users', requireAuth, requireRole('Administrador'), async (req, res) => {
  try {
    const { nombre, apellido, tipoDocumento, numeroDocumento, direccion, telefono, email, password, rol = 'Empleado' } = req.body;
    const validationError = validateUserInput(req.body);
    if (validationError) return res.status(400).json({ message: validationError });
    if (!['Administrador', 'Empleado', 'Cliente'].includes(rol)) return res.status(400).json({ message: 'Rol inválido' });
    const [roles] = await pool.query('SELECT id FROM roles WHERE nombre = ?', [rol]);
    const normalizedEmail = email.trim().toLowerCase();
    const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ? OR numero_documento = ?', [normalizedEmail, numeroDocumento]);
    if (existing.length) return res.status(409).json({ message: 'El correo o documento ya está registrado' });
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query(`INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, email, password_hash, rol_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [nombre.trim(), apellido.trim(), tipoDocumento.trim(), numeroDocumento, direccion.trim(), telefono, normalizedEmail, passwordHash, roles[0].id]);
    return res.status(201).json({ message: 'Usuario creado' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear el usuario' });
  }
});

app.put('/api/users/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const { nombre, apellido, direccion, telefono, email, rol, estado } = req.body;
  const [roles] = await pool.query('SELECT id FROM roles WHERE nombre = ?', [rol]);
  if (!roles.length) return res.status(400).json({ message: 'Rol inválido' });
  await pool.query(`UPDATE usuarios SET nombre = ?, apellido = ?, direccion = ?, telefono = ?, email = ?, rol_id = ?, estado = ? WHERE id = ?`,
    [nombre, apellido, direccion, telefono, email, roles[0].id, estado === 'Inactivo' ? 'Inactivo' : 'Activo', req.params.id]);
  return res.json({ message: 'Usuario actualizado' });
});

app.delete('/api/users/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  await pool.query("UPDATE usuarios SET estado = 'Inactivo' WHERE id = ?", [req.params.id]);
  return res.json({ message: 'Usuario desactivado' });
});

app.patch('/api/users/:id/status', requireAuth, requireRole('Administrador'), async (req, res) => {
  const estado = req.body.estado === 'Activo' ? 'Activo' : 'Inactivo';
  await pool.query('UPDATE usuarios SET estado = ? WHERE id = ?', [estado, req.params.id]);
  return res.json({ message: 'Estado actualizado' });
});

app.get('/api/products', async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM productos WHERE estado = 'Activo' ORDER BY creado_en DESC");
  return res.json(rows);
});

app.get('/api/products/admin', requireAuth, requireRole('Administrador'), async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM productos ORDER BY creado_en DESC');
  return res.json(rows);
});

app.post('/api/products', requireAuth, requireRole('Administrador'), async (req, res) => {
  const { nombre, descripcion, precio, imagen } = req.body;
  const validationError = validateCatalogInput(req.body);
  if (validationError) return res.status(400).json({ message: validationError });
  const imageError = validateImage(imagen);
  if (imageError) return res.status(400).json({ message: imageError });
  const [result] = await pool.query('INSERT INTO productos (nombre, descripcion, precio, imagen) VALUES (?, ?, ?, ?)', [nombre, descripcion || null, precio, imagen || null]);
  return res.status(201).json({ id: result.insertId, message: 'Producto creado' });
});

app.put('/api/products/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const { nombre, descripcion, precio, imagen, estado } = req.body;
  const validationError = validateCatalogInput(req.body);
  if (validationError) return res.status(400).json({ message: validationError });
  const imageError = validateImage(imagen);
  if (imageError) return res.status(400).json({ message: imageError });
  await pool.query('UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, imagen = ?, estado = ? WHERE id = ?', [nombre, descripcion || null, precio, imagen || null, estado === 'Inactivo' ? 'Inactivo' : 'Activo', req.params.id]);
  return res.json({ message: 'Producto actualizado' });
});

app.delete('/api/products/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  await pool.query("UPDATE productos SET estado = 'Inactivo' WHERE id = ?", [req.params.id]);
  return res.json({ message: 'Producto eliminado' });
});

app.patch('/api/products/:id/status', requireAuth, requireRole('Administrador'), async (req, res) => {
  const estado = req.body.estado === 'Activo' ? 'Activo' : 'Inactivo';
  await pool.query('UPDATE productos SET estado = ? WHERE id = ?', [estado, req.params.id]);
  return res.json({ message: 'Estado del producto actualizado' });
});

app.get('/api/services', async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM servicios WHERE estado = 'Activo' ORDER BY id DESC");
  return res.json(rows);
});

app.get('/api/services/admin', requireAuth, requireRole('Administrador'), async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM servicios ORDER BY id DESC');
  return res.json(rows);
});

app.post('/api/services', requireAuth, requireRole('Administrador'), async (req, res) => {
  const { nombre, descripcion, precio, imagen } = req.body;
  const validationError = validateCatalogInput(req.body, true);
  if (validationError) return res.status(400).json({ message: validationError });
  const imageError = validateImage(imagen);
  if (imageError) return res.status(400).json({ message: imageError });
  const [result] = await pool.query('INSERT INTO servicios (nombre, descripcion, precio, imagen) VALUES (?, ?, ?, ?)', [nombre, descripcion || null, precio || null, imagen || null]);
  return res.status(201).json({ id: result.insertId, message: 'Servicio creado' });
});

app.put('/api/services/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const { nombre, descripcion, precio, imagen, estado } = req.body;
  const validationError = validateCatalogInput(req.body, true);
  if (validationError) return res.status(400).json({ message: validationError });
  const imageError = validateImage(imagen);
  if (imageError) return res.status(400).json({ message: imageError });
  await pool.query('UPDATE servicios SET nombre = ?, descripcion = ?, precio = ?, imagen = ?, estado = ? WHERE id = ?', [nombre, descripcion || null, precio || null, imagen || null, estado === 'Inactivo' ? 'Inactivo' : 'Activo', req.params.id]);
  return res.json({ message: 'Servicio actualizado' });
});

app.delete('/api/services/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  await pool.query("UPDATE servicios SET estado = 'Inactivo' WHERE id = ?", [req.params.id]);
  return res.json({ message: 'Servicio eliminado' });
});

app.patch('/api/services/:id/status', requireAuth, requireRole('Administrador'), async (req, res) => {
  const estado = req.body.estado === 'Activo' ? 'Activo' : 'Inactivo';
  await pool.query('UPDATE servicios SET estado = ? WHERE id = ?', [estado, req.params.id]);
  return res.json({ message: 'Estado del servicio actualizado' });
});

app.use((error, req, res, next) => {
  console.error('Error no controlado:', error.message);
  const message = process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor';
  return res.status(500).json({ message });
});

app.listen(port, () => console.log(`API Café Salome ejecutándose en http://localhost:${port}`));
