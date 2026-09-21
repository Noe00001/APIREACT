"""
main.py — Punto de entrada principal de la API FastAPI de Café Cato / Café Salomé.
Cumple con los Criterios del SENA:
- Criterio 1: Diseño y fundamentos REST
- Criterio 4: Autenticación JWT y OAuth2
- Criterio 5: Manejo de errores estandarizado (HTTPException, 404, 422) y CORS
- Criterio 6: Asincronía y tareas en segundo plano
- Criterio 7: Endpoint de Inteligencia Artificial
- Criterio 8: Documentación automática enriquecida (/docs, /redoc)
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.controllers import auth, users, products, services, gatos, ia

# Configuración básica de logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cafe_cato.main")


# ─────────────────────────────────────────────
# Ciclo de vida de la aplicación (Lifespan)
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando API Café Cato...")
    try:
        init_db()
        logger.info("Base de datos inicializada y sincronizada exitosamente.")
    except Exception as exc:
        logger.error("Error al inicializar la base de datos: %s", str(exc))
    yield
    logger.info("Apagando API Café Cato...")


# ─────────────────────────────────────────────
# Tags y Metadatos para Swagger / OpenAPI
# ─────────────────────────────────────────────
tags_metadata = [
    {
        "name": "Autenticación",
        "description": "Endpoints de login JWT, flujo OAuth2, perfil de usuario y recuperación de contraseñas.",
    },
    {
        "name": "Usuarios",
        "description": "Operaciones CRUD para la administración de usuarios y roles del sistema.",
    },
    {
        "name": "Productos",
        "description": "Gestión del catálogo de cafés, bebidas y productos de panadería/repostería.",
    },
    {
        "name": "Servicios",
        "description": "Catálogo de experiencias de cat café, talleres y servicios especiales.",
    },
    {
        "name": "Gatos",
        "description": "Gestión integral de los gatos disponibles para adopción en el Cat Café.",
    },
    {
        "name": "Inteligencia Artificial",
        "description": "Servicios cognitivos de recomendación personalizada de café y maridaje con IA.",
    },
    {
        "name": "Root",
        "description": "Comprobación de estado y salud del servicio (Health Check).",
    },
]

# ─────────────────────────────────────────────
# Instancia de FastAPI
# ─────────────────────────────────────────────
app = FastAPI(
    title="Café Cato API — Cat Café & Barismo",
    description=(
        "## Sistema de Información y Gestión para Cafetería Temática (Café Cato)\n\n"
        "API RESTful de alto rendimiento desarrollada con **FastAPI**, **SQLAlchemy 2.0** y **Pydantic v2**.\n\n"
        "### Características principales:\n"
        "- 🔐 **Autenticación y Autorización**: Tokens JWT con control de acceso basado en roles (RBAC).\n"
        "- ☕ **Catálogo de Productos y Servicios**: CRUD completo con validaciones de tipos y rangos.\n"
        "- 🐱 **Módulo de Adopción Felina**: Control clínico y ficha de gatos del café.\n"
        "- 🤖 **Inteligencia Artificial**: Sommelier de café y recomendador de maridaje según estado de ánimo.\n"
        "- ⚡ **Asincronía**: Endpoints asíncronos y tareas en segundo plano (`BackgroundTasks`) para auditoría y correos.\n"
    ),
    version="2.1.0",
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─────────────────────────────────────────────
# Middlewares: CORS
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# Manejadores de Errores Estandarizados (Criterio 5)
# ─────────────────────────────────────────────

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Manejador estandarizado de excepciones HTTP con estructura JSON uniforme."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "status_code": exc.status_code,
            "message": exc.detail,
            "detail": exc.detail,
            "path": request.url.path,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Manejador de errores de validación de esquemas Pydantic (HTTP 422)."""
    errores = []
    for err in exc.errors():
        campo = " -> ".join([str(loc) for loc in err.get("loc", [])])
        errores.append({
            "campo": campo,
            "mensaje": err.get("msg"),
            "tipo": err.get("type"),
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "status_code": 422,
            "message": "Error de validación en los datos enviados",
            "detail": errores,
            "path": request.url.path,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Captura excepciones no controladas retornando HTTP 500 limpio."""
    logger.exception("Excepción no controlada en %s: %s", request.url.path, str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "status_code": 500,
            "message": "Error interno del servidor",
            "detail": str(exc),
            "path": request.url.path,
        },
    )


# ─────────────────────────────────────────────
# Inclusión de Routers del Dominio
# ─────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(services.router)
app.include_router(gatos.router)
app.include_router(ia.router)


# ─────────────────────────────────────────────
# Endpoint Raíz (Health check)
# ─────────────────────────────────────────────
@app.get("/", tags=["Root"], summary="Health check de la API")
async def root():
    return {
        "sistema": "Café Cato API",
        "estado": "Activo y Operacional ☕🐱",
        "version": "2.1.0 (FastAPI)",
        "documentacion_swagger": "/docs",
        "documentacion_redoc": "/redoc",
    }
