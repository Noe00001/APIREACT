import { useEffect, useState } from 'react';
import gato1 from '../assets/images/gato1.png';
import gato2 from '../assets/images/gato2.png';
import gato3 from '../assets/images/gato3.png';
import gato4 from '../assets/images/gato4.png';
import gato5 from '../assets/images/gato5.png';
import gato6 from '../assets/images/gato6.png';
import gato7 from '../assets/images/gato7.png';
import gato8 from '../assets/images/gato8.png';
import gato9 from '../assets/images/gato9.png';
import gato10 from '../assets/images/gato10.png';
import placeholderImage from '../assets/images/placeholder.svg';

const slides = [
  {
    title: 'Latte Gatuno',
    description: 'Decoración de leche con un toque de arte adorable.',
    image: gato1,
  },
  {
    title: 'Arte Latte Felino',
    description: 'Una taza con diseño de gato para empezar el día con una sonrisa.',
    image: gato2,
  },
  {
    title: 'Taza de Gato',
    description: 'Café servido en una taza de cerámica con forma de gatito.',
    image: gato3,
  },
  {
    title: 'Capuccino Felino',
    description: 'Espuma suave con un toque creativo en el corazón del capuccino.',
    image: gato4,
  },
  {
    title: 'Taza Miau',
    description: 'Un café con detalles tiernos inspirado en nuestros amigos felinos.',
    image: gato5,
  },
  {
    title: 'Café con Nieve Gatuna',
    description: 'Varios gatitos de espuma flotando en café caliente.',
    image: gato6,
  },
  {
    title: 'Marshmallow Felino',
    description: 'Delicia tostadita con malvaviscos y sabor reconfortante.',
    image: gato7,
  },
  {
    title: 'Parfait Gatuno',
    description: 'Postre en copa con una decoración dulce y divertida.',
    image: gato8,
  },
  {
    title: 'Pastel Gato',
    description: 'Rebanada de pastel decorada con fresas y detalles felinos.',
    image: gato9,
  },
  {
    title: 'Cumpleaños Gatuno',
    description: 'Pastel especial en tonos suaves para celebrar momentos únicos.',
    image: gato10,
  },
];

export const Carrusel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 7000);

    return () => window.clearInterval(interval);
  }, []);

  const previousSlide = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  const currentSlide = slides[activeIndex];

  const handleImageError = (event) => {
    event.currentTarget.src = placeholderImage;
    event.currentTarget.onerror = null;
  };

  return (
    <section id="carrusel" className="carousel-section" aria-label="Carrusel de destacados">
      <div className="carousel-header">
        <div>
          <span className="section-label">Destacados</span>
          <h2 className="carousel-title">Momentos de café</h2>
        </div>
        <div className="carousel-counter">{activeIndex + 1} / {slides.length}</div>
      </div>

      <div className="carousel-shell">
        <div className="carousel-card">
          <img
            src={currentSlide.image}
            alt={currentSlide.title}
            loading="lazy"
            onError={handleImageError}
            className="carousel-image"
          />

          <div className="carousel-copy">
            <h3>{currentSlide.title}</h3>
            <p>{currentSlide.description}</p>
            <div className="carousel-actions">
              <button type="button" onClick={previousSlide} className="carousel-button tertiary">
                ‹ Anterior
              </button>
              <button type="button" onClick={nextSlide} className="carousel-button primary">
                Siguiente ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
