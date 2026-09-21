"""
routes/users.py — Gestión y CRUD de usuarios del sistema.
Cumple Criterios 1 (REST, Annotated, Path, Query), 2 (Pydantic v2), 4 (Roles) y 6 (async/await, BackgroundTasks).
"""
from typing import Annotated, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario, Rol
from app.schemas import UsuarioOut, UsuarioCreate, UsuarioUpdate, StatusUpdate, RegisterRequest
from app.auth import hash_password, require_role, get_current_user
from app.tasks import log_auditoria_task, send_welcome_email_task

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])

ADMIN = require_role("Administrador")


def _serialize(user: Usuario) -> dict:
    return {
        "id": user.id,
        "nombre": user.nombre,
        "apellido": user.apellido,
        "tipo_documento": user.tipo_documento,
        "numero_documento": user.numero_documento,
        "direccion": user.direccion,
        "telefono": user.telefono,
        "email": user.email,
        "estado": user.estado,
        "rol": user.rol.nombre if user.rol else "Cliente",
        "creado_en": user.creado_en.isoformat() if user.creado_en else None,
    }


@router.get(
    "",
    response_model=List[UsuarioOut],
    status_code=status.HTTP_200_OK,
    summary="Listar usuarios con filtros y paginación (Solo Admin)",
)
async def get_users(
    db: Session = Depends(get_db),
    _: Usuario = Depends(ADMIN),
    search: Annotated[Optional[str], Query(description="Filtrar por nombre, apellido o correo", max_length=50)] = None,
    skip: Annotated[int, Query(ge=0, description="Número de registros a omitir para paginación")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description="Cantidad máxima de registros a retornar")] = 50,
):
    query = db.query(Usuario).join(Rol)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Usuario.nombre.ilike(s)) | (Usuario.apellido.ilike(s)) | (Usuario.email.ilike(s)))
    users = query.order_by(Usuario.creado_en.desc()).offset(skip).limit(limit).all()
    return [_serialize(u) for u in users]


@router.get(
    "/{user_id}",
    response_model=UsuarioOut,
    status_code=status.HTTP_200_OK,
    summary="Consultar usuario por ID (Solo Admin)",
)
async def get_user(
    user_id: Annotated[int, Path(..., ge=1, description="Identificador único del usuario")],
    db: Session = Depends(get_db),
    _: Usuario = Depends(ADMIN),
):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return _serialize(user)


@router.post(
    "/registro",
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo usuario / cliente (Público)",
    description="Permite el auto-registro de clientes. Despacha tarea en segundo plano de bienvenida.",
)
async def register_public(
    payload: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    email = payload.email.strip().lower()

    existing = db.query(Usuario).filter(
        (Usuario.email == email) | (Usuario.numero_documento == payload.numeroDocumento)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo o número de documento ya está registrado",
        )

    rol = db.query(Rol).filter(Rol.nombre == "Cliente").first()
    if not rol:
        rol = Rol(nombre="Cliente")
        db.add(rol)
        db.commit()
        db.refresh(rol)

    nuevo_usuario = Usuario(
        nombre=payload.nombre.strip(),
        apellido=payload.apellido.strip(),
        tipo_documento=payload.tipoDocumento.strip(),
        numero_documento=payload.numeroDocumento,
        direccion=payload.direccion.strip(),
        telefono=payload.telefono,
        email=email,
        password_hash=hash_password(payload.password),
        rol_id=rol.id,
        estado="Activo",
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    # Tareas en segundo plano (BackgroundTasks)
    background_tasks.add_task(send_welcome_email_task, email=email, nombre=nuevo_usuario.nombre)
    background_tasks.add_task(log_auditoria_task, "REGISTRO_CLIENTE", "usuarios", nuevo_usuario.id, email, "Auto-registro público")

    return {"message": "Usuario registrado exitosamente", "id": nuevo_usuario.id}


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Crear usuario con rol específico (Solo Admin)",
)
async def create_user_admin(
    payload: UsuarioCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    email = payload.email.strip().lower()

    existing = db.query(Usuario).filter(
        (Usuario.email == email) | (Usuario.numero_documento == payload.numeroDocumento)
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El correo o documento ya está registrado")

    rol = db.query(Rol).filter(Rol.nombre == payload.rol).first()
    if not rol:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rol inválido")

    nuevo = Usuario(
        nombre=payload.nombre.strip(),
        apellido=payload.apellido.strip(),
        tipo_documento=payload.tipoDocumento.strip(),
        numero_documento=payload.numeroDocumento,
        direccion=payload.direccion.strip(),
        telefono=payload.telefono,
        email=email,
        password_hash=hash_password(payload.password),
        rol_id=rol.id,
        estado="Activo",
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    background_tasks.add_task(log_auditoria_task, "CREAR_USUARIO", "usuarios", nuevo.id, current_admin.email, f"Rol asignado: {payload.rol}")
    return {"message": "Usuario creado exitosamente", "id": nuevo.id}


@router.put(
    "/{user_id}",
    status_code=status.HTTP_200_OK,
    summary="Actualizar usuario (Solo Admin)",
)
async def update_user(
    user_id: Annotated[int, Path(..., ge=1, description="ID del usuario")],
    payload: UsuarioUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    rol = db.query(Rol).filter(Rol.nombre == payload.rol).first()
    if not rol:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rol inválido")

    user.nombre = payload.nombre.strip()
    user.apellido = payload.apellido.strip()
    user.direccion = payload.direccion.strip()
    user.telefono = payload.telefono.strip()
    user.email = payload.email.strip().lower()
    user.rol_id = rol.id
    user.estado = payload.estado
    db.commit()

    background_tasks.add_task(log_auditoria_task, "ACTUALIZAR_USUARIO", "usuarios", user.id, current_admin.email, f"Nuevo estado: {user.estado}")
    return {"message": "Usuario actualizado exitosamente"}


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_200_OK,
    summary="Desactivar o eliminar usuario (Solo Admin)",
)
async def delete_user(
    user_id: Annotated[int, Path(..., ge=1, description="ID del usuario a desactivar")],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes desactivar tu propia cuenta de administrador")

    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    user.estado = "Inactivo"
    db.commit()

    background_tasks.add_task(log_auditoria_task, "DESACTIVAR_USUARIO", "usuarios", user.id, current_admin.email, "Estado cambiado a Inactivo")
    return {"message": "Usuario desactivado correctamente"}


@router.patch(
    "/{user_id}/status",
    status_code=status.HTTP_200_OK,
    summary="Cambiar estado Activo/Inactivo (Solo Admin)",
)
async def toggle_user_status(
    user_id: Annotated[int, Path(..., ge=1, description="ID del usuario")],
    payload: StatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    user.estado = payload.estado
    db.commit()

    background_tasks.add_task(log_auditoria_task, "CAMBIO_ESTADO_USUARIO", "usuarios", user.id, current_admin.email, f"Estado: {payload.estado}")
    return {"message": "Estado actualizado", "estado": user.estado}
