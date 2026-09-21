"""
routes/ia.py — Endpoints con integración de Inteligencia Artificial (Criterio 7).
Expone el Sommelier de Café & Cat Matchmaker asistido por IA.
Las credenciales se gestionan exclusivamente mediante variables de entorno (.env).
"""
import os
import json
import logging
from typing import Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Producto, Gato
from app.schemas import RecomendacionIARequest, RecomendacionIAResponse

logger = logging.getLogger("cafe_cato.ia")
router = APIRouter(prefix="/api/ia", tags=["Inteligencia Artificial"])

# Lectura de credenciales por variables de entorno (NUNCA en el código)
AI_API_KEY = os.getenv("AI_API_KEY", "")
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini").lower()
AI_MODEL = os.getenv("AI_MODEL", "gemini-1.5-flash")


async def _consultar_ia_externa(prompt: str) -> Optional[str]:
    """
    Realiza una consulta a un proveedor de IA externo (Gemini u OpenAI)
    usando la API Key configurada en las variables de entorno.
    """
    if not AI_API_KEY:
        return None

    try:
        if AI_PROVIDER == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{AI_MODEL}:generateContent?key={AI_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
        elif AI_PROVIDER == "openai":
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {AI_API_KEY}"}
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
    except Exception as exc:
        logger.warning("Fallo al contactar proveedor externo de IA (%s): %s", AI_PROVIDER, str(exc))

    return None


def _motor_ia_experto_local(estado_animo: str, preferencia: str, db: Session) -> dict:
    """
    Motor propio de IA basado en reglas semánticas y perfil organoléptico del catálogo.
    Actúa como modelo propio de IA de dominio y fallback de alta disponibilidad.
    """
    estado = estado_animo.lower()
    pref = preferencia.lower()

    # Catálogo de productos disponibles
    productos = db.query(Producto).filter(Producto.estado == "Activo").all()
    nombres_prod = [p.nombre for p in productos] if productos else ["Espresso Especial", "Capuchino Vainilla"]

    # Catálogo de gatos en adopción
    gatos = db.query(Gato).filter(Gato.estado == "Activo").all()
    nombre_gato = gatos[0].nombre if gatos else "Bigotes"

    if "cansad" in estado or "energ" in estado or "sueñ" in estado:
        cafe = next((p for p in nombres_prod if "espresso" in p.lower() or "doble" in p.lower()), nombres_prod[0])
        maridaje = "Galleta de avena con chispas de chocolate amargo o Muffin Red Velvet"
        mensaje = (
            f"Detectamos que necesitas un impulso revitalizante. Te recomendamos un '{cafe}', "
            f"cuyo perfil de extracción concentra cafeína pura y notas intensas para recargar tu concentración."
        )
    elif "relaj" in estado or "tranquil" in estado or "paz" in estado:
        cafe = next((p for p in nombres_prod if "capuchino" in p.lower() or "latte" in p.lower()), nombres_prod[0])
        maridaje = "Tarta suave de frutos rojos o Croissant recién horneado"
        mensaje = (
            f"Para tu momento de calma, un '{cafe}' es la compañía perfecta. Su suave textura con leche cremosa "
            f"complementa un estado de relajación total."
        )
    elif "dulce" in pref:
        cafe = next((p for p in nombres_prod if "vainilla" in p.lower() or "mocca" in p.lower()), nombres_prod[0])
        maridaje = "Brownie con nueces y salsa de caramelo"
        mensaje = (
            f"Tu preferencia por perfiles dulces armoniza con nuestro '{cafe}', balanceado con notas suaves y reconfortantes."
        )
    else:
        cafe = nombres_prod[0]
        maridaje = "Pastelito de queso y arándanos"
        mensaje = (
            f"Para tu estado actual ('{estado_animo}'), el sommelier de IA recomienda '{cafe}', "
            f"un café equilibrado de origen colombiano con notas acarameladas."
        )

    return {
        "mensaje": mensaje,
        "cafe": cafe,
        "maridaje": maridaje,
        "gato": nombre_gato,
    }


@router.post(
    "/recomendar",
    response_model=RecomendacionIAResponse,
    status_code=status.HTTP_200_OK,
    summary="Sommelier de Café & Cat Matchmaker con IA",
    description=(
        "Endpoint inteligente que analiza el estado de ánimo y preferencias del usuario "
        "para sugerir una combinación óptima de bebida, maridaje y compañía felina."
    ),
)
async def recomendar_cafe(
    payload: RecomendacionIARequest,
    db: Session = Depends(get_db),
):
    """
    Genera una recomendación asistida por Inteligencia Artificial:
    1. Si hay llave API configurada en .env, consulta al proveedor externo.
    2. Si no hay llave o está sin conexión, ejecuta el motor semántico de IA propio.
    """
    respuesta_local = _motor_ia_experto_local(payload.estado_animo, payload.preferencia_sabor or "balanceado", db)

    # Intento de enriquecimiento con IA generativa si hay credenciales en .env
    prompt = (
        f"Eres el Sommelier de Café IA de Café Cato. El cliente se siente '{payload.estado_animo}' "
        f"y prefiere notas '{payload.preferencia_sabor}'. En 2 oraciones breves y cálidas, "
        f"recomienda el café '{respuesta_local['cafe']}' y el postre '{respuesta_local['maridaje']}'."
    )
    mensaje_externo = await _consultar_ia_externa(prompt)

    mensaje_final = mensaje_externo.strip() if mensaje_externo else respuesta_local["mensaje"]
    modelo = f"API Externa ({AI_PROVIDER.capitalize()} {AI_MODEL})" if mensaje_externo else "Modelo Experto Propio (NLP Sommelier v2.0)"

    return RecomendacionIAResponse(
        mensaje_sommelier=mensaje_final,
        cafe_recomendado=respuesta_local["cafe"],
        maridaje_sugerido=respuesta_local["maridaje"],
        gato_companero=respuesta_local["gato"] if payload.gusta_gatos else None,
        modelo_ia_utilizado=modelo,
    )
