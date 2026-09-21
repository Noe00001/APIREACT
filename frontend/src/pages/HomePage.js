import { Carrusel } from '../components/Carrusel';
import CatalogSection from '../components/CatalogSection';
import CatAdoptionSection from '../components/CatAdoptionSection';
import AiCoffeeRecommender from '../components/AiCoffeeRecommender';

const HomePage = () => {
  return (
    <>
      <section className="hero-section">
        <div className="hero-content">
          <span className="eyebrow">Cafetería de Especialidad & Cat Café</span>
          <h1>Sabores cálidos, aromas únicos y ronroneos</h1>
          <p>Descubre nuestras bebidas artesanales, repostería casera y el rincón perfecto para disfrutar de un café en compañía de gatitos rescatados.</p>
          <div className="hero-cta-group" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
            <a href="#productos" className="site-cta" style={{ textDecoration: 'none' }}>☕ Productos (10)</a>
            <a href="#servicios" className="site-cta" style={{ textDecoration: 'none' }}>✨ Servicios (10)</a>
            <a href="#adopciones" className="site-cta" style={{ textDecoration: 'none' }}>🐾 Gatos (10)</a>
            <a href="#ia-recommender" className="site-toggle" style={{ textDecoration: 'none' }}>✨ Recomendación IA</a>
          </div>
        </div>
      </section>

      <Carrusel />

      <section id="ia-recommender" className="page-container py-6">
        <AiCoffeeRecommender />
      </section>

      <CatalogSection />
      <CatAdoptionSection />
    </>
  );
};

export default HomePage;
