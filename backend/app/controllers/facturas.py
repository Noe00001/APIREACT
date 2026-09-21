"""
facturas.py — Controlador REST de FastAPI para Consulta y Descarga de Facturas en PDF.
Café Salomé / Café Cato.
"""
from io import BytesIO
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.database import get_db
from app.models.models import Usuario, Factura, DetalleFactura
from app.views.schemas import FacturaOut, DetalleFacturaOut
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/facturas", tags=["Facturas"])


def _map_factura_out(f: Factura) -> dict:
    detalles = [
        {
            "id": d.id,
            "factura_id": d.factura_id,
            "descripcion": d.descripcion,
            "cantidad": d.cantidad,
            "precio_unitario": float(d.precio_unitario),
            "subtotal": float(d.subtotal),
        }
        for d in f.detalles
    ]

    return {
        "id": f.id,
        "numero_factura": f.numero_factura,
        "venta_id": f.venta_id,
        "numero_venta": f.venta.numero_venta if f.venta else None,
        "cliente_id": f.cliente_id,
        "cliente_nombre": f"{f.cliente.nombre} {f.cliente.apellido}" if f.cliente else "Consumidor Final",
        "cliente_documento": f.cliente.numero_documento if f.cliente else "N/A",
        "cliente_email": f.cliente.email if f.cliente else "N/A",
        "cliente_telefono": f.cliente.telefono if f.cliente else "N/A",
        "cliente_direccion": f.cliente.direccion if f.cliente else "N/A",
        "fecha_emision": f.fecha_emision,
        "subtotal": float(f.subtotal),
        "impuestos": float(f.impuestos),
        "total": float(f.total),
        "estado": f.estado,
        "detalles": detalles,
    }


@router.get("/", response_model=List[FacturaOut], summary="Consultar listado de facturas")
def listar_facturas(
    numero_factura: Optional[str] = Query(None, description="Filtrar por código de factura"),
    cliente_id: Optional[int] = Query(None, description="Filtrar por cliente"),
    fecha_inicio: Optional[str] = Query(None, description="Fecha de emisión inicial YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="Fecha de emisión final YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = db.query(Factura).order_by(desc(Factura.fecha_emision))

    if current_user.rol.nombre == "Cliente":
        query = query.filter(Factura.cliente_id == current_user.id)
    elif cliente_id:
        query = query.filter(Factura.cliente_id == cliente_id)

    if numero_factura:
        query = query.filter(Factura.numero_factura.ilike(f"%{numero_factura}%"))

    if fecha_inicio:
        try:
            f_ini = datetime.strptime(f"{fecha_inicio} 00:00:00", "%Y-%m-%d %H:%M:%S")
            query = query.filter(Factura.fecha_emision >= f_ini)
        except ValueError:
            pass

    if fecha_fin:
        try:
            f_fin = datetime.strptime(f"{fecha_fin} 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(Factura.fecha_emision <= f_fin)
        except ValueError:
            pass

    facturas = query.all()
    return [_map_factura_out(f) for f in facturas]


@router.get("/{factura_id}", response_model=FacturaOut, summary="Obtener una factura por su ID")
def obtener_factura(
    factura_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    if current_user.rol.nombre == "Cliente" and factura.cliente_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes autorización para ver esta factura")

    return _map_factura_out(factura)


@router.get("/{factura_id}/pdf", summary="Descargar factura electrónica en formato PDF")
def descargar_factura_pdf(
    factura_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    if current_user.rol.nombre == "Cliente" and factura.cliente_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes autorización para descargar esta factura")

    # Generación de PDF en memoria
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'FacturaTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor("#3d2314"),
        alignment=1, # Centered
        spaceAfter=10
    )
    subtitle_style = ParagraphStyle(
        'FacturaSub',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#6b4c38"),
        alignment=1,
        spaceAfter=15
    )
    header_box = ParagraphStyle(
        'HeaderBox',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor("#2c1810"),
        leading=14
    )

    elements = []

    # Encabezado Comercial
    elements.append(Paragraph("<b>CAFÉ SALOMÉ — CAT CAFÉ & BARISMO</b>", title_style))
    elements.append(Paragraph("NIT: 900.852.147-3 | Calle 45 # 12-34, Ciudad | Tel: (+57) 300 123 4567<br/>contacto@cafecato.com | www.cafesalome.com", subtitle_style))
    elements.append(Spacer(1, 10))

    # Información de la Factura y Cliente en Tabla de 2 columnas
    cliente_nom = f"{factura.cliente.nombre} {factura.cliente.apellido}" if factura.cliente else "Cliente General"
    cliente_doc = factura.cliente.numero_documento if factura.cliente else "222222222222"
    cliente_email = factura.cliente.email if factura.cliente else "N/A"
    cliente_dir = factura.cliente.direccion if factura.cliente else "Medellín, Colombia"
    fecha_str = factura.fecha_emision.strftime("%d/%m/%Y %H:%M") if factura.fecha_emision else ""

    info_data = [
        [
            Paragraph(f"<b>FACTURA COMERCIAL:</b> {factura.numero_factura}<br/>"
                      f"<b>Venta Asociada:</b> {factura.venta.numero_venta if factura.venta else 'N/A'}<br/>"
                      f"<b>Fecha de Emisión:</b> {fecha_str}<br/>"
                      f"<b>Estado:</b> <font color='#16a34a'><b>{factura.estado}</b></font>", header_box),
            Paragraph(f"<b>DATOS DEL CLIENTE:</b><br/>"
                      f"<b>Nombre:</b> {cliente_nom}<br/>"
                      f"<b>Documento:</b> {cliente_doc}<br/>"
                      f"<b>Correo:</b> {cliente_email}<br/>"
                      f"<b>Dirección:</b> {cliente_dir}", header_box)
        ]
    ]
    info_table = Table(info_data, colWidths=[270, 270])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fbf7f4")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#d7b99c")),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 15))

    # Tabla de Ítems
    items_header = [["Ítem / Descripción", "Cant.", "Precio Unitario", "Subtotal"]]
    items_rows = []
    for d in factura.detalles:
        items_rows.append([
            d.descripcion,
            str(d.cantidad),
            f"${float(d.precio_unitario):,.2f}",
            f"${float(d.subtotal):,.2f}",
        ])

    table_data = items_header + items_rows
    items_table = Table(table_data, colWidths=[290, 50, 100, 100])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#523321")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2d1c3")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#faf6f0")]),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 12))

    # Resumen de Totales
    totales_data = [
        ["Subtotal:", f"${float(factura.subtotal):,.2f}"],
        ["Impuestos (IVA 0%):", f"${float(factura.impuestos):,.2f}"],
        ["TOTAL A PAGAR:", f"${float(factura.total):,.2f}"],
    ]
    totales_table = Table(totales_data, colWidths=[440, 100])
    totales_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('TEXTCOLOR', (0,-1), (-1,-1), colors.HexColor("#523321")),
        ('LINEABOVE', (0,-1), (-1,-1), 1, colors.HexColor("#523321")),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(totales_table)
    elements.append(Spacer(1, 20))

    footer_text = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor("#8a7161"),
        alignment=1
    )
    elements.append(Paragraph("¡Gracias por visitar Café Salomé y apoyar a nuestros gatitos en adopción! 🐾☕<br/>Documento soporte de transacción electrónica regulada según la normativa vigente.", footer_text))

    doc.build(elements)
    buffer.seek(0)

    filename = f"{factura.numero_factura}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
