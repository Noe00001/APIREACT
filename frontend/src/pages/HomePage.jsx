import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Carrusel } from '../components/sections/Carrusel';
import GaleriaGrid from '../components/sections/GaleriaGrid';
import CatalogSection from '../components/sections/CatalogSection';
import AiCoffeeRecommender from '../components/features/AiCoffeeRecommender';
import { Coffee, Sparkles, PawPrint } from 'lucide-react';
import { getProducts, getServices, getGatos } from '../services/api';

const HomePage = () => {
  const location = useLocation();
  const [counts, setCounts] = useState({ products: 0, services: 0, gatos: 0 });

  useEffect(() => {
    const fetchCounts = () => {
      Promise.all([getProducts(), getServices(), getGatos()])
        .then(([p, s, g]) => {
          setCounts({
            products: p.length,
            services: s.length,
            gatos: g.length
          });
        })
        .catch(() => console.error("Error fetching catalog counts for hero section"));
    };

    fetchCounts();

    const handleStorageChange = (e) => {
      if (e.key === 'last_catalog_update') {
        fetchCounts();
      }
    };

    window.addEventListener('catalog-updated', fetchCounts);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('catalog-updated', fetchCounts);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  return (
    <>
      <section className="hero-section">
        <div className="hero-content">
          <span className="eyebrow">Cafetería de Especialidad & Cat Café</span>
          <h1>Sabores cálidos, aromas únicos y ronroneos</h1>
          <p>Descubre nuestras bebidas artesanales, repostería casera y el rincón perfecto para disfrutar de un café en compañía de gatitos rescatados.</p>
          <div className="hero-cta-group" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
            <a href="#productos" className="site-cta" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Coffee size={18} /> Productos ({counts.products})</a>
            <a href="#servicios" className="site-cta" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Sparkles size={18} /> Servicios ({counts.services})</a>
            <a href="#adopciones" className="site-cta" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PawPrint size={18} /> Gatos ({counts.gatos})</a>
            <a href="#ia-recommender" className="site-toggle" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Sparkles size={18} /> Recomendación IA</a>
          </div>
        </div>
      </section>

      <Carrusel />

      <section id="ia-recommender" className="page-container py-6">
        <AiCoffeeRecommender />
      </section>

      <GaleriaGrid />

      <CatalogSection />
    </>
  );
};

export default HomePage;
