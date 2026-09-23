import { useState } from 'react';
import { createGato, createProduct, createService } from '../../services/api';
import placeholderImage from '../../assets/images/placeholder.svg';

const initialForm = {
  nombre: '', descripcion: '', precio: '', stock: 12, imagen: '', edad: 1, raza: '', sexo: 'Macho', color: '', peso: '', esterilizado: false, vacunado: false,
};

const AdminCatalogForm = ({ onSaved }) => {
  const [type, setType] = useState('producto');
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('La imagen debe estar en formato JPG, PNG o WebP.');
      event.target.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setMessage('La imagen no puede superar 3 MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, imagen: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.nombre.trim()) {
      setMessage('El nombre es obligatorio.');
      return;
    }

    const finalImagen = form.imagen && form.imagen.trim() ? form.imagen.trim() : null;

    if (type === 'gato') {
      if (Number(form.edad) < 0) {
        setMessage('La edad no puede ser negativa.');
        return;
      }
      setSaving(true);
      setMessage('');
      try {
        await createGato({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          edad: Number(form.edad || 0),
          raza: form.raza.trim(),
          sexo: form.sexo,
          color: form.color.trim(),
          peso: form.peso === '' ? null : Number(form.peso),
          esterilizado: Boolean(form.esterilizado),
          vacunado: Boolean(form.vacunado),
          imagen: finalImagen,
        });
        setForm(initialForm);
        setMessage('Gato agregado correctamente.');
        if (onSaved) onSaved();
      } catch (error) {
        setMessage(error.message);
      } finally {
        setSaving(false);
      }
      return;
    }

    const numPrecio = Number(form.precio);
    if (form.precio === '' || isNaN(numPrecio) || numPrecio < 0) {
      setMessage('Escribe un precio válido.');
      return;
    }

    if (type === 'producto' && numPrecio <= 0) {
      setMessage('El precio de un producto debe ser mayor a 0 COP.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const action = type === 'producto' ? createProduct : createService;
      await action({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precio: numPrecio,
        stock: Number(form.stock),
        imagen: finalImagen
      });
      setForm(initialForm);
      setMessage(`${type === 'producto' ? 'Producto' : 'Servicio'} agregado correctamente.`);
      if (onSaved) onSaved();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="catalog-admin-form" onSubmit={handleSubmit}>
      <div className="catalog-form-heading">
        <div><span className="section-label">Nuevo registro</span><h3>Agregar al catálogo</h3></div>
        <select aria-label="Tipo de registro" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="producto">Producto</option>
          <option value="servicio">Servicio</option>
          <option value="gato">Gato en adopción</option>
        </select>
      </div>
      <div className="catalog-form-fields">
        <label>Nombre<input name="nombre" value={form.nombre} onChange={handleChange} maxLength={100} required /></label>
        <label>Descripción<textarea name="descripcion" value={form.descripcion} onChange={handleChange} maxLength={255} rows="2" /></label>
        {type === 'gato' ? (
          <>
            <label>Edad<input name="edad" type="number" min="0" value={form.edad} onChange={handleChange} required /></label>
            <label>Raza<input name="raza" value={form.raza} onChange={handleChange} maxLength={80} /></label>
            <label>Sexo<input name="sexo" value={form.sexo} onChange={handleChange} maxLength={20} /></label>
            <label>Color<input name="color" value={form.color} onChange={handleChange} maxLength={60} /></label>
            <label>Peso (kg)<input name="peso" type="number" min="0" step="0.1" value={form.peso} onChange={handleChange} /></label>
            <label><input type="checkbox" name="esterilizado" checked={form.esterilizado} onChange={(event) => setForm((current) => ({ ...current, esterilizado: event.target.checked }))} /> Esterilizado</label>
            <label><input type="checkbox" name="vacunado" checked={form.vacunado} onChange={(event) => setForm((current) => ({ ...current, vacunado: event.target.checked }))} /> Vacunado</label>
          </>
        ) : (
          <>
            <label>Precio<input name="precio" type="number" min="0" step="0.01" value={form.precio} onChange={handleChange} required /></label>
            <label>Stock<input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required /></label>
          </>
        )}
        <div className="catalog-image-field-wrap">
          <label>URL de la imagen (opcional)
            <input
              name="imagen"
              value={form.imagen}
              onChange={handleChange}
              placeholder="https://... o sube un archivo abajo"
            />
          </label>
          <label className="catalog-image-field">
            O subir archivo local:
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
          </label>
          {form.imagen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <img
                className="catalog-image-preview"
                src={form.imagen}
                alt="Vista previa del registro"
                onError={(e) => {
                  e.currentTarget.src = placeholderImage;
                  e.currentTarget.onerror = null;
                }}
              />
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, imagen: '' }))}
                style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Quitar
              </button>
            </div>
          )}
        </div>
      </div>
      <button className="catalog-submit" type="submit" disabled={saving}>{saving ? 'Guardando...' : `Agregar ${type}`}</button>
      {message && <p className="form-server-error" role="status">{message}</p>}
    </form>
  );
};

export default AdminCatalogForm;
