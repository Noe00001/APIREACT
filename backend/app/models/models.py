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


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255), nullable=True)
    precio = Column(DECIMAL(10, 2), nullable=False)
    imagen = Column(Text, nullable=True)
    estado = Column(Enum("Activo", "Inactivo"), nullable=False, default="Activo")
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
