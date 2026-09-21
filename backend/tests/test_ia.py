"""
test_ia.py — Pruebas del endpoint con Inteligencia Artificial.
"""
def test_recomendar_cafe_ia(client):
    payload = {
        "estado_animo": "Cansado, necesito energía para estudiar",
        "preferencia_sabor": "intenso",
        "gusta_gatos": True,
    }
    response = client.post("/api/ia/recomendar", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "mensaje_sommelier" in data
    assert len(data["mensaje_sommelier"]) > 10
    assert "cafe_recomendado" in data
    assert "maridaje_sugerido" in data
    assert "modelo_ia_utilizado" in data
    assert data["gato_companero"] is not None


def test_recomendar_cafe_sin_gatos(client):
    payload = {
        "estado_animo": "Tranquilo",
        "preferencia_sabor": "dulce",
        "gusta_gatos": False,
    }
    response = client.post("/api/ia/recomendar", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["gato_companero"] is None
