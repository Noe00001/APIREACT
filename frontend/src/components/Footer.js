import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="site-footer" style={{ padding: '2rem 1rem', background: 'var(--card-bg)', color: 'var(--text-color)', borderTop: '1px solid var(--border-color)' }}>
      <div className="site-footer-inner" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div className="footer-contact">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} /> Ubicación
          </h3>
          <p style={{ marginBottom: '1rem' }}>Empire State Building<br/>350 5th Ave, New York, NY 10118, EE. UU.</p>
          <div style={{ width: '100%', height: '150px', borderRadius: '8px', overflow: 'hidden' }}>
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.617544358607!2d-73.9882393845938!3d40.74844047932822!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e199a405a163!2sEmpire%20State%20Building!5e0!3m2!1ses!2sco!4v1699999999999!5m2!1ses!2sco" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de la cafetería"
            ></iframe>
          </div>
        </div>

        <div className="footer-schedule">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} /> Horarios de Atención
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8' }}>
            <li><strong>Lunes a Viernes:</strong> 7:00 AM - 8:00 PM</li>
            <li><strong>Sábados:</strong> 8:00 AM - 9:00 PM</li>
            <li><strong>Domingos:</strong> 9:00 AM - 6:00 PM</li>
          </ul>
        </div>

        <div className="footer-contact-info">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Contacto
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} /> <a href="mailto:lopez.salomeestrada@gmail.com" style={{ color: 'var(--brand-color)', textDecoration: 'none' }}>lopez.salomeestrada@gmail.com</a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={16} /> <a href="tel:+573015528014" style={{ color: 'var(--brand-color)', textDecoration: 'none' }}>+57 301 5528014</a>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="footer-copy" style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.9rem', opacity: 0.8 }}>
        © Café Salome. Un lugar para momentos cálidos y tranquilos.
      </div>
    </footer>
  );
};

export default Footer;
