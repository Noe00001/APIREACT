"""
test_crud_gatos.py — Pruebas de CRUD de gatos en adopción.
"""
def test_listar_gatos(client):
    response = client.get("/api/gatos")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_crear_gato_admin(client, admin_headers):
    payload = {
        "nombre": "Simba",
        "descripcion": "Gatito juguetón y dócil",
        "edad": 1,
        "raza": "Criollo",
        "sexo": "Macho",
        "color": "Naranja atigrado",
        "peso": 3.5,
        "esterilizado": True,
        "vacunado": True,
    }
    response = client.post("/api/gatos", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["nombre"] == "Simba"
    assert data["edad"] == 1
    assert data["esterilizado"] is True


def test_validacion_gato_edad_negativa(client, admin_headers):
    payload = {
        "nombre": "Invalido",
        "edad": -5,  # Violación ge=0
    }
    response = client.post("/api/gatos", json=payload, headers=admin_headers)
    assert response.status_code == 422


def test_eliminar_gato(client, admin_headers):
    creado = client.post(
        "/api/gatos",
        json={"nombre": "GatoTemporal", "edad": 2},
        headers=admin_headers
    ).json()

    gato_id = creado["id"]
    response = client.delete(f"/api/gatos/{gato_id}", headers=admin_headers)
    assert response.status_code == 200
    assert "Gato eliminado" in response.json()["message"]
