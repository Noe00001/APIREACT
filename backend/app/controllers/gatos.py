"""
routes/gatos.py — CRUD completo de gatos en adopción para el Cat Café.
Público: GET /api/gatos, GET /api/gatos/{gato_id}
Admin: GET /api/gatos/admin, POST, PUT, DELETE, PATCH
Cumple Criterios 1 (REST, Annotated, Path, Query), 2 (Pydantic v2) y 6 (async, BackgroundTasks).
"""
from typing import Annotated, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Gato, Usuario
from app.views.schemas import GatoCreate, GatoUpdate, GatoOut, GatoStatusUpdate
from app.auth import require_role, get_current_user
from app.tasks import log_auditoria_task

router = APIRouter(prefix="/api/gatos", tags=["Gatos"])

ADMIN = require_role("Administrador")


def _serialize(g: Gato) -> dict:
    return {
        "id": g.id,
        "nombre": g.nombre,
        "descripcion": g.descripcion,
        "edad": g.edad,
        "raza": g.raza,
        "sexo": g.sexo,
        "color": g.color,
        "peso": float(g.peso) if g.peso is not None else None,
        "esterilizado": bool(g.esterilizado),
        "vacunado": bool(g.vacunado),
        "imagen": g.imagen,
        "estado": g.estado,
        "creado_en": g.creado_en.isoformat() if g.creado_en else None,
    }


@router.get(
    "",
    response_model=List[GatoOut],
    status_code=status.HTTP_200_OK,
    summary="Listar gatos activos en adopción (Público)",
)
async def get_gatos(
    db: Session = Depends(get_db),
    sexo: Annotated[Optional[str], Query(description="Filtrar por sexo (Macho/Hembra)")] = None,
    esterilizado: Annotated[Optional[bool], Query(description="Filtrar por estado de esterilización")] = None,
    search: Annotated[Optional[str], Query(description="Búsqueda por nombre o raza")] = None,
):
    query = db.query(Gato).filter(Gato.estado == "Activo")
    if sexo:
        query = query.filter(Gato.sexo.ilike(f"{sexo.strip()}%"))
    if esterilizado is not None:
        query = query.filter(Gato.esterilizado == esterilizado)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Gato.nombre.ilike(s)) | (Gato.raza.ilike(s)))

    gatos = query.order_by(Gato.creado_en.desc()).all()
    return [_serialize(g) for g in gatos]


@router.get(
    "/admin",
    response_model=List[GatoOut],
    status_code=status.HTTP_200_OK,
    summary="Listar todos los gatos (Solo Admin)",
)
async def get_gatos_admin(
    db: Session = Depends(get_db),
    _: Usuario = Depends(ADMIN),
):
    gatos = db.query(Gato).order_by(Gato.creado_en.desc()).all()
    return [_serialize(g) for g in gatos]


@router.get(
    "/{gato_id}",
    response_model=GatoOut,
    status_code=status.HTTP_200_OK,
    summary="Consultar gato por ID (Público)",
)
async def get_gato(
    gato_id: Annotated[int, Path(..., ge=1, description="ID del gato")],
    db: Session = Depends(get_db),
):
    gato = (
        db.query(Gato)
        .filter(Gato.id == gato_id, Gato.estado == "Activo")
        .first()
    )
    if not gato:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gato no encontrado")
    return _serialize(gato)


@router.post(
    "",
    response_model=GatoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo gato en adopción (Solo Admin)",
)
async def create_gato(
    payload: GatoCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    gato = Gato(
        nombre=payload.nombre.strip(),
        descripcion=payload.descripcion.strip() if payload.descripcion else None,
        edad=payload.edad,
        raza=payload.raza.strip() if payload.raza else None,
        sexo=payload.sexo,
        color=payload.color.strip() if payload.color else None,
        peso=payload.peso,
        esterilizado=payload.esterilizado,
        vacunado=payload.vacunado,
        imagen=payload.imagen or None,
        estado="Activo",
        creado_por=current_admin.id,
    )
    db.add(gato)
    db.commit()
    db.refresh(gato)

    background_tasks.add_task(
        log_auditoria_task,
        "CREAR_GATO",
        "gatos",
        gato.id,
        current_admin.email,
        f"Gato '{gato.nombre}' ingresado al catálogo de adopción",
    )
    return _serialize(gato)


@router.put(
    "/{gato_id}",
    response_model=GatoOut,
    status_code=status.HTTP_200_OK,
    summary="Actualizar información del gato (Solo Admin)",
)
async def update_gato(
    gato_id: Annotated[int, Path(..., ge=1, description="ID del gato")],
    payload: GatoUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    gato = db.query(Gato).filter(Gato.id == gato_id).first()
    if not gato:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gato no encontrado")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(gato, field, value)

    db.commit()
    db.refresh(gato)

    background_tasks.add_task(
        log_auditoria_task,
        "ACTUALIZAR_GATO",
        "gatos",
        gato.id,
        current_admin.email,
        f"Gato '{gato.nombre}' actualizado",
    )
    return _serialize(gato)


@router.patch(
    "/{gato_id}/status",
    response_model=GatoOut,
    status_code=status.HTTP_200_OK,
    summary="Cambiar estado del gato (Activo/Inactivo)",
)
async def update_gato_status(
    gato_id: Annotated[int, Path(..., ge=1, description="ID del gato")],
    payload: GatoStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    gato = db.query(Gato).filter(Gato.id == gato_id).first()
    if not gato:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gato no encontrado")

    gato.estado = payload.estado
    db.commit()
    db.refresh(gato)

    background_tasks.add_task(
        log_auditoria_task,
        "CAMBIO_ESTADO_GATO",
        "gatos",
        gato.id,
        current_admin.email,
        f"Estado: {payload.estado}",
    )
    return _serialize(gato)


@router.delete(
    "/{gato_id}",
    status_code=status.HTTP_200_OK,
    summary="Eliminar gato del sistema (Solo Admin)",
)
async def delete_gato(
    gato_id: Annotated[int, Path(..., ge=1, description="ID del gato")],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    gato = db.query(Gato).filter(Gato.id == gato_id).first()
    if not gato:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gato no encontrado")

    db.delete(gato)
    db.commit()

    background_tasks.add_task(
        log_auditoria_task,
        "ELIMINAR_GATO",
        "gatos",
        gato_id,
        current_admin.email,
        "Gato eliminado de la base de datos",
    )
    return {"message": "Gato eliminado correctamente"}
