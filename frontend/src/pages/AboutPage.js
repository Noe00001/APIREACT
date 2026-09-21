import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="about-page-container">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-badge">Nuestra Esencia</div>
        <h1>Café de Especialidad & Santuario Felino</h1>
        <p className="about-hero-lead">
          En Café Salome unimos dos pasiones: el aroma y ritual de un café de altura tostado a la
          perfección, y el amor incondicional por los gatos rescatados que esperan un hogar lleno de cariño.
        </p>
      </section>

      {/* Story & Philosophy */}
      <section className="about-story-grid">
        <div className="about-story-card">
          <span className="about-card-icon">☕</span>
          <h3>Nuestra Filosofía</h3>
          <p>
            Creemos en las pausas conscientes. En un mundo acelerado, nuestro café ofrece un refugio de calma,
            luz cálida y música tranquila. Cada taza es preparada por baristas dedicados utilizando granos 100%
            colombianos de origen sostenible.
          </p>
        </div>

        <div className="about-story-card">
          <span className="about-card-icon">🐾</span>
          <h3>Compromiso y Rescate</h3>
          <p>
            No somos solo una cafetería: somos un puente hacia una nueva vida para felinos en situación de vulnerabilidad.
            Cada gato que comparte nuestro espacio recibe atención médica completa, esterilización, vacunas y un entorno
            enriquecido mientras encuentra a su familia ideal.
          </p>
        </div>
      </section>

      {/* The 4 Pillars */}
      <section className="about-pillars-section">
        <div className="section-header-center">
          <span className="eyebrow">Nuestros Valores</span>
          <h2>Los Pilares de Café Salome</h2>
          <p>Lo que nos guía en cada taza servida y cada ronroneo compartido.</p>
        </div>

        <div className="pillars-grid">
          <div className="pillar-item">
            <div className="pillar-number">01</div>
            <h4>Trazabilidad y Origen</h4>
            <p>
              Granos de fincas colombianas seleccionadas con procesos artesanales (Lavados, Honey y Naturales)
              que honran a los caficultores locales.
            </p>
          </div>

          <div className="pillar-item">
            <div className="pillar-number">02</div>
            <h4>Bienestar Animal Primero</h4>
            <p>
              El bienestar y la tranquilidad de nuestros michis es innegociable. Cuentan con áreas de descanso exclusivas,
              enriquecimiento ambiental y chequeos veterinarios constantes.
            </p>
          </div>

          <div className="pillar-item">
            <div className="pillar-number">03</div>
            <h4>Adopción Ética y Responsable</h4>
            <p>
              Fomentamos la tenencia responsable mediante entrevistas y seguimiento continuo, asegurando hogares
              amorosos y duraderos.
            </p>
          </div>

          <div className="pillar-item">
            <div className="pillar-number">04</div>
            <h4>Comunidad y Empatía</h4>
            <p>
              Un espacio abierto para trabajar, leer, disfrutar de un postre casero o simplemente recargar energías
              con una dosis de ronroneoterapia.
            </p>
          </div>
        </div>
      </section>

      {/* Rules / Cat Etiquette */}
      <section className="about-rules-card">
        <div className="rules-header">
          <span className="rules-tag">Guía de Convivencia</span>
          <h3>Reglas de Oro en el Cat Café</h3>
          <p>Para garantizar una experiencia segura, armónica y respetuosa para humanos y michis:</p>
        </div>

        <div className="rules-list-grid">
          <div className="rule-box">
            <span className="rule-emoji">😴</span>
            <div>
              <strong>Respeta sus horas de siesta</strong>
              <p>Si un gatito está durmiendo plácidamente, permítele descansar sin moverlo.</p>
            </div>
          </div>

          <div className="rule-box">
            <span className="rule-emoji">📸</span>
            <div>
              <strong>Fotografías sin flash</strong>
              <p>Los ojos de los gatos son hipersensibles a la luz brillante.</p>
            </div>
          </div>

          <div className="rule-box">
            <span className="rule-emoji">🧼</span>
            <div>
              <strong>Higiene antes de interactuar</strong>
              <p>Desinfecta tus manos en nuestras estaciones antes y después de acariciarlos.</p>
            </div>
          </div>

          <div className="rule-box">
            <span className="rule-emoji">🚫</span>
            <div>
              <strong>No darles comida humana</strong>
              <p>Nuestros pasteles y cafés son deliciosos para ti, pero pueden ser tóxicos para ellos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Adoption Workflow Callout */}
      <section className="about-cta-section">
        <div className="about-cta-inner">
          <h2>¿Buscas un nuevo mejor amigo de cuatro patas?</h2>
          <p>
            Ven a visitarnos, comparte un café con nuestros gatitos en adopción y permítete enamorarte
            del compañero perfecto.
          </p>
          <div className="about-cta-buttons">
            <Link to="/#adopciones" className="primary-btn">
              Ver Gatos en Adopción
            </Link>
            <Link to="/contacto" className="secondary-btn">
              Planear mi Visita / Reservar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
