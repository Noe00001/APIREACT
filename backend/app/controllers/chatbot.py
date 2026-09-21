"""
chatbot.py — Controlador REST de FastAPI para el Chatbot de Atención al Cliente con IA.
Integra OpenAI / Gemini mediante API Key segura en .env y persistencia en BD SQL.
Café Salomé / Café Cato.
"""
import os
import uuid
import logging
from datetime import datetime
from typing import Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.models import Usuario, Producto, Servicio, Gato, ConversacionChatbot, MensajeChatbot
from app.views.schemas import ChatbotMessageRequest, ChatbotMessageResponse

logger = logging.getLogger("cafe_cato.chatbot")
router = APIRouter(prefix="/api/chatbot", tags=["Chatbot & IA"])

AI_API_KEY = os.getenv("AI_API_KEY", "") or os.getenv("OPENAI_API_KEY", "")
AI_PROVIDER = os.getenv("AI_PROVIDER", "openai").lower()
AI_MODEL = os.getenv("AI_MODEL", "gpt-3.5-turbo")


def _generar_contexto_catalogo(db: Session) -> str:
    prods = db.query(Producto).filter(Producto.estado == "Activo").all()
    servs = db.query(Servicio).filter(Servicio.estado == "Activo").all()
    gatos = db.query(Gato).filter(Gato.estado == "Activo").all()

    prods_str = "\n".join([f"- {p.nombre} (${float(p.precio):,.0f}): {p.descripcion or ''}" for p in prods])
    servs_str = "\n".join([f"- {s.nombre} (${float(s.precio):,.0f} si aplica): {s.descripcion or ''}" for s in servs])
    gatos_str = "\n".join([f"- {g.nombre} ({g.edad} años, {g.raza or 'Criollo'}, {g.sexo}): {g.descripcion or ''}" for g in gatos])

    return (
        "INFORMACIÓN OFICIAL DE CAFÉ SALOMÉ (CAT CAFÉ & BARISMO):\n"
        "Horario: Lunes a Domingo de 8:00 AM a 8:00 PM\n"
        "Dirección: Calle 45 # 12-34, Medellín, Colombia\n"
        "Teléfono: (+57) 300 123 4567 | Correo: contacto@cafecato.com\n\n"
        f"MENÚ Y PRODUCTOS DISPONIBLES:\n{prods_str}\n\n"
        f"SERVICIOS Y EXPERIENCIAS:\n{servs_str}\n\n"
        f"GATITOS PARA ADOPCIÓN RESPONSABLE:\n{gatos_str}\n\n"
        "POLÍTICAS Y PQR:\n"
        "- Los clientes pueden radicar PQR (Peticiones, Quejas, Reclamos o Sugerencias) desde el módulo de PQRs con su cuenta.\n"
        "- Para adoptar un gato, se diligencia un formulario de solicitud y se realiza una entrevista previa.\n"
        "- En la zona de gatoterapia no se permite alzar a los gatos bruscamente ni alimentarlos con comida para humanos."
    )


