"""
ventas.py — Controlador REST de FastAPI para el Módulo de Ventas y Facturación.
Café Salomé / Café Cato.
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.models import Usuario, Venta, DetalleVenta, Factura, DetalleFactura, Producto, Servicio
from app.views.schemas import VentaCreate, VentaOut, DetalleVentaOut
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/ventas", tags=["Ventas"])


def _generar_numero_venta(db: Session) -> str:
    count = db.query(Venta).count() + 1
    return f"VTA-{datetime.now().year}-{count:04d}"


def _generar_numero_factura(db: Session) -> str:
    count = db.query(Factura).count() + 1
    return f"FACT-{datetime.now().year}-{count:04d}"


def _map_venta_out(v: Venta) -> dict:
    detalles = []
    for d in v.detalles:
        detalles.append({
            "id": d.id,
            "venta_id": d.venta_id,
            "tipo_item": d.tipo_item,
            "producto_id": d.producto_id,
            "servicio_id": d.servicio_id,
            "gato_id": d.gato_id,
            "nombre_item": d.nombre_item,
            "cantidad": d.cantidad,
            "precio_unitario": float(d.precio_unitario),
            "subtotal": float(d.subtotal),
        })

    return {
        "id": v.id,
        "numero_venta": v.numero_venta,
        "cliente_id": v.cliente_id,
        "cliente_nombre": f"{v.cliente.nombre} {v.cliente.apellido}" if v.cliente else "Cliente General",
        "cliente_documento": v.cliente.numero_documento if v.cliente else None,
        "operador_id": v.operador_id,
        "operador_nombre": f"{v.operador.nombre} {v.operador.apellido}" if v.operador else "Sistema",
        "subtotal": float(v.subtotal),
        "descuentos": float(v.descuentos),
        "impuestos": float(v.impuestos),
        "total": float(v.total),
        "metodo_pago": v.metodo_pago,
        "estado": v.estado,
        "fecha_hora": v.fecha_hora,
        "detalles": detalles,
        "factura_id": v.factura.id if v.factura else None,
        "numero_factura": v.factura.numero_factura if v.factura else None,
    }


@router.post("/", response_model=VentaOut, status_code=status.HTTP_201_CREATED, summary="Registrar una nueva venta")
def registrar_venta(
    datos: VentaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Registra una venta desde el sitio web o caja:
    - Asocia cliente, operador (usuario actual), ítems con detalle-venta.
    - Almacena cantidades, precios y valores en BD SQL.
    - Genera automáticamente su factura comercial asociada.
    """
    if not datos.detalles:
        raise HTTPException(status_code=400, detail="La venta debe incluir al menos un producto o servicio")

    cliente_id = datos.cliente_id if datos.cliente_id else current_user.id
    cliente = db.query(Usuario).filter(Usuario.id == cliente_id).first()
    if not cliente:
        cliente = current_user
        cliente_id = current_user.id

    operador_id = current_user.id

    subtotal_calculado = 0.0
    detalles_para_guardar = []
    detalles_factura_para_guardar = []

    for item in datos.detalles:
        subtotal_item = item.subtotal if item.subtotal is not None else (item.cantidad * item.precio_unitario)
        subtotal_calculado += subtotal_item

        detalles_para_guardar.append({
            "tipo_item": item.tipo_item,
            "producto_id": item.producto_id,
            "servicio_id": item.servicio_id,
            "gato_id": item.gato_id,
            "nombre_item": item.nombre_item,
            "cantidad": item.cantidad,
            "precio_unitario": item.precio_unitario,
            "subtotal": subtotal_item,
        })

        if item.tipo_item == "Gato" and item.gato_id:
            from app.models.models import Gato
            gato_db = db.query(Gato).filter(Gato.id == item.gato_id).first()
            if not gato_db or gato_db.estado != "Activo":
                raise HTTPException(status_code=400, detail=f"El gato '{item.nombre_item}' ya no está disponible para adopción.")
            gato_db.estado = "Inactivo"  # Marcar como Adoptado
            
        if item.tipo_item == "Producto" and item.producto_id:
            from app.models.models import Producto
            prod_db = db.query(Producto).filter(Producto.id == item.producto_id).first()
            if not prod_db:
                raise HTTPException(status_code=404, detail=f"Producto '{item.nombre_item}' no encontrado.")
            if prod_db.stock < item.cantidad:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente para el producto '{item.nombre_item}'. Disponible: {prod_db.stock}")
            prod_db.stock -= item.cantidad
            
        if item.tipo_item == "Servicio" and item.servicio_id:
            from app.models.models import Servicio
            serv_db = db.query(Servicio).filter(Servicio.id == item.servicio_id).first()
            if not serv_db:
                raise HTTPException(status_code=404, detail=f"Servicio '{item.nombre_item}' no encontrado.")
            if serv_db.stock < item.cantidad:
                raise HTTPException(status_code=400, detail=f"Cupos insuficientes para el servicio '{item.nombre_item}'. Disponible: {serv_db.stock}")
            serv_db.stock -= item.cantidad

        detalles_factura_para_guardar.append({
            "descripcion": f"{item.nombre_item} x {item.cantidad}",
            "cantidad": item.cantidad,
            "precio_unitario": item.precio_unitario,
            "subtotal": subtotal_item,
        })

    descuentos = float(datos.descuentos or 0.0)
    impuestos = float(datos.impuestos or 0.0)
    total_calculado = max(0.0, subtotal_calculado - descuentos + impuestos)

    numero_venta = _generar_numero_venta(db)
    nueva_venta = Venta(
        numero_venta=numero_venta,
        cliente_id=cliente_id,
        operador_id=operador_id,
        subtotal=subtotal_calculado,
        descuentos=descuentos,
        impuestos=impuestos,
        total=total_calculado,
        metodo_pago=datos.metodo_pago,
        estado="Completada",
    )
    db.add(nueva_venta)
    db.flush()

    for d in detalles_para_guardar:
        det = DetalleVenta(
            venta_id=nueva_venta.id,
            tipo_item=d["tipo_item"],
            producto_id=d["producto_id"],
            servicio_id=d["servicio_id"],
            gato_id=d["gato_id"],
            nombre_item=d["nombre_item"],
            cantidad=d["cantidad"],
            precio_unitario=d["precio_unitario"],
            subtotal=d["subtotal"],
        )
        db.add(det)

    numero_factura = _generar_numero_factura(db)
    nueva_factura = Factura(
        numero_factura=numero_factura,
        venta_id=nueva_venta.id,
        cliente_id=cliente_id,
        subtotal=subtotal_calculado,
        impuestos=impuestos,
        total=total_calculado,
        estado="Pagada",
    )
    db.add(nueva_factura)
    db.flush()

    for df in detalles_factura_para_guardar:
        det_fact = DetalleFactura(
            factura_id=nueva_factura.id,
            descripcion=df["descripcion"],
            cantidad=df["cantidad"],
            precio_unitario=df["precio_unitario"],
            subtotal=df["subtotal"],
        )
        db.add(det_fact)

    db.commit()
    db.refresh(nueva_venta)

    return _map_venta_out(nueva_venta)


