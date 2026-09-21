import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGatos } from '../services/api';
import { PawPrint, Check, Heart } from 'lucide-react';

const CatAdoptionSection = () => {
  const [gatos, setGatos] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getGatos()
      .then(setGatos)
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  // Limitamos estrictamente a un máximo de 10 gatos según requerimiento
  const displayedGatos = gatos.slice(0, 10);

  return (
    <section id="adopciones" className="cat-adoption-section separate-category-section">
      <div className="category-section-header">
        <div className="category-title-wrap">
          <span className="category-badge-chip cat-chip">Categoría 3 • Adopciones</span>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><PawPrint size={24} /> Gatos en Adopción</h2>
          <p>Conoce a nuestros {displayedGatos.length} michis rescatados que esperan una familia responsable (Máx. 10).</p>
        </div>
        <span className="category-counter">{displayedGatos.length} michis disponibles</span>
      </div>

      {message && <p className="catalog-message error-banner">{message}</p>}
      {loading && <p className="catalog-message">Cargando michis...</p>}

      <div className="catalog-grid">
        {displayedGatos.length === 0 && !loading ? (
          <p className="catalog-message">No hay gatos disponibles en adopción en este momento.</p>
        ) : (
          displayedGatos.map((gato) => (
            <article className="catalog-card cat-card" key={`gato-${gato.id}`}>
              <div className="catalog-image-wrap">
                {gato.imagen ? (
                  <img
                    className="catalog-card-image"
                    src={gato.imagen}
                    alt={gato.nombre}
                    loading="lazy"
                  />
                ) : (
                  <div className="catalog-card-image catalog-card-image-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><PawPrint size={18} /> Sin foto</div>
                )}
                <span className="cat-status-badge">Disponible</span>
              </div>

              <div className="catalog-card-content">
                <span className="item-type-tag tag-cat">{gato.raza || 'Mestizo'}</span>
                <h3>{gato.nombre}</h3>
                <p>{gato.descripcion || 'Buscando una familia llena de cariño.'}</p>

                <div className="cat-meta-grid">
                  <div className="cat-meta-item">
                    <span>Edad:</span>
                    <strong>{gato.edad} {gato.edad === 1 ? 'año' : 'años'}</strong>
                  </div>
                  <div className="cat-meta-item">
                    <span>Sexo:</span>
                    <strong>{gato.sexo || 'No inf.'}</strong>
                  </div>
                  <div className="cat-meta-item">
                    <span>Color:</span>
                    <strong>{gato.color || 'No inf.'}</strong>
                  </div>
                  <div className="cat-meta-item">
                    <span>Peso:</span>
                    <strong>{gato.peso ? `${gato.peso} kg` : 'No inf.'}</strong>
                  </div>
                </div>

                <div className="health-badges-row">
                  {gato.esterilizado && <span className="health-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Check size={13} /> Esterilizado</span>}
                  {gato.vacunado && <span className="health-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Check size={13} /> Vacunado</span>}
                </div>

                <div className="card-footer-action">
                  <Link
                    to="/contacto"
                    className="btn-adopt-cat"
                    title={`Solicitar adopción de ${gato.nombre}`}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Heart size={16} /> Conocer a {gato.nombre}
                  </Link>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

export default CatAdoptionSection;
