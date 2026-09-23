import { useState, useEffect } from 'react';
import {
  updateProduct,
  updateService,
  updateGato,
  createProduct,
  createService,
  createGato,
} from '../../services/api';
import placeholderImage from '../../assets/images/placeholder.svg';

const CatalogItemModal = ({
  isOpen,
  onClose,
  onSaved,
  item = null,
  type = 'producto', // 'producto' | 'servicio' | 'gato'
}) => {
  const isEditing = Boolean(item && item.id);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [imagen, setImagen] = useState('');
  const [estado, setEstado] = useState('Activo');

  // Gato fields
  const [edad, setEdad] = useState(1);
  const [raza, setRaza] = useState('');
  const [sexo, setSexo] = useState('Macho');
  const [color, setColor] = useState('');
  const [peso, setPeso] = useState('');
  const [esterilizado, setEsterilizado] = useState(false);
  const [vacunado, setVacunado] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setNombre(item.nombre || '');
      setDescripcion(item.descripcion || '');
      setPrecio(item.precio !== undefined ? String(item.precio) : '');
      setImagen(item.imagen || '');
      setEstado(item.estado || 'Activo');

      if (type === 'gato') {
        setEdad(item.edad !== undefined ? item.edad : 1);
        setRaza(item.raza || '');
        setSexo(item.sexo || 'Macho');
        setColor(item.color || '');
        setPeso(item.peso !== undefined && item.peso !== null ? String(item.peso) : '');
        setEsterilizado(Boolean(item.esterilizado));
        setVacunado(Boolean(item.vacunado));
      }
    } else {
      setNombre('');
      setDescripcion('');
      setPrecio('');
      setImagen('');
      setEstado('Activo');
      setEdad(1);
      setRaza('');
      setSexo('Macho');
      setColor('');
      setPeso('');
      setEsterilizado(false);
      setVacunado(false);
    }
    setError('');
  }, [item, type, isOpen]);

  if (!isOpen) return null;

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato inválido. Usa JPG, PNG o WebP.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('La imagen no puede exceder 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagen(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      const finalImagen = imagen && imagen.trim() ? imagen.trim() : null;

      if (type === 'gato') {
        const payload = {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          edad: Number(edad || 0),
          raza: raza.trim(),
          sexo,
          color: color.trim(),
          peso: peso === '' ? null : Number(peso),
          esterilizado: Boolean(esterilizado),
          vacunado: Boolean(vacunado),
          imagen: finalImagen,
          ...(isEditing ? { estado } : {}),
        };

        if (isEditing) {
          await updateGato(item.id, payload);
        } else {
          await createGato(payload);
        }
      } else {
        // Producto o Servicio
        const numPrecio = Number(precio);
        if (precio === '' || isNaN(numPrecio) || numPrecio < 0) {
          setError('Ingresa un precio válido (mayor o igual a 0).');
          setLoading(false);
          return;
        }

        if (type === 'producto' && numPrecio <= 0) {
          setError('El precio del producto debe ser mayor a 0 COP.');
          setLoading(false);
          return;
        }

        const payload = {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          precio: numPrecio,
          imagen: finalImagen,
          ...(isEditing ? { estado } : {}),
        };

        if (type === 'producto') {
          if (isEditing) {
            await updateProduct(item.id, payload);
          } else {
            await createProduct(payload);
          }
        } else {
          if (isEditing) {
            await updateService(item.id, payload);
          } else {
            await createService(payload);
          }
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar.');
    } finally {
      setLoading(false);
    }
  };

  const typeLabel =
    type === 'producto' ? 'Producto' : type === 'servicio' ? 'Servicio' : 'Gato en Adopción';

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? `Editar ${typeLabel}` : `Nuevo ${typeLabel}`}</h3>
          <button type="button" className="modal-close-icon" onClick={onClose} aria-label="Cerrar">
            &times;
          </button>
        </div>

        {error && <div className="modal-alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="modal-item-nombre">Nombre *</label>
            <input
              id="modal-item-nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={`Nombre del ${typeLabel.toLowerCase()}`}
            />
          </div>

          <div className="form-group">
            <label htmlFor="modal-item-desc">Descripción</label>
            <textarea
              id="modal-item-desc"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles, ingredientes, notas o historia..."
            />
          </div>

          {type !== 'gato' && (
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="modal-item-precio">Precio ($ COP) *</label>
                <input
                  id="modal-item-precio"
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="Ej. 12000"
                />
              </div>
              {isEditing && (
                <div className="form-group">
                  <label htmlFor="modal-item-estado">Estado</label>
                  <select
                    id="modal-item-estado"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {type === 'gato' && (
            <>
              <div className="form-grid-3">
                <div className="form-group">
                  <label htmlFor="gato-edad">Edad (Años)</label>
                  <input
                    id="gato-edad"
                    type="number"
                    min="0"
                    value={edad}
                    onChange={(e) => setEdad(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="gato-sexo">Sexo</label>
                  <select
                    id="gato-sexo"
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value)}
                  >
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="gato-peso">Peso (Kg)</label>
                  <input
                    id="gato-peso"
                    type="number"
                    step="0.1"
                    min="0"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    placeholder="Ej. 3.5"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="gato-raza">Raza</label>
                  <input
                    id="gato-raza"
                    type="text"
                    value={raza}
                    onChange={(e) => setRaza(e.target.value)}
                    placeholder="Ej. Criollo / Mestizo"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="gato-color">Color</label>
                  <input
                    id="gato-color"
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ej. Naranja atigrado"
                  />
                </div>
              </div>

              <div className="form-checkbox-row">
                <label className="checkbox-custom">
                  <input
                    type="checkbox"
                    checked={esterilizado}
                    onChange={(e) => setEsterilizado(e.target.checked)}
                  />
                  <span>Esterilizado</span>
                </label>
                <label className="checkbox-custom">
                  <input
                    type="checkbox"
                    checked={vacunado}
                    onChange={(e) => setVacunado(e.target.checked)}
                  />
                  <span>Vacunado al día</span>
                </label>
                {isEditing && (
                  <div className="form-group inline-select">
                    <label htmlFor="gato-estado">Estado:</label>
                    <select
                      id="gato-estado"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                    >
                      <option value="Activo">Activo (Disponible)</option>
                      <option value="Inactivo">Inactivo (Adoptado)</option>
                    </select>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="form-group">
            <label>Imagen del {typeLabel}</label>
            <div className="image-input-container">
              <input
                type="text"
                value={imagen}
                onChange={(e) => setImagen(e.target.value)}
                placeholder="URL de imagen (https://...) o sube un archivo"
              />
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageFileChange}
              />
            </div>
            {imagen && (
              <div className="image-preview-box">
                <img
                  src={imagen}
                  alt="Vista previa"
                  className="modal-preview-img"
                  onError={(e) => {
                    e.currentTarget.src = placeholderImage;
                    e.currentTarget.onerror = null;
                  }}
                />
                <button
                  type="button"
                  className="btn-remove-img"
                  onClick={() => setImagen('')}
                >
                  Quitar imagen
                </button>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : `Crear ${typeLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CatalogItemModal;
