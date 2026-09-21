"""
analytics.py — Controlador REST de FastAPI para Dashboards Analíticos e Indicadores (KPIs).
Cálculos agregados dinámicos en SQL con filtros y control de acceso por roles.
Café Salomé / Café Cato.
"""
from datetime import datetime, date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app.models.models import Usuario, Producto, Servicio, Venta, DetalleVenta, Factura, PQR
from app.views.schemas import DashboardAnalyticsOut, DashboardKPIsOut, ChartItem
from app.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Dashboards y Analítica"])


@router.get("/dashboard", response_model=DashboardAnalyticsOut, summary="Obtener KPIs y datos para gráficos del Dashboard")
def obtener_metricas_dashboard(
    fecha_inicio: Optional[str] = Query(None, description="Fecha inicio YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="Fecha fin YYYY-MM-DD"),
    cliente_id: Optional[int] = Query(None, description="Filtrar por cliente"),
    producto_id: Optional[int] = Query(None, description="Filtrar por producto"),
    servicio_id: Optional[int] = Query(None, description="Filtrar por servicio"),
    estado: Optional[str] = Query(None, description="Completada, Cancelada, Pendiente"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Retorna métricas calculadas en tiempo real desde la Base de Datos SQL:
    - Cards numéricas de KPIs (usuarios, productos, servicios, ventas, facturación, PQRs).
    - Gráfico de comportamiento cronológico (gráfico lineal / barras por fecha).
    - Distribución por categoría (Productos vs Servicios).
    - Ranking de ítems más comercializados.
    - Respeta estrictamente los roles de seguridad.
    """
    rol = current_user.rol.nombre

    # 1. Totalizadores generales
    total_usuarios = db.query(Usuario).count() if rol == "Administrador" else 0
    total_productos = db.query(Producto).filter(Producto.estado == "Activo").count()
    total_servicios = db.query(Servicio).filter(Servicio.estado == "Activo").count()

    # Filtro base para ventas
    ventas_q = db.query(Venta)

    # Restricción por rol
    if rol == "Cliente":
        ventas_q = ventas_q.filter(Venta.cliente_id == current_user.id)
    elif cliente_id:
        ventas_q = ventas_q.filter(Venta.cliente_id == cliente_id)

    if estado:
        ventas_q = ventas_q.filter(Venta.estado == estado)

    if fecha_inicio:
        try:
            f_ini = datetime.strptime(f"{fecha_inicio} 00:00:00", "%Y-%m-%d %H:%M:%S")
            ventas_q = ventas_q.filter(Venta.fecha_hora >= f_ini)
        except ValueError:
            pass

    if fecha_fin:
        try:
            f_fin = datetime.strptime(f"{fecha_fin} 23:59:59", "%Y-%m-%d %H:%M:%S")
            ventas_q = ventas_q.filter(Venta.fecha_hora <= f_fin)
        except ValueError:
            pass

    if producto_id or servicio_id:
        ventas_q = ventas_q.join(Venta.detalles)
        if producto_id:
            ventas_q = ventas_q.filter(DetalleVenta.producto_id == producto_id)
        if servicio_id:
            ventas_q = ventas_q.filter(DetalleVenta.servicio_id == servicio_id)

    ventas_filtradas = ventas_q.distinct().all()

    total_ventas_count = len(ventas_filtradas)
    facturacion_total = sum(float(v.total) for v in ventas_filtradas if v.estado != "Cancelada")

    # Ventas de hoy
    hoy_inicio = datetime.combine(date.today(), datetime.min.time())
    ventas_hoy_monto = sum(
        float(v.total) for v in ventas_filtradas
        if v.fecha_hora and v.fecha_hora >= hoy_inicio and v.estado != "Cancelada"
    )

    # Métricas de PQR
    pqr_q = db.query(PQR)
    if rol == "Cliente":
        pqr_q = pqr_q.filter(PQR.cliente_id == current_user.id)
    pqrs_recibidas = pqr_q.count()
    pqrs_pendientes = pqr_q.filter(PQR.estado.in_(["Pendiente", "En Proceso"])).count()

    kpis = DashboardKPIsOut(
        total_usuarios=total_usuarios,
        total_productos=total_productos,
        total_servicios=total_servicios,
        total_ventas=total_ventas_count,
        facturacion_total=facturacion_total,
        ventas_hoy=ventas_hoy_monto,
        pqrs_recibidas=pqrs_recibidas,
        pqrs_pendientes=pqrs_pendientes,
    )

    # 2. Agrupación de Ventas por Día para Gráficos
    ventas_por_dia_map = {}
    for v in ventas_filtradas:
        if v.estado == "Cancelada":
            continue
        fecha_clave = v.fecha_hora.strftime("%Y-%m-%d") if v.fecha_hora else "Sin fecha"
        if fecha_clave not in ventas_por_dia_map:
            ventas_por_dia_map[fecha_clave] = {"valor": 0.0, "cantidad": 0}
        ventas_por_dia_map[fecha_clave]["valor"] += float(v.total)
        ventas_por_dia_map[fecha_clave]["cantidad"] += 1

    # Si hay pocos días, rellenar los últimos 7 días para un gráfico armónico
    if len(ventas_por_dia_map) < 3 and not (fecha_inicio and fecha_fin):
        for i in range(6, -1, -1):
            d_str = (date.today() - timedelta(days=i)).isoformat()
            if d_str not in ventas_por_dia_map:
                ventas_por_dia_map[d_str] = {"valor": 0.0, "cantidad": 0}

    ventas_por_dia = [
        ChartItem(label=k, valor=v["valor"], cantidad=v["cantidad"])
        for k, v in sorted(ventas_por_dia_map.items())
    ]

    # 3. Distribución por Categoría (Productos vs Servicios)
    cat_map = {"Productos": {"valor": 0.0, "cantidad": 0}, "Servicios": {"valor": 0.0, "cantidad": 0}}
    top_items_map = {}

    for v in ventas_filtradas:
        if v.estado == "Cancelada":
            continue
        for d in v.detalles:
            cat_key = "Productos" if d.tipo_item == "Producto" else "Servicios"
            cat_map[cat_key]["valor"] += float(d.subtotal)
            cat_map[cat_key]["cantidad"] += d.cantidad

            item_key = d.nombre_item
            if item_key not in top_items_map:
                top_items_map[item_key] = {"valor": 0.0, "cantidad": 0}
            top_items_map[item_key]["valor"] += float(d.subtotal)
            top_items_map[item_key]["cantidad"] += d.cantidad

    ventas_por_categoria = [
        ChartItem(label=k, valor=v["valor"], cantidad=v["cantidad"])
        for k, v in cat_map.items()
    ]

    top_mas_vendidos = [
        ChartItem(label=k, valor=v["valor"], cantidad=v["cantidad"])
        for k, v in sorted(top_items_map.items(), key=lambda x: x[1]["cantidad"], reverse=True)[:5]
    ]

    return DashboardAnalyticsOut(
        kpis=kpis,
        ventas_por_dia=ventas_por_dia,
        ventas_por_categoria=ventas_por_categoria,
        top_mas_vendidos=top_mas_vendidos,
    )
