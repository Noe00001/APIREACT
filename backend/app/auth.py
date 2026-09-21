"""
auth.py — Utilidades de autenticación: hashing de contraseñas y JWT.
Café Salomé - Backend FastAPI

El JWT incluye: sub (user_id), email, role y exp (expiración).
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key_change_in_production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Esquema Bearer para extraer el token de la cabecera Authorization
bearer_scheme = HTTPBearer()


def hash_password(plain_password: str) -> str:
    """Genera el hash bcrypt seguro de una contraseña en texto plano."""
    pwd_bytes = plain_password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica que una contraseña en texto plano coincida con el hash almacenado."""
    pwd_bytes = plain_password.encode("utf-8")[:72]
    hash_bytes = hashed_password.encode("utf-8")
    try:
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Genera un JWT que incluye:
      - sub: ID del usuario (string)
      - email: correo del usuario
      - role: nombre del rol (Administrador / Empleado / Cliente)
      - exp: fecha/hora de expiración
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Dependencia de FastAPI que:
    1. Extrae el token del header Authorization: Bearer <token>
    2. Valida existencia, firma y expiración del JWT
    3. Verifica que el usuario exista y esté activo
    Lanza 401 si cualquier verificación falla.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado o token inválido",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(Usuario).filter(
        Usuario.id == int(user_id),
        Usuario.estado == "Activo"
    ).first()

    if user is None:
        raise credentials_exception

    return user


def require_role(*roles: str):
    """
    Dependencia de FastAPI que exige que el usuario tenga uno de los roles dados.
    El control de roles se realiza en el backend — no puede ser burlado desde el frontend.

    Uso: Depends(require_role('Administrador'))
         Depends(require_role('Administrador', 'Empleado'))
    """
    def checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if current_user.rol.nombre not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para realizar esta acción",
            )
        return current_user
    return checker
