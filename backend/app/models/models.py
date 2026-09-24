"""
models.py — Modelos ORM con SQLAlchemy 2.0 que reflejan las entidades de Café Cato / Café Salomé.
Cumple con Criterio 3 (Entidades relacionadas, claves foráneas y relaciones bidireccionales).
"""
from sqlalchemy import (
    Column, Integer, String, Enum, DECIMAL, Text,
    TIMESTAMP, ForeignKey, Boolean
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(30), nullable=False, unique=True)

    # Relación bidireccional con Usuario
    usuarios = relationship("Usuario", back_populates="rol", cascade="all, delete-orphan")


class Permiso(Base):
    __tablename__ = "permisos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(80), nullable=False, unique=True)


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(50), nullable=False)
    apellido = Column(String(50), nullable=False)
    tipo_documento = Column(String(20), nullable=False)
    numero_documento = Column(String(12), nullable=False, unique=True)
    direccion = Column(String(120), nullable=False)
    telefono = Column(String(15), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    estado = Column(Enum("Activo", "Inactivo"), nullable=False, default="Activo")
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    creado_en = Column(TIMESTAMP, server_default=func.now())

    # Relaciones ORM
    rol = relationship("Rol", back_populates="usuarios")
    productos = relationship("Producto", back_populates="autor")
    servicios = relationship("Servicio", back_populates="autor")
    gatos = relationship("Gato", back_populates="autor")
    ventas_como_cliente = relationship("Venta", foreign_keys="Venta.cliente_id", back_populates="cliente")
    ventas_como_operador = relationship("Venta", foreign_keys="Venta.operador_id", back_populates="operador")
    pqrs = relationship("PQR", foreign_keys="PQR.cliente_id", back_populates="cliente")


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255), nullable=True)
    precio = Column(DECIMAL(10, 2), nullable=False)
    imagen = Column(Text, nullable=True)
    estado = Column(Enum("Activo", "Inactivo"), nullable=False, default="Activo")
    stock = Column(Integer, nullable=False, default=12)
    creado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    creado_en = Column(TIMESTAMP, server_default=func.now())

    # Relación con Usuario
    autor = relationship("Usuario", back_populates="productos")


class Servicio(Base):
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255), nullable=True)
    precio = Column(DECIMAL(10, 2), nullable=True)
    imagen = Column(Text, nullable=True)
    estado = Column(Enum("Activo", "Inactivo"), nullable=False, default="Activo")
    stock = Column(Integer, nullable=False, default=12)
    creado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    creado_en = Column(TIMESTAMP, server_default=func.now())

    # Relación con Usuario
    autor = relationship("Usuario", back_populates="servicios")


class Gato(Base):
    __tablename__ = "gatos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255), nullable=True)
    edad = Column(Integer, nullable=False, default=0)
    raza = Column(String(80), nullable=True)
    sexo = Column(String(20), nullable=True)
    color = Column(String(60), nullable=True)
    peso = Column(DECIMAL(5, 2), nullable=True)
    esterilizado = Column(Boolean, nullable=False, default=False)
    vacunado = Column(Boolean, nullable=False, default=False)
    imagen = Column(Text, nullable=True)
    estado = Column(Enum("Activo", "Inactivo"), nullable=False, default="Activo")
    creado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    creado_en = Column(TIMESTAMP, server_default=func.now())

    # Relación con Usuario
    autor = relationship("Usuario", back_populates="gatos")


class AuditoriaLog(Base):
    """Modelo para registro de auditoría en segundo plano (BackgroundTasks)."""
    __tablename__ = "auditoria_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    accion = Column(String(100), nullable=False)
    recurso = Column(String(50), nullable=False)
    recurso_id = Column(Integer, nullable=True)
    usuario_email = Column(String(100), nullable=True)
    detalles = Column(Text, nullable=True)
    fecha = Column(TIMESTAMP, server_default=func.now())


# ─────────────────────────────────────────────────────────────
# MODELOS QUINTO AVANCE: VENTAS, FACTURACIÓN, PQR Y CHATBOT
# ─────────────────────────────────────────────────────────────

class Venta(Base):
    """Modelo relacional para registrar ventas de productos y servicios."""
    __tablename__ = "ventas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    numero_venta = Column(String(30), unique=True, index=True, nullable=False)
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    operador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    subtotal = Column(DECIMAL(12, 2), nullable=False, default=0.0)
    descuentos = Column(DECIMAL(12, 2), nullable=False, default=0.0)
    impuestos = Column(DECIMAL(12, 2), nullable=False, default=0.0)
    total = Column(DECIMAL(12, 2), nullable=False, default=0.0)
    metodo_pago = Column(String(50), nullable=False, default="Efectivo")
    estado = Column(Enum("Completada", "Cancelada", "Pendiente"), nullable=False, default="Completada")
    fecha_hora = Column(TIMESTAMP, server_default=func.now())

    # Relaciones
    cliente = relationship("Usuario", foreign_keys=[cliente_id], back_populates="ventas_como_cliente")
    operador = relationship("Usuario", foreign_keys=[operador_id], back_populates="ventas_como_operador")
    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")
    factura = relationship("Factura", back_populates="venta", uselist=False)


