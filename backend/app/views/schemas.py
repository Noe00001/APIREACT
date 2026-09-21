"""
schemas.py — Esquemas Pydantic v2 para validación estricta de entrada y salida.
Cumple con Criterio 2 (Pydantic v2, Create/Update/Out separados, field_validator, model_validator, Field).
"""
import re
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator, ConfigDict


# ─────────────────────────────────────────────
# 1. Esquemas de Autenticación
# ─────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico del usuario", examples=["admin@cafecato.com"])
    password: str = Field(..., min_length=6, description="Contraseña del usuario", examples=["Admin123*"])


class RegisterRequest(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=50, description="Nombre del usuario", examples=["Salomé"])
    apellido: str = Field(..., min_length=2, max_length=50, description="Apellido del usuario", examples=["López"])
    tipoDocumento: str = Field(..., min_length=2, max_length=20, description="Tipo de identificación", examples=["CC"])
    numeroDocumento: str = Field(..., min_length=6, max_length=12, description="Número de documento", examples=["1020304050"])
    direccion: str = Field(..., min_length=5, max_length=120, description="Dirección de residencia", examples=["Calle 45 # 12-34"])
    telefono: str = Field(..., min_length=7, max_length=15, description="Número telefónico", examples=["3001234567"])
    email: EmailStr = Field(..., description="Correo institucional o personal", examples=["salome@correo.com"])
    password: str = Field(..., min_length=8, max_length=50, description="Contraseña segura (mínimo 8, máximo 50 caracteres)")

    @field_validator("nombre", "apellido")
    @classmethod
    def validate_names(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$", v):
            raise ValueError("El campo solo puede contener letras y espacios")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        if not re.search(r"[A-Z]", v):
            raise ValueError("La contraseña debe contener al menos una letra mayúscula")
        if not re.search(r"[0-9]", v):
            raise ValueError("La contraseña debe contener al menos un dígito numérico")
        return v

    @field_validator("telefono")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^\d{7,15}$", v):
            raise ValueError("El teléfono solo debe contener números (entre 7 y 15 dígitos)")
        return v

    @field_validator("numeroDocumento")
    @classmethod
    def validate_document(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^\d{6,12}$", v):
            raise ValueError("El documento de identidad debe contener entre 6 y 12 dígitos")
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class RecoverPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Correo registrado para recuperación")


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., description="Token de recuperación temporal")
    password: str = Field(..., min_length=8, max_length=50, description="Nueva contraseña segura")

    @field_validator("password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v) or not re.search(r"[0-9]", v):
            raise ValueError("La nueva contraseña debe incluir al menos una mayúscula y un número")
        return v


# ─────────────────────────────────────────────
# 2. Esquemas de Usuarios (CRUD Admin)
# ─────────────────────────────────────────────

class UsuarioOut(BaseModel):
    id: int
    nombre: str
    apellido: str
    tipo_documento: str
    numero_documento: str
    direccion: str
    telefono: str
    email: str
    estado: str
    rol: str
    creado_en: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UsuarioCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=50)
    apellido: str = Field(..., min_length=2, max_length=50)
    tipoDocumento: str = Field(..., min_length=2, max_length=20)
    numeroDocumento: str = Field(..., min_length=6, max_length=12)
    direccion: str = Field(..., min_length=5, max_length=120)
    telefono: str = Field(..., min_length=7, max_length=15)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=50)
    rol: str = Field("Empleado", description="Rol del usuario (Administrador, Empleado, Cliente)")

    @field_validator("rol")
    @classmethod
    def validate_rol(cls, v: str) -> str:
        roles_validos = {"Administrador", "Empleado", "Cliente"}
        if v not in roles_validos:
            raise ValueError(f"Rol inválido. Debe ser uno de: {', '.join(roles_validos)}")
        return v


