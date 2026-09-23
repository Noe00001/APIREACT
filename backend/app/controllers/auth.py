"""
routes/auth.py — Endpoints de autenticación: login, OAuth2 token, recuperación y perfil.
Café Salomé / Café Cato - Backend FastAPI
Cumple Criterios 1 (REST), 4 (JWT & OAuth2) y 6 (async/await).
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.database import get_db
from app.models.models import Usuario
from app.views.schemas import LoginRequest, TokenResponse, RecoverPasswordRequest, ResetPasswordRequest, CheckEmailRequest
from app.auth import verify_password, create_access_token, hash_password, SECRET_KEY, ALGORITHM, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


def _user_to_dict(user: Usuario) -> dict:
    """Serializa un objeto Usuario para el cliente frontend."""
    return {
        "id": user.id,
        "nombre": user.nombre,
        "apellido": user.apellido,
        "email": user.email,
        "rol": user.rol.nombre if user.rol else "Cliente",
        "estado": user.estado,
        "tipo_documento": user.tipo_documento,
        "numero_documento": user.numero_documento,
        "direccion": user.direccion,
        "telefono": user.telefono,
    }


@router.post(
    "/check-email",
    status_code=status.HTTP_200_OK,
    summary="Verificar si el correo existe",
    description="Permite validar si el correo existe para continuar con el ingreso de la contraseña.",
)
async def check_email(payload: CheckEmailRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(Usuario).filter(Usuario.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El correo ingresado no está registrado en el sistema."
        )
    return {"message": "Correo válido", "exists": True}


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Iniciar sesión (JSON)",
    description="Autentica al usuario con correo y contraseña. Retorna token JWT y perfil básico.",
)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(Usuario).filter(Usuario.email == email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.estado == "Inactivo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta está inactiva. Contacta al administrador.",
        )

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, token_type="bearer", user=_user_to_dict(user))


@router.post(
    "/token",
    summary="Iniciar sesión (OAuth2 estándar para Swagger /docs)",
    description="Flujo OAuth2 password request form para autorizarse directamente en la documentación interactiva.",
)
async def login_oauth2(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    email = form_data.username.strip().lower()
    user = db.query(Usuario).filter(Usuario.email == email).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.get(
    "/me",
    summary="Obtener perfil del usuario actual autenticado",
    description="Retorna la información del usuario autenticado a partir de su Bearer JWT.",
)
async def get_me(current_user: Usuario = Depends(get_current_user)):
    return _user_to_dict(current_user)


@router.post("/recover", summary="Solicitud de recuperación de contraseña")
async def recover_password(payload: RecoverPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(Usuario).filter(Usuario.email == email).first()

    if not user:
        return {"message": "Si el correo está registrado, recibirás un token de recuperación."}

    token = create_access_token({"sub": str(user.id), "type": "reset"})
    return {
        "message": "Token de recuperación generado exitosamente.",
        "resetToken": token
    }


@router.post("/reset-password", summary="Restablecer contraseña con token")
async def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        data = jwt.decode(payload.token, SECRET_KEY, algorithms=[ALGORITHM])
        if data.get("type") != "reset":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido para restablecimiento")
        user_id = data.get("sub")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El token es inválido o ha expirado")

    user = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    user.password_hash = hash_password(payload.password)
    db.commit()
    return {"message": "Contraseña actualizada correctamente"}
