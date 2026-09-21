import { useState } from 'react';
import { createGato, createProduct, createService } from '../services/api';

const initialForm = {
  nombre: '', descripcion: '', precio: '', imagen: '', edad: 1, raza: '', sexo: 'Macho', color: '', peso: '', esterilizado: false, vacunado: false,
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
          imagen: form.imagen,
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

    if (form.precio === '' || Number(form.precio) < 0) {
      setMessage('Escribe un precio válido.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const action = type === 'producto' ? createProduct : createService;
      await action({ nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), precio: Number(form.precio), imagen: form.imagen });
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
          <label>Precio<input name="precio" type="number" min="0" step="0.01" value={form.precio} onChange={handleChange} required /></label>
        )}
        <label className="catalog-image-field">Imagen de la carta<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} required />{form.imagen && <img className="catalog-image-preview" src={form.imagen} alt="Vista previa del registro" />}</label>
      </div>
      <button className="catalog-submit" type="submit" disabled={saving}>{saving ? 'Guardando...' : `Agregar ${type}`}</button>
      {message && <p className="form-server-error" role="status">{message}</p>}
    </form>
  );
};

export default AdminCatalogForm;
