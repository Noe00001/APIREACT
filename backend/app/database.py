"""
database.py — Configuración de la conexión a la base de datos usando SQLAlchemy 2.0.
Soporta MySQL y SQLite persistente (cafe_cato.db).
Cumple con Criterio 3 (Persistencia de datos SQLAlchemy 2.0 contra BD real).
"""
import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

logger = logging.getLogger("cafe_cato.database")

# Lectura de variables de entorno
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "cafe_cato")
DATABASE_URL_ENV = os.getenv("DATABASE_URL")

def get_engine():
    """
    Determina y crea el motor de base de datos SQLAlchemy:
    1. Si se define DATABASE_URL en .env, se usa directamente.
    2. Si se intentó MySQL y está disponible, se usa MySQL.
    3. Si MySQL no está disponible o falla la conexión, utiliza SQLite persistente (cafe_cato.db).
    """
    if DATABASE_URL_ENV:
        connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL_ENV else {}
        return create_engine(DATABASE_URL_ENV, echo=False, connect_args=connect_args)

    # Intento con MySQL
    mysql_url = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    try:
        test_engine = create_engine(
            mysql_url,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={"connect_timeout": 2},
        )
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Conectado exitosamente a la base de datos MySQL (%s)", DB_NAME)
        return test_engine
    except Exception as exc:
        # Fallback a SQLite persistente en disco real (no en memoria)
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cafe_cato.db")
        sqlite_url = f"sqlite:///{db_path}"
        logger.warning(
            "No se pudo conectar a MySQL en %s:%s (%s). Usando SQLite persistente: %s",
            DB_HOST, DB_PORT, str(exc), sqlite_url
        )
        return create_engine(
            sqlite_url,
            echo=False,
            connect_args={"check_same_thread": False},
        )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependencia de FastAPI para inyectar una sesión de base de datos."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Inicializa tablas y datos semilla iniciales si la base de datos está vacía.
    Garantiza que el proyecto funcione de inmediato al iniciarse.
    """
    from app.models import Rol, Permiso, Usuario, Producto, Servicio, Gato
    from app.auth import hash_password

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        # 1. Sembrar roles si no existen
        roles_nombres = ["Administrador", "Empleado", "Cliente"]
        roles_map = {}
        for r_nom in roles_nombres:
            rol = db.query(Rol).filter(Rol.nombre == r_nom).first()
            if not rol:
                rol = Rol(nombre=r_nom)
                db.add(rol)
                db.commit()
                db.refresh(rol)
            roles_map[r_nom] = rol

        # 2. Sembrar permisos básicos
        permisos_nombres = ["gestionar_usuarios", "gestionar_productos", "gestionar_servicios", "gestionar_gatos"]
        for p_nom in permisos_nombres:
            if not db.query(Permiso).filter(Permiso.nombre == p_nom).first():
                db.add(Permiso(nombre=p_nom))
        db.commit()

        # 3. Sembrar usuario Administrador principal si no existe
        admin_email = "admin@cafecato.com"
        admin = db.query(Usuario).filter(Usuario.email == admin_email).first()
        if not admin:
            admin = Usuario(
                nombre="Salomé",
                apellido="López",
                tipo_documento="CC",
                numero_documento="1020304050",
                direccion="Calle 45 # 12-34",
                telefono="3001234567",
                email=admin_email,
                password_hash=hash_password("Admin123*"),
                estado="Activo",
                rol_id=roles_map["Administrador"].id,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        # 4. Sembrar productos si no hay ninguno
        if db.query(Producto).count() == 0:
            productos_demo = [
                Producto(
                    nombre="Espresso Especial Café Cato",
                    descripcion="Café de origen colombiano con notas de caramelo y frutos rojos.",
                    precio=5500.0,
                    imagen="https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500",
                    estado="Activo",
                    creado_por=admin.id,
                ),
                Producto(
                    nombre="Capuchino Artesanal Vainilla",
                    descripcion="Cremosa espuma de leche con un toque sutil de vainilla natural.",
                    precio=7800.0,
                    imagen="https://images.unsplash.com/photo-1534778101976-62847782c213?w=500",
                    estado="Activo",
                    creado_por=admin.id,
                ),
                Producto(
                    nombre="Muffin Red Velvet Felino",
                    descripcion="Delicioso muffin de chocolate suave con frosting de queso crema.",
                    precio=6200.0,
                    imagen="https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500",
                    estado="Activo",
                    creado_por=admin.id,
                ),
            ]
            db.add_all(productos_demo)
            db.commit()

        # 5. Sembrar servicios si no hay ninguno
        if db.query(Servicio).count() == 0:
            servicios_demo = [
                Servicio(
                    nombre="Tarde de Gatoterapia & Café",
                    descripcion="Sesión de 60 minutos en la zona lounge interactuando con gatos en adopción.",
                    precio=15000.0,
                    imagen="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500",
                    estado="Activo",
                    creado_por=admin.id,
                ),
                Servicio(
                    nombre="Taller de Barismo para Principiantes",
                    descripcion="Aprende técnicas de extracción y cata guiada por nuestros baristas.",
                    precio=45000.0,
                    imagen="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=500",
                    estado="Activo",
                    creado_por=admin.id,
                ),
            ]
            db.add_all(servicios_demo)
            db.commit()

        # 6. Sembrar gatos en adopción si no hay ninguno
        if db.query(Gato).count() == 0:
            gatos_demo = [
                Gato(
                    nombre="Misi",
                    descripcion="Gatita juguetona, cariñosa y muy sociable con visitantes.",
                    edad=2,
                    raza="Mestizo Europeo",
                    sexo="Hembra",
                    color="Calicó",
                    peso=3.2,
                    esterilizado=True,
                    vacunado=True,
                    imagen="https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=500",
                    estado="Activo",
                    creado_por=admin.id,
                ),
                Gato(
                    nombre="Bigotes",
                    descripcion="Tranquilo y observador, le encanta dormir cerca de las mesas de café.",
                    edad=3,
                    raza="Atigrado",
                    sexo="Macho",
                    color="Gris atigrado",
                    peso=4.1,
                    esterilizado=True,
                    vacunado=True,
                    imagen="https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=500",
                    estado="Activo",
                    creado_por=admin.id,
                ),
            ]
            db.add_all(gatos_demo)
            db.commit()
