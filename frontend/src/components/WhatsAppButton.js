import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => (
  <a className="whatsapp-button" href="https://wa.me/573015528014" target="_blank" rel="noreferrer" aria-label="Contactar a Café Salome por WhatsApp" title="WhatsApp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#25D366', color: 'white', position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
    <MessageCircle size={32} />
  </a>
);

export default WhatsAppButton;
