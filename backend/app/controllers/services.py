"""
routes/services.py — CRUD completo de servicios de cafetería y cat café.
Público: GET /api/servicios, GET /api/servicios/{service_id}
Admin: GET /api/servicios/admin, POST, PUT, DELETE, PATCH
Cumple Criterios 1 (REST, Annotated, Path, Query), 2 (Pydantic v2) y 6 (async, BackgroundTasks).
"""
from typing import Annotated, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Servicio, Usuario
from app.views.schemas import ServicioCreate, ServicioUpdate, ServicioOut, StatusUpdate
from app.auth import require_role, get_current_user
from app.tasks import log_auditoria_task

router = APIRouter(prefix="/api/servicios", tags=["Servicios"])

ADMIN = require_role("Administrador")


def _serialize(s: Servicio) -> dict:
    return {
        "id": s.id,
        "nombre": s.nombre,
        "descripcion": s.descripcion,
        "precio": float(s.precio) if s.precio is not None else None,
        "stock": s.stock,
        "imagen": s.imagen,
        "estado": s.estado,
    }


@router.get(
    "",
    response_model=List[ServicioOut],
    status_code=status.HTTP_200_OK,
    summary="Listar servicios activos (Público)",
)
async def get_services(
    db: Session = Depends(get_db),
    search: Annotated[Optional[str], Query(description="Filtrar servicios por término")] = None,
):
    query = db.query(Servicio).filter(Servicio.estado == "Activo")
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Servicio.nombre.ilike(s)) | (Servicio.descripcion.ilike(s)))
    servicios = query.order_by(Servicio.id.desc()).all()
    return [_serialize(s) for s in servicios]


@router.get(
    "/admin",
    response_model=List[ServicioOut],
    status_code=status.HTTP_200_OK,
    summary="Listar todos los servicios (Solo Admin)",
)
async def get_services_admin(
    db: Session = Depends(get_db),
    _: Usuario = Depends(ADMIN),
):
    servicios = db.query(Servicio).order_by(Servicio.id.desc()).all()
    return [_serialize(s) for s in servicios]


@router.get(
    "/{service_id}",
    response_model=ServicioOut,
    status_code=status.HTTP_200_OK,
    summary="Consultar servicio por ID (Público)",
)
async def get_service(
    service_id: Annotated[int, Path(..., ge=1, description="ID del servicio")],
    db: Session = Depends(get_db),
):
    servicio = (
        db.query(Servicio)
        .filter(Servicio.id == service_id, Servicio.estado == "Activo")
        .first()
    )
    if not servicio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado")
    return _serialize(servicio)


@router.post(
    "",
    response_model=ServicioOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear servicio (Solo Admin)",
)
async def create_service(
    payload: ServicioCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    servicio = Servicio(
        nombre=payload.nombre.strip(),
        descripcion=payload.descripcion.strip() if payload.descripcion else None,
        precio=payload.precio,
        stock=payload.stock,
        imagen=payload.imagen or None,
        estado="Activo",
        creado_por=current_admin.id,
    )
    db.add(servicio)
    db.commit()
    db.refresh(servicio)

    background_tasks.add_task(
        log_auditoria_task,
        "CREAR_SERVICIO",
        "servicios",
        servicio.id,
        current_admin.email,
        f"Servicio '{servicio.nombre}' creado",
    )
    return _serialize(servicio)


@router.put(
    "/{service_id}",
    response_model=ServicioOut,
    status_code=status.HTTP_200_OK,
    summary="Actualizar servicio (Solo Admin)",
)
async def update_service(
    service_id: Annotated[int, Path(..., ge=1, description="ID del servicio")],
    payload: ServicioUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    servicio = db.query(Servicio).filter(Servicio.id == service_id).first()
    if not servicio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado")

    servicio.nombre = payload.nombre.strip()
    servicio.descripcion = payload.descripcion.strip() if payload.descripcion else None
    servicio.precio = payload.precio
    if payload.stock is not None:
        servicio.stock = payload.stock
    servicio.estado = payload.estado
    if "imagen" in payload.model_fields_set:
        servicio.imagen = payload.imagen.strip() if (payload.imagen and payload.imagen.strip()) else None
    db.commit()
    db.refresh(servicio)

    background_tasks.add_task(
        log_auditoria_task,
        "ACTUALIZAR_SERVICIO",
        "servicios",
        servicio.id,
        current_admin.email,
        f"Servicio '{servicio.nombre}' actualizado",
    )
    return _serialize(servicio)


@router.delete(
    "/{service_id}",
    status_code=status.HTTP_200_OK,
    summary="Desactivar o eliminar servicio (Solo Admin)",
)
async def delete_service(
    service_id: Annotated[int, Path(..., ge=1, description="ID del servicio")],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    servicio = db.query(Servicio).filter(Servicio.id == service_id).first()
    if not servicio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado")

    # Desvincular de ventas antes de eliminar para evitar error de integridad
    from app.models.models import DetalleVenta
    db.query(DetalleVenta).filter(DetalleVenta.servicio_id == service_id).update({"servicio_id": None})
    
    db.delete(servicio)
    db.commit()

    background_tasks.add_task(
        log_auditoria_task,
        "ELIMINAR_SERVICIO",
        "servicios",
        service_id,
        current_admin.email,
        "Servicio eliminado permanentemente de la base de datos",
    )
    return {"message": "Servicio eliminado exitosamente"}


@router.patch(
    "/{service_id}/status",
    status_code=status.HTTP_200_OK,
    summary="Cambiar estado del servicio (Solo Admin)",
)
async def toggle_service_status(
    service_id: Annotated[int, Path(..., ge=1, description="ID del servicio")],
    payload: StatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    servicio = db.query(Servicio).filter(Servicio.id == service_id).first()
    if not servicio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado")

    servicio.estado = payload.estado
    db.commit()

    background_tasks.add_task(
        log_auditoria_task,
        "CAMBIO_ESTADO_SERVICIO",
        "servicios",
        servicio.id,
        current_admin.email,
        f"Estado: {payload.estado}",
    )
    return {"message": "Estado del servicio actualizado", "estado": servicio.estado}
