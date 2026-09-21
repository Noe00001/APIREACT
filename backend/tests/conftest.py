"""
conftest.py — Configuración de fixtures de Pytest con TestClient y base de datos aislada.
Cumple Criterio 9 (Testing automatizado con Pytest).
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Rol, Usuario, Producto, Gato
from app.auth import hash_password, create_access_token

# Base de datos SQLite aislada en memoria para pruebas rápidas y reproducibles
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Crea todas las tablas y siembra datos iniciales para la suite de pruebas."""
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine_test)

    # Sembrar roles y administrador de pruebas
    with TestingSessionLocal() as db:
        admin_rol = Rol(nombre="Administrador")
        empleado_rol = Rol(nombre="Empleado")
        cliente_rol = Rol(nombre="Cliente")
        db.add_all([admin_rol, empleado_rol, cliente_rol])
        db.commit()
        db.refresh(admin_rol)

        admin = Usuario(
            nombre="Admin",
            apellido="Pruebas",
            tipo_documento="CC",
            numero_documento="999888777",
            direccion="Carrera 1 # 2-3",
            telefono="3119998877",
            email="admin.test@cafecato.com",
            password_hash=hash_password("AdminPass123*"),
            estado="Activo",
            rol_id=admin_rol.id,
        )
        db.add(admin)
        db.commit()

    yield

    Base.metadata.drop_all(bind=engine_test)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    """Retorna cliente de prueba FastAPI TestClient."""
    return TestClient(app)


@pytest.fixture
def admin_headers():
    """Genera cabeceras con Bearer token JWT de administrador para pruebas protegidas."""
    with TestingSessionLocal() as db:
        admin = db.query(Usuario).filter(Usuario.email == "admin.test@cafecato.com").first()
        token = create_access_token({"sub": str(admin.id)})
        return {"Authorization": f"Bearer {token}"}
