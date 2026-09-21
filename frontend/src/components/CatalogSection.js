import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getServices } from '../services/api';

const CatalogSection = () => {
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [activeCategory, setActiveCategory] = useState('todos'); // 'todos' | 'productos' | 'servicios'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCatalog = () => {
      setLoading(true);
      Promise.all([getProducts(), getServices()])
        .then(([productData, serviceData]) => {
          setProducts(productData);
          setServices(serviceData);
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
            🌟 Ver Todo ({displayedProducts.length + displayedServices.length})
          </button>
          <button
            type="button"
            className={`pill-btn ${activeCategory === 'productos' ? 'active' : ''}`}
            onClick={() => setActiveCategory('productos')}
          >
            ☕ Productos ({displayedProducts.length})
          </button>
          <button
            type="button"
            className={`pill-btn ${activeCategory === 'servicios' ? 'active' : ''}`}
            onClick={() => setActiveCategory('servicios')}
          >
            ✨ Servicios ({displayedServices.length})
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
              <h3>☕ Carta de Productos</h3>
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
                    <div className="catalog-card-image catalog-card-image-empty">☕ Café Salome</div>
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
              <h3>✨ Servicios & Cat Café</h3>
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
                    <div className="catalog-card-image catalog-card-image-empty">✨ Experiencia</div>
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
    </div>
  );
};

export default CatalogSection;
