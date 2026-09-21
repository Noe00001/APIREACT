"""
tasks.py — Tareas en segundo plano (BackgroundTasks) no bloqueantes (Criterio 6).
Permite ejecutar procesos asíncronos como registros de auditoría y notificaciones sin demorar las respuestas HTTP.
"""
import logging
from app.database import SessionLocal
from app.models.models import AuditoriaLog

logger = logging.getLogger("cafe_cato.tasks")


def log_auditoria_task(accion: str, recurso: str, recurso_id: int = None, usuario_email: str = None, detalles: str = ""):
    """
    Tarea en segundo plano: Almacena un evento de auditoría en la base de datos
    de manera completamente no bloqueante.
    """
    try:
        with SessionLocal() as db:
            nuevo_log = AuditoriaLog(
                accion=accion,
                recurso=recurso,
                recurso_id=recurso_id,
                usuario_email=usuario_email,
                detalles=detalles,
            )
            db.add(nuevo_log)
            db.commit()
            logger.info("Auditoría registrada en segundo plano: [%s] sobre %s (%s)", accion, recurso, usuario_email)
    except Exception as exc:
        logger.error("Error al registrar auditoría en segundo plano: %s", str(exc))


def send_welcome_email_task(email: str, nombre: str):
    """
    Tarea en segundo plano: Simula el envío de correo de bienvenida al registrarse.
    No bloquea la petición de registro del usuario.
    """
    logger.info(
        "📧 [EMAIL SIMULADO] Enviando mensaje de bienvenida a %s <%s>: "
        "'¡Bienvenido a Café Cato! Disfruta de la mejor experiencia de café y compañía felina.'",
        nombre, email
    )
