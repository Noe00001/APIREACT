"""
pqr.py — Controlador REST de FastAPI para la Gestión de Peticiones, Quejas y Reclamos (PQR).
Café Salomé / Café Cato.
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.models import Usuario, PQR
from app.views.schemas import PQRCreate, PQRRespuesta, PQROut
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/pqr", tags=["PQR"])


def _generar_radicado(db: Session) -> str:
    count = db.query(PQR).count() + 1
    return f"PQR-{datetime.now().year}-{count:04d}"


def _map_pqr_out(p: PQR) -> dict:
    return {
        "id": p.id,
        "radicado": p.radicado,
        "cliente_id": p.cliente_id,
        "cliente_nombre": f"{p.cliente.nombre} {p.cliente.apellido}" if p.cliente else "Anónimo",
        "cliente_email": p.cliente.email if p.cliente else None,
        "tipo": p.tipo,
        "asunto": p.asunto,
        "descripcion": p.descripcion,
        "estado": p.estado,
        "respuesta": p.respuesta,
        "respondido_por": p.respondido_por,
        "respondido_por_nombre": f"{p.operador_respuesta.nombre} {p.operador_respuesta.apellido}" if p.operador_respuesta else None,
        "fecha_creacion": p.fecha_creacion,
        "fecha_respuesta": p.fecha_respuesta,
    }


@router.post("/", response_model=PQROut, status_code=status.HTTP_201_CREATED, summary="Radicar una nueva solicitud PQR")
def crear_pqr(
    datos: PQRCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Permite al cliente autenticado registrar una nueva PQR en el sistema."""
    radicado = _generar_radicado(db)
    nueva_pqr = PQR(
        radicado=radicado,
        cliente_id=current_user.id,
        tipo=datos.tipo,
        asunto=datos.asunto,
        descripcion=datos.descripcion,
        estado="Pendiente"
    )
    db.add(nueva_pqr)
    db.commit()
    db.refresh(nueva_pqr)
    return _map_pqr_out(nueva_pqr)


@router.get("/", response_model=List[PQROut], summary="Listar solicitudes PQR")
def listar_pqrs(
    estado: Optional[str] = Query(None, description="Pendiente, En Proceso, Respondida, Cerrada"),
    tipo: Optional[str] = Query(None, description="Peticion, Queja, Reclamo, Sugerencia"),
    search: Optional[str] = Query(None, description="Buscar por radicado o asunto"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Listar PQRs según rol:
    - Cliente: únicamente visualiza sus propias PQRs radicadas.
    - Administrador y Empleado: visualizan todas las PQRs y pueden aplicar filtros.
    """
    query = db.query(PQR).order_by(desc(PQR.fecha_creacion))

    if current_user.rol.nombre == "Cliente":
        query = query.filter(PQR.cliente_id == current_user.id)

    if estado:
        query = query.filter(PQR.estado == estado)

    if tipo:
        query = query.filter(PQR.tipo == tipo)

    if search:
        s = f"%{search}%"
        query = query.filter((PQR.radicado.ilike(s)) | (PQR.asunto.ilike(s)))

    pqrs = query.all()
    return [_map_pqr_out(p) for p in pqrs]


@router.get("/{pqr_id}", response_model=PQROut, summary="Consultar detalle de una PQR")
def obtener_pqr(
    pqr_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    pqr = db.query(PQR).filter(PQR.id == pqr_id).first()
    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrada")

    if current_user.rol.nombre == "Cliente" and pqr.cliente_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes autorización para ver esta PQR")

    return _map_pqr_out(pqr)


@router.patch("/{pqr_id}/responder", response_model=PQROut, summary="Responder y actualizar estado de PQR")
def responder_pqr(
    pqr_id: int,
    datos: PQRRespuesta,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
):
    """Permite a los administradores o empleados dar respuesta formal a la PQR."""
    pqr = db.query(PQR).filter(PQR.id == pqr_id).first()
    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrada")

    pqr.respuesta = datos.respuesta
    pqr.estado = datos.estado or "Respondida"
    pqr.respondido_por = current_user.id
    pqr.fecha_respuesta = datetime.now()

    db.commit()
    db.refresh(pqr)
    return _map_pqr_out(pqr)