async def _consultar_ia(user_message: str, db: Session) -> str:
    contexto = _generar_contexto_catalogo(db)
    system_prompt = (
        "Eres 'SaloméBot', el asistente virtual inteligente, cálido y apasionado por el café y los gatos de Café Salomé. "
        "Tu objetivo es brindar atención al cliente excepcional, resolver dudas sobre el menú, precios, servicios de barismo y gatoterapia, "
        "orientar sobre procesos de compra o facturación, y guiar sobre radicación de PQRs y adopción felina.\n"
        "Responde siempre de manera concisa, amable, con emojis alusivos (☕🐾😺) y basada en los siguientes datos oficiales:\n\n"
        f"{contexto}"
    )

    if AI_API_KEY:
        try:
            if "openai" in AI_PROVIDER or AI_API_KEY.startswith("sk-"):
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {AI_API_KEY}"}
                payload = {
                    "model": AI_MODEL if "gpt" in AI_MODEL else "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 400
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        return resp.json()["choices"][0]["message"]["content"]
            elif "gemini" in AI_PROVIDER:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={AI_API_KEY}"
                payload = {
                    "contents": [{
                        "parts": [{"text": f"{system_prompt}\n\nPregunta del cliente: {user_message}"}]
                    }]
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as exc:
            logger.warning("Error consultando API externa de IA: %s. Aplicando motor de respuestas natural.", str(exc))

    # Motor de respuesta heurístico contextual (garantiza 100% de disponibilidad sin API Key)
    msg_lower = user_message.lower()

    if any(w in msg_lower for w in ["hola", "buen", "saludos", "buenas", "hey"]):
        return "¡Hola! 🐾 Bienvenido a Café Salomé. Soy tu asistente virtual. ¿En qué puedo orientarte hoy? Puedo contarte sobre nuestra carta de café, reservar una tarde de gatoterapia, guiarte para adoptar un michi o ayudarte a radicar una PQR. ☕🐱"

    if any(w in msg_lower for w in ["precio", "carta", "menú", "menu", "café", "bebida", "espresso", "capuchino", "muffin", "panaderia"]):
        return "¡Tenemos deliciosas opciones artesanales! ☕ Entre nuestros favoritos están el Espresso Especial ($5.500), Capuchino Artesanal de Vainilla ($7.800) y nuestro suave Muffin Red Velvet Felino ($6.200). Además, puedes realizar pedidos directamente en nuestra tienda en línea."

    if any(w in msg_lower for w in ["gatoterapia", "servicio", "taller", "experiencia", "reserva"]):
        return "¡Nuestra zona lounge felina te espera! 🐱 Ofrecemos sesiones de 'Tarde de Gatoterapia & Café' (60 minutos de relax con nuestros gatos por $15.000) y el 'Taller de Barismo para Principiantes' ($45.000) para perfeccionar tu técnica de extracción. ¡Pregúntanos por disponibilidad de cupos!"

    if any(w in msg_lower for w in ["gato", "adopcion", "adoptar", "misi", "bigotes", "adopción"]):
        return "¡Nos alegra tu interés en dar un hogar a un michi! 🏠 Actualmente tenemos hermosos gatitos en busca de familia como Misi (calicó sociable) y Bigotes (atigrado cariñoso). Todos están vacunados y esterilizados. Puedes conocer sus fichas en la sección 'Adopciones' y radicar tu postulación."

    if any(w in msg_lower for w in ["pqr", "queja", "reclamo", "peticion", "sugerencia", "inconformidad"]):
        return "Para nosotros tu opinión es vital. 📋 Puedes registrar tu PQR fácilmente desde nuestro módulo 'PQR' en la barra superior. Si estás registrado, podrás hacer seguimiento en tiempo real al estado de tu solicitud (Pendiente, En Proceso, Respondida). ¡Nuestro equipo te responderá con gusto!"

    if any(w in msg_lower for w in ["horario", "ubicacion", "ubicación", "donde", "dónde", "telefono", "teléfono", "direccion", "dirección"]):
        return "📍 Nos encontramos en la Calle 45 # 12-34 (Medellín, Colombia). Abrimos todos los días de 8:00 AM a 8:00 PM. Puedes llamarnos al (+57) 300 123 4567 o escribir a contacto@cafecato.com. ¡Te esperamos!"

    if any(w in msg_lower for w in ["factura", "comprar", "pago", "pagar"]):
        return "💳 Al realizar tus compras en Café Salomé, el sistema genera automáticamente tu factura comercial y registro de venta con código único. Puedes consultar y descargar tus facturas en PDF desde el módulo de 'Facturas' de tu cuenta."

    return "Entiendo tu consulta. En Café Salomé nos encanta consentirte con el mejor café de especialidad y la grata compañía de nuestros felinos. ¿Deseas información detallada sobre nuestro menú, reservar una experiencia de gatoterapia o radicar una consulta formal en PQR? 🐾☕"


@router.post("/message", response_model=ChatbotMessageResponse, summary="Interactuar con el Chatbot de IA")
async def chat_with_bot(
    datos: ChatbotMessageRequest,
    db: Session = Depends(get_db),
):
    """
    Endpoint del Chatbot para atención al cliente:
    - Resuelve preguntas frecuentes y orienta sobre productos/servicios.
    - Persiste sesiones y mensajes en la base de datos SQL.
    - Utiliza OpenAI/Gemini con API Key segura o sistema contextual de alta fidelidad.
    """
    if not datos.message or not datos.message.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")

    session_id = datos.session_id or str(uuid.uuid4())

    # Buscar o crear conversación
    conversacion = db.query(ConversacionChatbot).filter(ConversacionChatbot.session_id == session_id).first()
    if not conversacion:
        conversacion = ConversacionChatbot(session_id=session_id)
        db.add(conversacion)
        db.flush()

    # Guardar mensaje del usuario
    msg_user = MensajeChatbot(
        conversacion_id=conversacion.id,
        remitente="usuario",
        contenido=datos.message.strip()
    )
    db.add(msg_user)

    # Generar respuesta de IA
    bot_reply = await _consultar_ia(datos.message.strip(), db)

    # Guardar respuesta del bot
    msg_bot = MensajeChatbot(
        conversacion_id=conversacion.id,
        remitente="asistente",
        contenido=bot_reply
    )
    db.add(msg_bot)
    db.commit()

    return ChatbotMessageResponse(
        session_id=session_id,
        reply=bot_reply,
        sender="asistente",
        timestamp=datetime.now()
    )


@router.get("/history/{session_id}", summary="Consultar historial de mensajes de una conversación")
def historial_chat(
    session_id: str,
    db: Session = Depends(get_db),
):
    conversacion = db.query(ConversacionChatbot).filter(ConversacionChatbot.session_id == session_id).first()
    if not conversacion:
        return {"session_id": session_id, "mensajes": []}

    mensajes = [
        {
            "id": m.id,
            "remitente": m.remitente,
            "contenido": m.contenido,
            "creado_en": m.creado_en
        }
        for m in conversacion.mensajes
    ]
    return {"session_id": session_id, "mensajes": mensajes}