class UsuarioUpdate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=50)
    apellido: str = Field(..., min_length=2, max_length=50)
    direccion: str = Field(..., min_length=5, max_length=120)
    telefono: str = Field(..., min_length=7, max_length=15)
    email: EmailStr
    rol: str = Field(..., description="Rol del usuario")
    estado: str = Field(..., description="Estado: Activo o Inactivo")

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v: str) -> str:
        if v not in {"Activo", "Inactivo"}:
            raise ValueError("El estado debe ser 'Activo' o 'Inactivo'")
        return v


class StatusUpdate(BaseModel):
    estado: str = Field(..., description="Activo o Inactivo")

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v: str) -> str:
        if v not in {"Activo", "Inactivo"}:
            raise ValueError("El estado debe ser 'Activo' o 'Inactivo'")
        return v


# ─────────────────────────────────────────────
# 3. Esquemas de Productos
# ─────────────────────────────────────────────

class ProductoCreate(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=100, description="Nombre del producto o café", examples=["Espresso Especial"])
    descripcion: Optional[str] = Field(None, max_length=255, description="Descripción organoléptica", examples=["Notas frutales y chocolate amargo"])
    precio: float = Field(..., gt=0, description="Precio unitario en pesos COP", examples=[6500.0])
    imagen: Optional[str] = Field(None, description="URL o base64 de la imagen")

    @field_validator("nombre")
    @classmethod
    def validate_nombre_prod(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("El nombre debe tener al menos 3 caracteres")
        return v


class ProductoUpdate(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=255)
    precio: float = Field(..., gt=0)
    imagen: Optional[str] = None
    estado: str = Field("Activo", description="Activo o Inactivo")

    @field_validator("estado")
    @classmethod
    def validate_estado_prod(cls, v: str) -> str:
        if v not in {"Activo", "Inactivo"}:
            raise ValueError("El estado debe ser 'Activo' o 'Inactivo'")
        return v


class ProductoOut(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    imagen: Optional[str] = None
    estado: str
    creado_en: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# 4. Esquemas de Servicios
# ─────────────────────────────────────────────

class ServicioCreate(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=100, examples=["Sesión de Cat Café"])
    descripcion: Optional[str] = Field(None, max_length=255)
    precio: Optional[float] = Field(None, ge=0, description="Precio del servicio (opcional/gratuito si es 0)")
    imagen: Optional[str] = None

    @field_validator("nombre")
    @classmethod
    def validate_nombre_serv(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("El nombre debe tener al menos 3 caracteres")
        return v


class ServicioUpdate(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=255)
    precio: Optional[float] = Field(None, ge=0)
    imagen: Optional[str] = None
    estado: str = Field("Activo")


class ServicioOut(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    imagen: Optional[str] = None
    estado: str

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# 5. Esquemas de Gatos en Adopción
# ─────────────────────────────────────────────

class GatoCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100, examples=["Pelusa"])
    descripcion: Optional[str] = Field(None, max_length=255, examples=["Gatito tierno y cariñoso"])
    edad: int = Field(0, ge=0, le=30, description="Edad estimada en años")
    raza: Optional[str] = Field(None, max_length=80, examples=["Siamés"])
    sexo: Optional[str] = Field("Macho", description="Macho o Hembra")
    color: Optional[str] = Field(None, max_length=60, examples=["Blanco con manchas"])
    peso: Optional[float] = Field(None, gt=0, le=20.0, description="Peso en kilogramos")
    esterilizado: bool = Field(False, description="Indica si cuenta con cirugía de esterilización")
    vacunado: bool = Field(False, description="Indica si tiene esquema de vacunación al día")
    imagen: Optional[str] = None

    @field_validator("sexo")
    @classmethod
    def validate_sexo(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in {"Macho", "Hembra", "Desconocido"}:
            raise ValueError("El sexo debe ser 'Macho', 'Hembra' o 'Desconocido'")
        return v

    @model_validator(mode="after")
    def validate_adopcion_rules(self) -> "GatoCreate":
        # Regla de dominio: gatos mayores de 10 años deben tener atención especial registrada en descripción
        if self.edad >= 10 and not self.descripcion:
            self.descripcion = "Gato senior que requiere hogar tranquilo y mucho cariño."
        return self


class GatoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    descripcion: Optional[str] = None
    edad: Optional[int] = Field(None, ge=0, le=30)
    raza: Optional[str] = None
    sexo: Optional[str] = None
    color: Optional[str] = None
    peso: Optional[float] = Field(None, gt=0, le=20.0)
    esterilizado: Optional[bool] = None
    vacunado: Optional[bool] = None
    imagen: Optional[str] = None
    estado: Optional[str] = "Activo"


class GatoStatusUpdate(BaseModel):
    estado: str = Field(..., description="Activo o Inactivo")

    @field_validator("estado")
    @classmethod
    def validate_gato_estado(cls, v: str) -> str:
        if v not in {"Activo", "Inactivo"}:
            raise ValueError("El estado debe ser 'Activo' o 'Inactivo'")
        return v


class GatoOut(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    edad: int
    raza: Optional[str] = None
    sexo: Optional[str] = None
    color: Optional[str] = None
    peso: Optional[float] = None
    esterilizado: bool
    vacunado: bool
    imagen: Optional[str] = None
    estado: str
    creado_en: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# 6. Esquemas de Inteligencia Artificial (Criterio 7)
# ─────────────────────────────────────────────

class RecomendacionIARequest(BaseModel):
    estado_animo: str = Field(
        ...,
        description="Estado de ánimo o momento del día del comensal",
        examples=["Relajado", "Cansado y necesito energía", "Productivo", "Curioso"]
    )
    preferencia_sabor: Optional[str] = Field(
        "balanceado",
        description="Preferencia de sabor: dulce, amargo, cítrico, intenso, suave o balanceado",
        examples=["intenso"]
    )
    gusta_gatos: bool = Field(
        True,
        description="Indica si le gustaría acompañar su café con interacción felina"
    )


class RecomendacionIAResponse(BaseModel):
    mensaje_sommelier: str = Field(..., description="Análisis personalizado generado por el sommelier de IA")
    cafe_recomendado: str = Field(..., description="Nombre del café o producto ideal")
    maridaje_sugerido: str = Field(..., description="Acompañamiento o postre recomendado")
    gato_companero: Optional[str] = Field(None, description="Gatito en adopción recomendado para acompañar la visita")
    modelo_ia_utilizado: str = Field(..., description="Nombre del modelo o motor de IA ejecutado")


# ─────────────────────────────────────────────────────────────
# 7. Esquemas Quinto Avance: Ventas, Facturas, PQR, Chatbot, Dashboards
# ─────────────────────────────────────────────────────────────

# --- MÓDULO DE VENTAS ---
class DetalleVentaCreate(BaseModel):
    tipo_item: str = Field("Producto", description="Tipo: Producto o Servicio")
    producto_id: Optional[int] = Field(None, description="ID del producto si aplica")
    servicio_id: Optional[int] = Field(None, description="ID del servicio si aplica")
    nombre_item: str = Field(..., min_length=2, max_length=150, description="Nombre descriptivo del producto/servicio")
    cantidad: int = Field(1, ge=1, description="Cantidad vendida")
    precio_unitario: float = Field(..., ge=0, description="Precio unitario")
    subtotal: Optional[float] = Field(None, ge=0, description="Subtotal de la línea")


class DetalleVentaOut(BaseModel):
    id: int
    venta_id: int
    tipo_item: str
    producto_id: Optional[int] = None
    servicio_id: Optional[int] = None
    nombre_item: str
    cantidad: int
    precio_unitario: float
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


class VentaCreate(BaseModel):
    cliente_id: Optional[int] = Field(None, description="ID del cliente comprador (opcional si se deduce del token)")
    metodo_pago: str = Field("Efectivo", description="Efectivo, Tarjeta de Crédito, Tarjeta de Débito, Transferencia")
    descuentos: float = Field(0.0, ge=0, description="Valor total de descuentos aplicados")
    impuestos: float = Field(0.0, ge=0, description="Valor de impuestos aplicados")
    detalles: List[DetalleVentaCreate] = Field(..., min_length=1, description="Lista de productos y servicios vendidos")


class VentaOut(BaseModel):
    id: int
    numero_venta: str
    cliente_id: int
    cliente_nombre: Optional[str] = None
    cliente_documento: Optional[str] = None
    operador_id: int
    operador_nombre: Optional[str] = None
    subtotal: float
    descuentos: float
    impuestos: float
    total: float
    metodo_pago: str
    estado: str
    fecha_hora: datetime
    detalles: List[DetalleVentaOut] = []
    factura_id: Optional[int] = None
    numero_factura: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- REPORTES Y FACTURACIÓN ---
class DetalleFacturaOut(BaseModel):
    id: int
    factura_id: int
    descripcion: str
    cantidad: int
    precio_unitario: float
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


class FacturaOut(BaseModel):
    id: int
    numero_factura: str
    venta_id: int
    numero_venta: Optional[str] = None
    cliente_id: int
    cliente_nombre: Optional[str] = None
    cliente_documento: Optional[str] = None
    cliente_email: Optional[str] = None
    cliente_telefono: Optional[str] = None
    cliente_direccion: Optional[str] = None
    fecha_emision: datetime
    subtotal: float
    impuestos: float
    total: float
    estado: str
    detalles: List[DetalleFacturaOut] = []

    model_config = ConfigDict(from_attributes=True)


# --- MÓDULO PQR ---
class PQRCreate(BaseModel):
    tipo: str = Field("Peticion", description="Peticion, Queja, Reclamo o Sugerencia")
    asunto: str = Field(..., min_length=3, max_length=150, description="Asunto breve de la PQR")
    descripcion: str = Field(..., min_length=5, description="Descripción detallada de la solicitud")


class PQRRespuesta(BaseModel):
    respuesta: str = Field(..., min_length=3, description="Texto de respuesta formal a la PQR")
    estado: str = Field("Respondida", description="Estado final: En Proceso, Respondida, Cerrada")


class PQROut(BaseModel):
    id: int
    radicado: str
    cliente_id: int
    cliente_nombre: Optional[str] = None
    cliente_email: Optional[str] = None
    tipo: str
    asunto: str
    descripcion: str
    estado: str
    respuesta: Optional[str] = None
    respondido_por: Optional[int] = None
    respondido_por_nombre: Optional[str] = None
    fecha_creacion: datetime
    fecha_respuesta: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- CHATBOT & IA ---
class ChatbotMessageRequest(BaseModel):
    session_id: Optional[str] = Field(None, description="Identificador único de la sesión de chat")
    message: str = Field(..., min_length=1, description="Pregunta o consulta del usuario")


class ChatbotMessageResponse(BaseModel):
    session_id: str
    reply: str
    sender: str = "asistente"
    timestamp: datetime = Field(default_factory=datetime.now)


# --- DASHBOARDS Y ANALÍTICA ---
class DashboardKPIsOut(BaseModel):
    total_usuarios: int
    total_productos: int
    total_servicios: int
    total_ventas: int
    facturacion_total: float
    ventas_hoy: float
    pqrs_recibidas: int
    pqrs_pendientes: int


class ChartItem(BaseModel):
    label: str
    valor: float
    cantidad: int


class DashboardAnalyticsOut(BaseModel):
    kpis: DashboardKPIsOut
    ventas_por_dia: List[ChartItem]
    ventas_por_categoria: List[ChartItem]
    top_mas_vendidos: List[ChartItem]