class DetalleVenta(Base):
    """Detalle de productos y servicios comercializados en cada venta."""
    __tablename__ = "detalle_ventas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"), nullable=False)
    tipo_item = Column(Enum("Producto", "Servicio", "Gato"), nullable=False, default="Producto")
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=True)
    servicio_id = Column(Integer, ForeignKey("servicios.id"), nullable=True)
    gato_id = Column(Integer, ForeignKey("gatos.id"), nullable=True)
    nombre_item = Column(String(150), nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)
    subtotal = Column(DECIMAL(12, 2), nullable=False)

    # Relaciones
    venta = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto")
    servicio = relationship("Servicio")
    gato = relationship("Gato")


class Factura(Base):
    """Facturas comerciales generadas a partir de operaciones de venta."""
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    numero_factura = Column(String(40), unique=True, index=True, nullable=False)
    venta_id = Column(Integer, ForeignKey("ventas.id"), nullable=False, unique=True)
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_emision = Column(TIMESTAMP, server_default=func.now())
    subtotal = Column(DECIMAL(12, 2), nullable=False)
    impuestos = Column(DECIMAL(12, 2), nullable=False)
    total = Column(DECIMAL(12, 2), nullable=False)
    estado = Column(Enum("Emitida", "Pagada", "Anulada"), nullable=False, default="Emitida")

    # Relaciones
    venta = relationship("Venta", back_populates="factura")
    cliente = relationship("Usuario")
    detalles = relationship("DetalleFactura", back_populates="factura", cascade="all, delete-orphan")


class DetalleFactura(Base):
    """Detalle de ítems facturados."""
    __tablename__ = "detalle_facturas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    factura_id = Column(Integer, ForeignKey("facturas.id"), nullable=False)
    descripcion = Column(String(255), nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)
    subtotal = Column(DECIMAL(12, 2), nullable=False)

    # Relaciones
    factura = relationship("Factura", back_populates="detalles")


class PQR(Base):
    """Módulo de Peticiones, Quejas, Reclamos y Sugerencias de clientes."""
    __tablename__ = "pqr"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    radicado = Column(String(30), unique=True, index=True, nullable=False)
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(Enum("Peticion", "Queja", "Reclamo", "Sugerencia"), nullable=False, default="Peticion")
    asunto = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=False)
    estado = Column(Enum("Pendiente", "En Proceso", "Respondida", "Cerrada"), nullable=False, default="Pendiente")
    respuesta = Column(Text, nullable=True)
    respondido_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())
    fecha_respuesta = Column(TIMESTAMP, nullable=True)

    # Relaciones
    cliente = relationship("Usuario", foreign_keys=[cliente_id], back_populates="pqrs")
    operador_respuesta = relationship("Usuario", foreign_keys=[respondido_por])


class ConversacionChatbot(Base):
    """Historial de sesiones y conversaciones con el chatbot inteligente."""
    __tablename__ = "conversaciones_chatbot"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(100), unique=True, index=True, nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    creado_en = Column(TIMESTAMP, server_default=func.now())

    # Relaciones
    usuario = relationship("Usuario")
    mensajes = relationship("MensajeChatbot", back_populates="conversacion", cascade="all, delete-orphan")


class MensajeChatbot(Base):
    """Mensajes individuales dentro de una conversación del chatbot."""
    __tablename__ = "mensajes_chatbot"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversacion_id = Column(Integer, ForeignKey("conversaciones_chatbot.id"), nullable=False)
    remitente = Column(Enum("usuario", "asistente", "sistema"), nullable=False)
    contenido = Column(Text, nullable=False)
    creado_en = Column(TIMESTAMP, server_default=func.now())

    # Relaciones
    conversacion = relationship("ConversacionChatbot", back_populates="mensajes")


class ReservaContacto(Base):
    """Modelo para solicitudes de reservas, eventos y contacto general."""
    __tablename__ = "reservas_contacto"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    telefono = Column(String(50), nullable=True)
    motivo = Column(Enum("reserva", "adopcion", "evento", "consulta"), nullable=False, default="reserva")
    personas = Column(String(20), nullable=True)
    fecha_tentativa = Column(String(50), nullable=True)
    mensaje = Column(Text, nullable=True)
    estado = Column(Enum("Pendiente", "Contactado", "Confirmada", "Cancelada"), nullable=False, default="Pendiente")
    respuesta = Column(Text, nullable=True)
    creado_en = Column(TIMESTAMP, server_default=func.now())
