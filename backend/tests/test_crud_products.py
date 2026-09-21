"""
test_crud_products.py — Pruebas de CRUD de productos y validaciones Pydantic v2.
"""
def test_listar_productos_publico(client):
    response = client.get("/api/productos")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_crear_producto_admin(client, admin_headers):
    payload = {
        "nombre": "Café Mocca Especial",
        "descripcion": "Café con chocolate amargo y leche vaporizada.",
        "precio": 8500.0,
        "imagen": "https://via.placeholder.com/150",
    }
    response = client.post("/api/productos", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["nombre"] == "Café Mocca Especial"
    assert data["precio"] == 8500.0
    assert "id" in data


def test_crear_producto_sin_autorizacion(client):
    payload = {
        "nombre": "Café No Autorizado",
        "precio": 5000.0,
    }
    response = client.post("/api/productos", json=payload)
    assert response.status_code in (401, 403)


def test_validacion_pydantic_precio_negativo(client, admin_headers):
    payload = {
        "nombre": "Café Inválido",
        "precio": -100.0,  # Violación de Field(gt=0)
    }
    response = client.post("/api/productos", json=payload, headers=admin_headers)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert "detail" in data


def test_consultar_producto_por_id(client, admin_headers):
    # Creamos uno primero
    creado = client.post(
        "/api/productos",
        json={"nombre": "Latte Vainilla Test", "precio": 7000.0},
        headers=admin_headers
    ).json()

    prod_id = creado["id"]
    response = client.get(f"/api/productos/{prod_id}")
    assert response.status_code == 200
    assert response.json()["nombre"] == "Latte Vainilla Test"


def test_actualizar_producto(client, admin_headers):
    creado = client.post(
        "/api/productos",
        json={"nombre": "Americano Original", "precio": 4500.0},
        headers=admin_headers
    ).json()

    prod_id = creado["id"]
    response = client.put(
        f"/api/productos/{prod_id}",
        json={"nombre": "Americano Doble", "precio": 5500.0, "estado": "Activo"},
        headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json()["nombre"] == "Americano Doble"
    assert response.json()["precio"] == 5500.0


def test_desactivar_producto(client, admin_headers):
    creado = client.post(
        "/api/productos",
        json={"nombre": "Producto a Borrar", "precio": 3000.0},
        headers=admin_headers
    ).json()

    prod_id = creado["id"]
    response = client.delete(f"/api/productos/{prod_id}", headers=admin_headers)
    assert response.status_code == 200
    assert "eliminado exitosamente" in response.json()["message"]
