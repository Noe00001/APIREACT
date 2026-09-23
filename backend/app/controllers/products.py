"""
routes/products.py — CRUD completo de productos y bebidas de café.
Público: GET /api/productos, GET /api/productos/{product_id}
Admin: GET /api/productos/admin, POST, PUT, DELETE, PATCH
Cumple Criterios 1 (REST, Annotated, Path, Query), 2 (Pydantic v2) y 6 (async, BackgroundTasks).
"""
from typing import Annotated, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Producto, Usuario
from app.views.schemas import ProductoCreate, ProductoUpdate, ProductoOut, StatusUpdate
from app.auth import require_role, get_current_user
from app.tasks import log_auditoria_task

router = APIRouter(prefix="/api/productos", tags=["Productos"])

ADMIN = require_role("Administrador")


def _serialize(p: Producto) -> dict:
    return {
        "id": p.id,
        "nombre": p.nombre,
        "descripcion": p.descripcion,
        "precio": float(p.precio) if p.precio is not None else 0.0,
        "stock": p.stock,
        "imagen": p.imagen,
        "estado": p.estado,
        "creado_en": p.creado_en.isoformat() if p.creado_en else None,
    }


@router.get(
    "",
    response_model=List[ProductoOut],
    status_code=status.HTTP_200_OK,
    summary="Listar productos activos (Público)",
)
async def get_products(
    db: Session = Depends(get_db),
    search: Annotated[Optional[str], Query(description="Filtrar por nombre o descripción")] = None,
    precio_max: Annotated[Optional[float], Query(ge=0, description="Filtrar por precio máximo")] = None,
):
    query = db.query(Producto).filter(Producto.estado == "Activo")
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Producto.nombre.ilike(s)) | (Producto.descripcion.ilike(s)))
    if precio_max is not None:
        query = query.filter(Producto.precio <= precio_max)

    productos = query.order_by(Producto.creado_en.desc()).all()
    return [_serialize(p) for p in productos]


@router.get(
    "/admin",
    response_model=List[ProductoOut],
    status_code=status.HTTP_200_OK,
    summary="Listar todos los productos (Solo Admin)",
)
async def get_products_admin(
    db: Session = Depends(get_db),
    _: Usuario = Depends(ADMIN),
):
    productos = db.query(Producto).order_by(Producto.creado_en.desc()).all()
    return [_serialize(p) for p in productos]


@router.get(
    "/{product_id}",
    response_model=ProductoOut,
    status_code=status.HTTP_200_OK,
    summary="Consultar producto por ID (Público)",
)
async def get_product(
    product_id: Annotated[int, Path(..., ge=1, description="ID del producto")],
    db: Session = Depends(get_db),
):
    producto = (
        db.query(Producto)
        .filter(Producto.id == product_id, Producto.estado == "Activo")
        .first()
    )
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return _serialize(producto)


@router.post(
    "",
    response_model=ProductoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear producto (Solo Admin)",
)
async def create_product(
    payload: ProductoCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    producto = Producto(
        nombre=payload.nombre.strip(),
        descripcion=payload.descripcion.strip() if payload.descripcion else None,
        precio=payload.precio,
        stock=payload.stock,
        imagen=payload.imagen or None,
        estado="Activo",
        creado_por=current_admin.id,
    )
    db.add(producto)
    db.commit()
    db.refresh(producto)

    background_tasks.add_task(
        log_auditoria_task,
        "CREAR_PRODUCTO",
        "productos",
        producto.id,
        current_admin.email,
        f"Producto '{producto.nombre}' creado con precio ${producto.precio}",
    )
    return _serialize(producto)


@router.put(
    "/{product_id}",
    response_model=ProductoOut,
    status_code=status.HTTP_200_OK,
    summary="Actualizar producto (Solo Admin)",
)
async def update_product(
    product_id: Annotated[int, Path(..., ge=1, description="ID del producto")],
    payload: ProductoUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    producto = db.query(Producto).filter(Producto.id == product_id).first()
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    producto.nombre = payload.nombre.strip()
    producto.descripcion = payload.descripcion.strip() if payload.descripcion else None
    producto.precio = payload.precio
    if payload.stock is not None:
        producto.stock = payload.stock
    producto.estado = payload.estado
    if "imagen" in payload.model_fields_set:
        producto.imagen = payload.imagen.strip() if (payload.imagen and payload.imagen.strip()) else None
    db.commit()
    db.refresh(producto)

    background_tasks.add_task(
        log_auditoria_task,
        "ACTUALIZAR_PRODUCTO",
        "productos",
        producto.id,
        current_admin.email,
        f"Producto '{producto.nombre}' actualizado",
    )
    return _serialize(producto)


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_200_OK,
    summary="Desactivar o eliminar producto (Solo Admin)",
)
async def delete_product(
    product_id: Annotated[int, Path(..., ge=1, description="ID del producto")],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    producto = db.query(Producto).filter(Producto.id == product_id).first()
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    # Desvincular de ventas antes de eliminar para evitar error de integridad
    from app.models.models import DetalleVenta
    db.query(DetalleVenta).filter(DetalleVenta.producto_id == product_id).update({"producto_id": None})
    
    db.delete(producto)
    db.commit()

    background_tasks.add_task(
        log_auditoria_task,
        "ELIMINAR_PRODUCTO",
        "productos",
        product_id,
        current_admin.email,
        "Producto eliminado permanentemente de la base de datos",
    )
    return {"message": "Producto eliminado exitosamente"}


@router.patch(
    "/{product_id}/status",
    status_code=status.HTTP_200_OK,
    summary="Cambiar estado del producto (Solo Admin)",
)
async def toggle_product_status(
    product_id: Annotated[int, Path(..., ge=1, description="ID del producto")],
    payload: StatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(ADMIN),
):
    producto = db.query(Producto).filter(Producto.id == product_id).first()
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    producto.estado = payload.estado
    db.commit()

    background_tasks.add_task(
        log_auditoria_task,
        "CAMBIO_ESTADO_PRODUCTO",
        "productos",
        producto.id,
        current_admin.email,
        f"Estado: {payload.estado}",
    )
    return {"message": "Estado del producto actualizado", "estado": producto.estado}
