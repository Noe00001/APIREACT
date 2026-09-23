import React from 'react';
import imgParty from '../../assets/images/cat_party_coffee_1790024627149.jpg';
import imgAdopted from '../../assets/images/cat_adopted_coffee_1790024639541.jpg';
import imgWinter from '../../assets/images/cat_winter_coffee_1790024648498.jpg';
import imgTasting from '../../assets/images/cat_tasting_coffee_1790024658478.jpg';
import imgPlayful from '../../assets/images/cat_playful_coffee_1790024668329.jpg';
import imgAutumn from '../../assets/images/cat_autumn_coffee_1790024698073.jpg';
import imgHappy from '../../assets/images/cat_happy_coffee_1790024706574.jpg';
import imgPastry from '../../assets/images/cat_pastry_coffee_1790024715776.jpg';
import imgCoworking from '../../assets/images/cat_coworking_coffee_1790024725061.jpg';
import imgBirthday from '../../assets/images/cat_birthday_coffee_1790024734114.jpg';

import placeholderImage from '../../assets/images/placeholder.svg';

const galleryItems = [
  {
    title: 'Recuerdos Festivos',
    description: 'Nuestra primera fiesta de adopción. ¡Muchos michis encontraron hogar!',
    image: imgParty,
    tag: 'Fiesta'
  },
  {
    title: 'Bigotes en su nuevo hogar',
    description: 'Bigotes relajándose en su nuevo hogar con su familia humana.',
    image: imgAdopted,
    tag: 'Adoptado'
  },
  {
    title: 'Temporada de Invierno 2023',
    description: 'Bebidas cálidas y ambiente festivo en nuestra temporada navideña pasada.',
    image: imgWinter,
    tag: 'Temporada'
  },
  {
    title: 'Evento de Catación',
    description: 'Nuestros clientes disfrutando del mejor café de origen colombiano.',
    image: imgTasting,
    tag: 'Evento'
  },
  {
    title: 'Luna lista para jugar',
    description: 'Luna esperando pacientemente su turno para atrapar el láser.',
    image: imgPlayful,
    tag: 'Michis'
  },
  {
    title: 'Temporada Otoño',
    description: 'Decoración de otoño con temática felina en Café Salome.',
    image: imgAutumn,
    tag: 'Temporada'
  },
  {
    title: 'Pelusa Feliz',
    description: 'Pelusa, ya adoptada, disfrutando de la compañía de su nueva familia.',
    image: imgHappy,
    tag: 'Adoptado'
  },
  {
    title: 'Nuestros Productos Artesanales',
    description: 'La magia detrás de la barra preparando tu repostería y café favorito.',
    image: imgPastry,
    tag: 'Productos'
  },
  {
    title: 'Tarde de Coworking',
    description: 'Trabajar es mejor cuando tienes una compañía tan ronroneante.',
    image: imgCoworking,
    tag: 'Local'
  },
  {
    title: 'Cumpleaños Gatuno',
    description: 'Celebrando el primer añito de nuestros gatos residentes en la cafetería.',
    image: imgBirthday,
    tag: 'Fiesta'
  },
];

const GaleriaGrid = () => {
  const handleImageError = (event) => {
    event.currentTarget.src = placeholderImage;
    event.currentTarget.onerror = null;
  };

  return (
    <section id="galeria" className="py-16 px-4 md:px-8 max-w-[1400px] mx-auto w-full" aria-label="Galería de fotos y recuerdos">
      <div className="mb-12 text-center">
        <span className="text-amber-700 font-bold tracking-[0.2em] uppercase text-xs md:text-sm mb-3 block">El Muro de los Recuerdos</span>
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-amber-950 mb-4">
          Nuestra Galería
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto text-base md:text-lg">
          Un vistazo a nuestras fiestas, productos estrella, michis que ya encontraron hogar y los mejores momentos de temporadas pasadas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-[250px] md:auto-rows-[300px]">
        {galleryItems.map((item, index) => (
          <div 
            key={index} 
            className={`group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer ${
              index === 0 || index === 3 || index === 6 ? 'md:col-span-2 md:row-span-2' : ''
            }`}
          >
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              onError={handleImageError}
              className="w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-110"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-amber-950/90 via-amber-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 md:p-8">
              
              <span className="inline-block px-4 py-1.5 bg-amber-600/90 text-white text-[10px] uppercase tracking-wider font-bold rounded-full mb-3 w-max shadow-sm backdrop-blur-md transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                {item.tag}
              </span>
              
              <h3 className="text-white font-serif text-2xl md:text-3xl font-bold mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                {item.title}
              </h3>
              
              <p className="text-white/80 text-sm md:text-base leading-snug transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100 line-clamp-2">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GaleriaGrid;
