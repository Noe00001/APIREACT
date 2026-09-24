"""
reservas.py — Controlador REST de FastAPI para la Gestión de Reservas y Contacto.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.models import ReservaContacto, Usuario
from app.views.schemas import ReservaContactoCreate, ReservaContactoOut, ReservaContactoUpdateStatus
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/reservas", tags=["Reservas y Contacto"])


@router.post("/", response_model=ReservaContactoOut, status_code=status.HTTP_201_CREATED, summary="Registrar nueva reserva o mensaje de contacto")
def crear_reserva(
    datos: ReservaContactoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Endpoint protegido para que los clientes envíen solicitudes de reserva, adopción, eventos o consultas
    desde la página de contacto.
    """
    nueva_reserva = ReservaContacto(
        nombre=f"{current_user.nombre} {current_user.apellido}",
        email=current_user.email,
        telefono=datos.telefono,
        motivo=datos.motivo,
        personas=datos.personas,
        fecha_tentativa=datos.fecha_tentativa,
        mensaje=datos.mensaje,
        estado="Pendiente"
    )
    db.add(nueva_reserva)
    db.commit()
    db.refresh(nueva_reserva)
    return nueva_reserva


@router.get("/", response_model=List[ReservaContactoOut], summary="Listar solicitudes de contacto y reservas")
def listar_reservas(
    estado: Optional[str] = Query(None, description="Filtrar por estado (Pendiente, Contactado, Confirmada, Cancelada)"),
    motivo: Optional[str] = Query(None, description="Filtrar por motivo"),
    search: Optional[str] = Query(None, description="Buscar por nombre o email"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Lista todas las reservas y mensajes. 
    Administradores y Empleados ven todo. Clientes solo ven las asociadas a su email.
    """
    query = db.query(ReservaContacto).order_by(desc(ReservaContacto.creado_en))

    if current_user.rol.nombre == "Cliente":
        query = query.filter(ReservaContacto.email == current_user.email)

    if estado:
        query = query.filter(ReservaContacto.estado == estado)
    
    if motivo:
        query = query.filter(ReservaContacto.motivo == motivo)

    if search:
        s = f"%{search}%"
        query = query.filter((ReservaContacto.nombre.ilike(s)) | (ReservaContacto.email.ilike(s)))

    return query.all()


@router.patch("/{reserva_id}/estado", response_model=ReservaContactoOut, summary="Actualizar estado de una reserva")
def actualizar_estado_reserva(
    reserva_id: int,
    datos: ReservaContactoUpdateStatus,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
):
    """
    Permite a los administradores o empleados cambiar el estado de una solicitud.
    """
    reserva = db.query(ReservaContacto).filter(ReservaContacto.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva o solicitud no encontrada")

    if datos.estado:
        reserva.estado = datos.estado
    if datos.respuesta is not None:
        reserva.respuesta = datos.respuesta
        
    db.commit()
    db.refresh(reserva)
    return reserva
