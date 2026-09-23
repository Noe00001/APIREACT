import { useState } from 'react';
import { Sparkles, MapPin, MessageSquare, Mail, Phone, MessageCircle } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: '¿Se requiere reserva previa para visitar el Cat Café?',
    a: 'No es obligatoria, pero recomendamos reservar los fines de semana y festivos para garantizar una mesa en la sala de gatos sin tiempos de espera.',
  },
  {
    q: '¿Pueden ingresar niños a la sala de gatos?',
    a: '¡Sí! Los niños son bienvenidos acompañados de un adulto responsable que supervise que se cumplan las reglas de respeto y cariño hacia los michis.',
  },
  {
    q: '¿Ofrecen opciones de leche vegetal y repostería vegana?',
    a: 'Por supuesto. Contamos con leche de avena, almendras y soya sin costo adicional, además de postres veganos y opciones sin gluten elaboradas a mano.',
  },
  {
    q: '¿Puedo llevar mi propia mascota al café?',
    a: 'Por la seguridad y tranquilidad de los gatos residentes y en adopción, no está permitido el ingreso de animales externos a las zonas compartidas.',
  },
];

const ContactPage = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    motivo: 'reserva',
    personas: '2',
    fecha: '',
    mensaje: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.nombre.trim() || !formData.email.trim()) {
      setError('Por favor ingresa tu nombre y correo.');
      return;
    }

    setSubmitted(true);
  };

  const handleReset = () => {
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      motivo: 'reserva',
      personas: '2',
      fecha: '',
      mensaje: '',
    });
    setSubmitted(false);
  };

  return (
    <div className="contact-page-container">
      {/* Hero Header */}
      <section className="contact-hero">
        <span className="eyebrow">Atención & Reservas</span>
        <h1>Estamos Encantados de Recibirte</h1>
        <p>
          Escríbenos para reservar tu visita, coordinar una adopción felina o conocer más de nuestra
          carta de cafés y repostería artesanal.
        </p>
      </section>

      {/* Main Grid: Form + Info Cards */}
      <section className="contact-main-grid">
        {/* Contact & Reservation Form */}
        <div className="contact-form-card">
          <div className="card-header-simple">
            <h3>Envíanos un Mensaje o Reserva</h3>
            <p>Te responderemos por correo o WhatsApp a la mayor brevedad posible.</p>
          </div>

          {submitted ? (
            <div className="contact-success-box">
              <span className="success-icon"><Sparkles size={24} /></span>
              <h4>¡Mensaje Recibido, {formData.nombre}!</h4>
              <p>
                Hemos registrado tu solicitud para el motivo:{' '}
                <strong>
                  {formData.motivo === 'reserva'
                    ? 'Reserva de Mesa'
                    : formData.motivo === 'adopcion'
                    ? 'Información de Adopción'
                    : formData.motivo === 'evento'
                    ? 'Evento Privado'
                    : 'Consulta General'}
                </strong>
                . Nos comunicaremos al correo <strong>{formData.email}</strong> en menos de 24 horas.
              </p>
              <button type="button" className="btn-action-primary" onClick={handleReset}>
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form-elements">
              {error && <div className="modal-alert error">{error}</div>}

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="c-nombre">Nombre completo *</label>
                  <input
                    id="c-nombre"
                    name="nombre"
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="c-email">Correo electrónico *</label>
                  <input
                    id="c-email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="c-telefono">Teléfono / WhatsApp</label>
                  <input
                    id="c-telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="+57 300 000 0000"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="c-motivo">Motivo de contacto</label>
                  <select id="c-motivo" name="motivo" value={formData.motivo} onChange={handleChange}>
                    <option value="reserva">Reserva de mesa con michis</option>
                    <option value="adopcion">Información sobre adopción</option>
                    <option value="evento">Eventos privados o cumpleaños</option>
                    <option value="consulta">Consulta de menú y horarios</option>
                  </select>
                </div>
              </div>

              {formData.motivo === 'reserva' && (
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="c-personas">Número de personas</label>
                    <select
                      id="c-personas"
                      name="personas"
                      value={formData.personas}
                      onChange={handleChange}
                    >
                      <option value="1">1 persona</option>
                      <option value="2">2 personas</option>
                      <option value="3">3 personas</option>
                      <option value="4">4 personas</option>
                      <option value="5+">5 o más personas</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="c-fecha">Fecha y hora tentativa</label>
                    <input
                      id="c-fecha"
                      name="fecha"
                      type="datetime-local"
                      value={formData.fecha}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="c-mensaje">Mensaje o especificaciones</label>
                <textarea
                  id="c-mensaje"
                  name="mensaje"
                  rows={4}
                  value={formData.mensaje}
                  onChange={handleChange}
                  placeholder="Cuéntanos si celebras alguna fecha especial o si tienes requerimientos específicos..."
                />
              </div>

              <button type="submit" className="btn-action-primary submit-btn-block">
                Enviar Solicitud
              </button>
            </form>
          )}
        </div>

        {/* Contact Info Sidebar */}
        <div className="contact-info-sidebar">
          {/* Card: Location & Hours */}
          <div className="info-box-card">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={20} /> Ubicación y Horarios</h4>
            <p>
              <strong>Café Salome Cat Café</strong>
              <br />
              Carrera 43A # 1-50, El Poblado
              <br />
              Medellín, Antioquia — Colombia
            </p>
            <div className="hours-block">
              <div className="hour-row">
                <span>Lunes a Viernes:</span>
                <strong>8:00 AM – 8:00 PM</strong>
              </div>
              <div className="hour-row">
                <span>Sábados y Domingos:</span>
                <strong>9:00 AM – 8:30 PM</strong>
              </div>
            </div>
          </div>

          {/* Card: Direct Channels */}
          <div className="info-box-card">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={20} /> Canales Directos</h4>
            <ul className="direct-channels-list">
              <li>
                <span className="channel-icon"><Mail size={20} /></span>
                <div>
                  <small>Correo Oficial</small>
                  <a href="mailto:lopez.salomeestrada@gmail.com">lopez.salomeestrada@gmail.com</a>
                </div>
              </li>
              <li>
                <span className="channel-icon"><Phone size={20} /></span>
                <div>
                  <small>Línea de Atención</small>
                  <a href="tel:+573015528014">+57 301 5528014</a>
                </div>
              </li>
              <li>
                <span className="channel-icon"><MessageCircle size={20} /></span>
                <div>
                  <small>Chat de WhatsApp</small>
                  <a
                    href="https://wa.me/573015528014?text=Hola%20Café%20Salome,%20deseo%20más%20información"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Escribir por WhatsApp
                  </a>
                </div>
              </li>
            </ul>

            <div className="social-pills-row">
              <a
                href="https://www.instagram.com/cafesalome"
                target="_blank"
                rel="noreferrer"
                className="social-pill"
              >
                Instagram
              </a>
              <a
                href="https://www.facebook.com/cafesalome"
                target="_blank"
                rel="noreferrer"
                className="social-pill"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="contact-faq-section">
        <div className="section-header-center">
          <span className="eyebrow">Resolviendo Dudas</span>
          <h2>Preguntas Frecuentes</h2>
          <p>Todo lo que necesitas saber antes de vivir la experiencia felina.</p>
        </div>

        <div className="faq-list">
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={`faq-${idx}`}
              className={`faq-item ${activeFaq === idx ? 'open' : ''}`}
              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
            >
              <div className="faq-question">
                <span>{item.q}</span>
                <span className="faq-toggle-icon">{activeFaq === idx ? '−' : '＋'}</span>
              </div>
              {activeFaq === idx && <div className="faq-answer">{item.a}</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