@router.get("/", response_model=List[VentaOut], summary="Consultar historial de ventas")
def listar_ventas(
    fecha_inicio: Optional[str] = Query(None, description="Fecha inicial YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="Fecha final YYYY-MM-DD"),
    cliente_id: Optional[int] = Query(None, description="Filtrar por cliente"),
    producto_id: Optional[int] = Query(None, description="Filtrar por producto"),
    servicio_id: Optional[int] = Query(None, description="Filtrar por servicio"),
    gato_id: Optional[int] = Query(None, description="Filtrar por gato"),
    estado: Optional[str] = Query(None, description="Completada, Cancelada, Pendiente"),
    search: Optional[str] = Query(None, description="Buscar por número de venta o nombre de cliente"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = db.query(Venta).order_by(desc(Venta.fecha_hora))

    if current_user.rol.nombre == "Cliente":
        query = query.filter(Venta.cliente_id == current_user.id)
    elif cliente_id:
        query = query.filter(Venta.cliente_id == cliente_id)

    if estado:
        query = query.filter(Venta.estado == estado)

    if fecha_inicio:
        try:
            f_ini = datetime.strptime(f"{fecha_inicio} 00:00:00", "%Y-%m-%d %H:%M:%S")
            query = query.filter(Venta.fecha_hora >= f_ini)
        except ValueError:
            pass

    if fecha_fin:
        try:
            f_fin = datetime.strptime(f"{fecha_fin} 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(Venta.fecha_hora <= f_fin)
        except ValueError:
            pass

    if producto_id or servicio_id or gato_id:
        query = query.join(Venta.detalles)
        if producto_id:
            query = query.filter(DetalleVenta.producto_id == producto_id)
        if servicio_id:
            query = query.filter(DetalleVenta.servicio_id == servicio_id)
        if gato_id:
            query = query.filter(DetalleVenta.gato_id == gato_id)

    if search:
        s = f"%{search}%"
        query = query.join(Venta.cliente).filter(
            (Venta.numero_venta.ilike(s)) | (Usuario.nombre.ilike(s)) | (Usuario.apellido.ilike(s))
        )

    ventas = query.distinct().all()
    return [_map_venta_out(v) for v in ventas]


@router.get("/{venta_id}", response_model=VentaOut, summary="Obtener detalle de una venta")
def obtener_venta(
    venta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    if current_user.rol.nombre == "Cliente" and venta.cliente_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes autorización para ver esta venta")

    return _map_venta_out(venta)


@router.patch("/{venta_id}/estado", response_model=VentaOut, summary="Actualizar estado de una venta")
def actualizar_estado_venta(
    venta_id: int,
    nuevo_estado: str = Query(..., pattern="^(Completada|Cancelada|Pendiente)$"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("Administrador", "Empleado")),
):
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    venta.estado = nuevo_estado
    if venta.factura:
        if nuevo_estado == "Cancelada":
            venta.factura.estado = "Anulada"
        elif nuevo_estado == "Completada":
            venta.factura.estado = "Pagada"

    db.commit()
    db.refresh(venta)
    return _map_venta_out(venta)
