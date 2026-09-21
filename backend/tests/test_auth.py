"""
test_auth.py — Pruebas del módulo de autenticación y autorización JWT.
"""
def test_login_exitoso(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin.test@cafecato.com", "password": "AdminPass123*"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin.test@cafecato.com"
    assert data["user"]["rol"] == "Administrador"


def test_login_credenciales_invalidas(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin.test@cafecato.com", "password": "PasswordIncorrecta999"}
    )
    assert response.status_code == 401
    assert "Correo o contraseña incorrectos" in response.json()["detail"]


def test_registro_cliente_exitoso(client):
    payload = {
        "nombre": "Carlos Alberto",
        "apellido": "Gómez Pérez",
        "tipoDocumento": "CC",
        "numeroDocumento": "8877665544",
        "direccion": "Avenida Siempre Viva 742",
        "telefono": "3158877665",
        "email": "carlos.gomez@test.com",
        "password": "Password123*",
    }
    response = client.post("/api/usuarios/registro", json=payload)
    assert response.status_code == 201
    assert response.json()["message"] == "Usuario registrado exitosamente"


def test_registro_duplicado_conflicto(client):
    payload = {
        "nombre": "Carlos Alberto",
        "apellido": "Gómez Pérez",
        "tipoDocumento": "CC",
        "numeroDocumento": "8877665544",
        "direccion": "Avenida Siempre Viva 742",
        "telefono": "3158877665",
        "email": "carlos.gomez@test.com",
        "password": "Password123*",
    }
    response = client.post("/api/usuarios/registro", json=payload)
    assert response.status_code == 409
    assert "ya está registrado" in response.json()["detail"]


def test_consultar_perfil_me(client, admin_headers):
    response = client.get("/api/auth/me", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "admin.test@cafecato.com"


def test_consultar_perfil_sin_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 403 or response.status_code == 401
