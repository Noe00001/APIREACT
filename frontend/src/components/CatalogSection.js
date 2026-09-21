import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getServices, getGatos } from '../services/api';
import { LayoutGrid, Coffee, Sparkles, PawPrint, Check, Heart } from 'lucide-react';

const CatalogSection = () => {
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [gatos, setGatos] = useState([]);
  const [activeCategory, setActiveCategory] = useState('todos'); // 'todos' | 'productos' | 'servicios' | 'gatos'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(null);

  useEffect(() => {
    const loadCatalog = () => {
      setLoading(true);
      Promise.all([getProducts(), getServices(), getGatos()])
        .then(([productData, serviceData, gatosData]) => {
          setProducts(productData);
          setServices(serviceData);
          setGatos(gatosData);
          setError('');
        })
        .catch(() => setError('No fue posible cargar el catálogo en este momento.'))
        .finally(() => setLoading(false));
    };

    loadCatalog();
    window.addEventListener('catalog-updated', loadCatalog);
    return () => window.removeEventListener('catalog-updated', loadCatalog);
  }, []);

  // Limitamos estrictamente a un máximo de 10 por categoría según requerimiento
  const displayedProducts = products.slice(0, 10);
  const displayedServices = services.slice(0, 10);
  const displayedGatos = gatos.slice(0, 10);

  return (
    <div id="menu" className="catalog-wrapper">
      {/* Category selector filter */}
      <div className="catalog-nav-header">
        <div className="catalog-nav-info">
          <span className="eyebrow">Catálogo Café Salome</span>
          <h2>Nuestra Oferta Gastronómica y Experiencias</h2>
          <p>Explora nuestras dos categorías exclusivas: productos artesanales y servicios de Cat Café.</p>
        </div>

        <div className="category-pills">
          <button
            type="button"
            className={`pill-btn ${activeCategory === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveCategory('todos')}
          >
            <LayoutGrid size={16} /> Ver Todo ({displayedProducts.length + displayedServices.length + displayedGatos.length})
          </button>
          <button
            type="button"
            className={`pill-btn ${activeCategory === 'productos' ? 'active' : ''}`}
            onClick={() => setActiveCategory('productos')}
          >
            <Coffee size={16} /> Productos ({displayedProducts.length})
          </button>
          <button
            type="button"
            className={`pill-btn ${activeCategory === 'servicios' ? 'active' : ''}`}
            onClick={() => setActiveCategory('servicios')}
          >
            <Sparkles size={16} /> Servicios ({displayedServices.length})
          </button>
          <button
            type="button"
            className={`pill-btn ${activeCategory === 'gatos' ? 'active' : ''}`}
            onClick={() => setActiveCategory('gatos')}
          >
            <PawPrint size={16} /> Gatos ({displayedGatos.length})
          </button>
        </div>
      </div>

      {error && <p className="catalog-message error-banner">{error}</p>}
      {loading && <p className="catalog-message">Cargando catálogo...</p>}

      {/* =========================================================
          CATEGORÍA 1: PRODUCTOS (MÁXIMO 10)
          ========================================================= */}
      {(activeCategory === 'todos' || activeCategory === 'productos') && (
        <section id="productos" className="catalog-section separate-category-section">
          <div className="category-section-header">
            <div className="category-title-wrap">
              <span className="category-badge-chip product-chip">Categoría 1 • Gastronomía</span>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Coffee size={22} /> Carta de Productos</h3>
              <p>Cafés de origen, métodos de filtrado y repostería artesanal horneada a diario (Máx. 10).</p>
            </div>
            <span className="category-counter">{displayedProducts.length} disponibles</span>
          </div>

          {displayedProducts.length === 0 ? (
            <p className="catalog-message">No hay productos disponibles por ahora.</p>
          ) : (
            <div className="catalog-grid">
              {displayedProducts.map((item) => (
                <article className="catalog-card product-card" key={`prod-${item.id}`}>
                  {item.imagen ? (
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="catalog-card-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="catalog-card-image catalog-card-image-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Coffee size={18} /> Café Salome</div>
                  )}
                  <div className="catalog-card-content">
                    <span className="item-type-tag tag-product">Producto</span>
                    <h3>{item.nombre}</h3>
                    <p>{item.descripcion || 'Especialidad preparada con los mejores ingredientes.'}</p>
                    <div className="card-footer-action">
                      <strong className="item-price">
                        ${Number(item.precio).toLocaleString('es-CO')}
                      </strong>
                      <span className="fresh-indicator">Fresco & Artesanal</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =========================================================
          CATEGORÍA 2: SERVICIOS (MÁXIMO 10)
          ========================================================= */}
      {(activeCategory === 'todos' || activeCategory === 'servicios') && (
        <section id="servicios" className="catalog-section separate-category-section">
          <div className="category-section-header">
            <div className="category-title-wrap">
              <span className="category-badge-chip service-chip">Categoría 2 • Experiencias</span>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={22} /> Servicios & Cat Café</h3>
              <p>Gatoterapia, reservas VIP, talleres de barismo y coworking relajante (Máx. 10).</p>
            </div>
            <span className="category-counter">{displayedServices.length} disponibles</span>
          </div>

          {displayedServices.length === 0 ? (
            <p className="catalog-message">No hay servicios disponibles por ahora.</p>
          ) : (
            <div className="catalog-grid">
              {displayedServices.map((item) => (
                <article className="catalog-card service-card" key={`serv-${item.id}`}>
                  {item.imagen ? (
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="catalog-card-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="catalog-card-image catalog-card-image-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Sparkles size={18} /> Experiencia</div>
                  )}
                  <div className="catalog-card-content">
                    <span className="item-type-tag tag-service">Servicio</span>
                    <h3>{item.nombre}</h3>
                    <p>{item.descripcion || 'Experiencia diseñada para el disfrute y calma.'}</p>
                    <div className="card-footer-action">
                      <strong className="item-price">
                        {item.precio ? `$${Number(item.precio).toLocaleString('es-CO')}` : 'A consultar'}
                      </strong>
                      <Link to="/contacto" className="btn-reserve-service">
                        Reservar
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =========================================================
          CATEGORÍA 3: GATOS EN ADOPCIÓN (MÁXIMO 10)
          ========================================================= */}
      {(activeCategory === 'todos' || activeCategory === 'gatos') && (
        <section id="adopciones" className="catalog-section separate-category-section">
          <div className="category-section-header">
            <div className="category-title-wrap">
              <span className="category-badge-chip cat-chip" style={{ backgroundColor: '#fce7f3', color: '#be185d' }}>Categoría 3 • Adopciones</span>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><PawPrint size={22} /> Gatos en Adopción</h3>
              <p>Conoce a nuestros {displayedGatos.length} michis rescatados que esperan una familia responsable (Máx. 10).</p>
            </div>
            <span className="category-counter">{displayedGatos.length} disponibles</span>
          </div>

          {displayedGatos.length === 0 ? (
            <p className="catalog-message">No hay gatos disponibles en adopción en este momento.</p>
          ) : (
            <div className="catalog-grid">
              {displayedGatos.map((gato) => (
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

                    <div className="cat-meta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px', fontSize: '0.85rem' }}>
                      <div className="cat-meta-item">
                        <span style={{ color: '#64748b' }}>Edad: </span>
                        <strong>{gato.edad} {gato.edad === 1 ? 'año' : 'años'}</strong>
                      </div>
                      <div className="cat-meta-item">
                        <span style={{ color: '#64748b' }}>Sexo: </span>
                        <strong>{gato.sexo || 'No inf.'}</strong>
                      </div>
                      <div className="cat-meta-item">
                        <span style={{ color: '#64748b' }}>Color: </span>
                        <strong>{gato.color || 'No inf.'}</strong>
                      </div>
                      <div className="cat-meta-item">
                        <span style={{ color: '#64748b' }}>Peso: </span>
                        <strong>{gato.peso ? `${gato.peso} kg` : 'No inf.'}</strong>
                      </div>
                    </div>

                    <div className="health-badges-row" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      {gato.esterilizado && <span className="health-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#047857' }}><Check size={13} /> Esterilizado</span>}
                      {gato.vacunado && <span className="health-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#047857' }}><Check size={13} /> Vacunado</span>}
                    </div>

                    <div className="card-footer-action">
                      <button
                        type="button"
                        onClick={() => setSelectedCat(gato)}
                        className="btn-adopt-cat hover:bg-pink-700 transition-colors"
                        title={`Conocer a ${gato.nombre}`}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '10px', backgroundColor: '#be185d', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                      >
                        <Heart size={16} /> Conocer a {gato.nombre}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* MODAL DE GATO */}
      {selectedCat && (
        <div className="modal-backdrop" onClick={() => setSelectedCat(null)} style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <button type="button" onClick={() => setSelectedCat(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#f1f5f9', border: 'none', fontSize: '24px', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>&times;</button>
            <div style={{ textAlign: 'center' }}>
              {selectedCat.imagen ? (
                <img src={selectedCat.imagen} alt={selectedCat.nombre} style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '16px', marginBottom: '20px' }} />
              ) : (
                <div style={{ width: '100%', height: '280px', backgroundColor: '#f1f5f9', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <PawPrint size={64} color="#94a3b8" />
                </div>
              )}
              <h2 style={{ fontSize: '32px', color: '#be185d', marginBottom: '8px', fontFamily: 'serif', fontWeight: 'bold' }}>{selectedCat.nombre}</h2>
              <span className="cat-status-badge" style={{ display: 'inline-block', backgroundColor: '#dcfce7', color: '#166534', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', marginBottom: '20px' }}>Disponible para adopción</span>
              
              <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '16px', marginBottom: '24px', padding: '0 10px' }}>{selectedCat.descripcion || 'Buscando una familia responsable y llena de cariño.'}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'left', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                <div><span style={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Raza</span> <strong style={{ display: 'block', fontSize: '16px', color: '#1e293b' }}>{selectedCat.raza || 'Mestizo'}</strong></div>
                <div><span style={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Edad</span> <strong style={{ display: 'block', fontSize: '16px', color: '#1e293b' }}>{selectedCat.edad} {selectedCat.edad === 1 ? 'año' : 'años'}</strong></div>
                <div><span style={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sexo</span> <strong style={{ display: 'block', fontSize: '16px', color: '#1e293b' }}>{selectedCat.sexo || 'No informado'}</strong></div>
                <div><span style={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Color</span> <strong style={{ display: 'block', fontSize: '16px', color: '#1e293b' }}>{selectedCat.color || 'No informado'}</strong></div>
                <div><span style={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peso</span> <strong style={{ display: 'block', fontSize: '16px', color: '#1e293b' }}>{selectedCat.peso ? `${selectedCat.peso} kg` : 'No informado'}</strong></div>
                
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '10px' }}>
                  {selectedCat.esterilizado && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px', borderRadius: '20px', backgroundColor: '#ecfdf5', color: '#047857', fontWeight: '500' }}><Check size={16} /> Esterilizado</span>}
                  {selectedCat.vacunado && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px', borderRadius: '20px', backgroundColor: '#ecfdf5', color: '#047857', fontWeight: '500' }}><Check size={16} /> Vacunado</span>}
                </div>
              </div>

              <Link to="/contacto" onClick={() => setSelectedCat(null)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '16px', backgroundColor: '#be185d', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 6px -1px rgba(190, 24, 93, 0.2)' }}>
                <Heart size={20} /> Iniciar proceso de adopción
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CatalogSection;
