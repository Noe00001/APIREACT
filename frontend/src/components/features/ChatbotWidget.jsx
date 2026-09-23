import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User } from 'lucide-react';
import chatbotIcon from '../../assets/chatbot-icon.png';
import { startChatSession, sendChatMessage } from '../../services/api';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Al abrir el chat por primera vez, enviar un saludo inicial si está vacío
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      iniciarConversacion();
    }
  }, [isOpen]);

  const iniciarConversacion = async () => {
    try {
      setIsLoading(true);
      await startChatSession();
      setMessages([
        { remitente: 'asistente', contenido: '¡Hola! Soy Salomé, el asistente virtual de Café Cato. ¿En qué te puedo ayudar hoy? Puedes preguntarme sobre nuestro menú, cómo adoptar un gatito, o cómo radicar una PQR.' }
      ]);
    } catch (error) {
      setMessages([{ remitente: 'asistente', contenido: 'Hola, actualmente estoy teniendo problemas de conexión. Por favor, intenta más tarde.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { remitente: 'usuario', contenido: userMsg }]);
    
    setIsLoading(true);
    try {
      const response = await sendChatMessage({ message: userMsg });
      setMessages(prev => [...prev, { remitente: 'asistente', contenido: response.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { remitente: 'asistente', contenido: 'Lo siento, tuve un problema procesando tu mensaje. ¿Puedes intentarlo de nuevo?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante para abrir el Chatbot */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'var(--brand-color)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <img src={chatbotIcon} alt="Chatbot" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        </button>
      )}

      {/* Ventana del Chatbot */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '350px',
          height: '500px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Cabecera */}
          <div style={{
            backgroundColor: 'var(--brand-color)',
            color: '#fff',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src={chatbotIcon} alt="Bot" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '1.1rem' }}>Asistente Salomé</strong>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>IA de Soporte</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Área de Mensajes */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            backgroundColor: '#f9f9f9',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                gap: '0.5rem',
                alignSelf: msg.remitente === 'usuario' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}>
                {msg.remitente === 'asistente' && (
                  <img src={chatbotIcon} alt="Bot" style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, objectFit: 'cover', border: '2px solid var(--brand-color)' }} />
                )}
                <div style={{
                  backgroundColor: msg.remitente === 'usuario' ? '#d39c6b' : '#fff',
                  color: msg.remitente === 'usuario' ? '#fff' : 'var(--text-main)',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  borderBottomRightRadius: msg.remitente === 'usuario' ? 0 : '12px',
                  borderBottomLeftRadius: msg.remitente === 'asistente' ? 0 : '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  fontSize: '0.9rem',
                  lineHeight: '1.4'
                }}>
                  {msg.contenido}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-start' }}>
                <img src={chatbotIcon} alt="Bot" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-color)' }} />
                <div style={{ backgroundColor: '#fff', padding: '0.75rem 1rem', borderRadius: '12px', borderBottomLeftRadius: 0, color: '#999', fontSize: '0.9rem' }}>
                  Escribiendo...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de Entrada */}
          <form onSubmit={handleSend} style={{
            display: 'flex',
            padding: '0.75rem',
            borderTop: '1px solid #eee',
            backgroundColor: '#fff',
            gap: '0.5rem'
          }}>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe tu mensaje..."
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '20px',
                border: '1px solid #ddd',
                outline: 'none'
              }}
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={isLoading || !inputText.trim()}
              style={{
                backgroundColor: (isLoading || !inputText.trim()) ? '#ccc' : 'var(--brand-color)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: (isLoading || !inputText.trim()) ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <Send size={18} style={{ marginLeft: '2px' }} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
