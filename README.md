# CAFETERÍA - CAT CAFÉ WEB (CAFÉ CATO / CAFÉ SALOMÉ)

**Ficha:** 3406211  
**Programa:** Tecnólogo en Análisis y Desarrollo de Software (Código 228118)  
**Aprendiz:** SALOMÉ LÓPEZ ESTRADA  
**Instructor:** César Augusto Moreno Mena  
**Proyecto:** Sistema de Gestión y Catálogo Web para Cat Café y Barismo  

---

## 🏛️ 1. Arquitectura del Sistema

El sistema implementa una arquitectura moderna desacoplada en capas:

```
┌─────────────────────────┐          HTTP / JSON          ┌─────────────────────────┐
│     FRONTEND (SPA)      │ ◄───────────────────────────► │      BACKEND (API)      │
│  React 19 + Vite + CSS  │   CORS + JWT Authorization    │   FastAPI (Python 3.10+)│
│     Puerto: :5173       │                               │      Puerto: :8000      │
└─────────────────────────┘                               └────────────┬────────────┘
                                                                       │
                                              SQLAlchemy 2.0 ORM       │  BackgroundTasks
                                           (MySQL / SQLite Persistente)│  (Auditoría & Mail)
                                                                       ▼
                                                          ┌─────────────────────────┐
                                                          │   PERSISTENCIA REAL     │
                                                          │ cafe_cato.db / MySQL    │
                                                          └─────────────────────────┘
```

---

## 📋 2. Matriz de Cumplimiento de Criterios SENA

| # | Criterio Verificable | Estado | Evidencia y Ubicación en el Código |
|---|----------------------|:------:|-----------------------------------|
| **1** | **Diseño y fundamentos REST** | **CUMPLE** | Verbos HTTP semánticos (GET, POST, PUT, DELETE, PATCH), códigos de estado (200, 201, 404, 422). Parámetros validados con `Annotated`, `Path` y `Query` en [`app/routes/products.py`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/backend/app/routes/products.py) y [`app/routes/gatos.py`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/backend/app/routes/gatos.py). CRUD completo implementado para Productos, Servicios, Gatos y Usuarios. |
| **2** | **Modelado y validación de datos (Pydantic)** | **CUMPLE** | Esquemas Pydantic v2 separados (`Create`, `Update`, `Out`). Restricciones con `Field` (`gt`, `ge`, `min_length`, `max_length`), validaciones con `@field_validator` y `@model_validator` en [`app/schemas.py`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/backend/app/schemas.py). |
| **3** | **Persistencia de datos (SQLAlchemy)** | **CUMPLE** | Modelos SQLAlchemy 2.0 con relaciones bidireccionales (`relationship`, `ForeignKey`) entre `Rol`, `Usuario`, `Producto`, `Servicio`, `Gato` y `AuditoriaLog` en [`app/models.py`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/backend/app/models.py). Persistencia real en base de datos física (MySQL / SQLite persistente `cafe_cato.db`) con inicialización y auto-seed en [`app/database.py`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/backend/app/database.py). |
| **4** | **Autenticación y autorización** | **CUMPLE** | Autenticación basada en JWT (Bearer token con `python-jose` y `bcrypt`), protección de endpoints mediante dependencias `get_current_user` y control estricto de roles con `require_role('Administrador')` en [`app/auth.py`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/backend/app/auth.py). Flujo OAuth2 habilitado para Swagger UI. |
| **5** | **Manejo de errores y middlewares** | **CUMPLE** | Manejadores globales de excepción en [`app/main.py`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/backend/app/main.py) para `HTTPException`, `RequestValidationError` (422 detallado) y `500`. Middleware CORS configurado permitiendo orígenes del frontend React. |
| **6** | **Asincronía y tareas en segundo plano** | **CUMPLE** | Endpoints construidos con `async/await`. Ejecución de tareas asíncronas no bloqueantes con `BackgroundTasks` en [`app/tasks.py`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/backend/app/tasks.py) para registro de auditoría de acciones y simulación de correos electrónicos. |
| **7** | **Integración de Inteligencia Artificial** | **CUMPLE** | Router [`app/routes/ia.py`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/backend/app/routes/ia.py) que expone el endpoint `POST /api/ia/recomendar`. Soporta integración con APIs externas (Google Gemini / OpenAI) gestionadas 100% por variables de entorno (`AI_API_KEY` en `.env`), junto con motor de IA semántico experto de dominio integrado como fallback resiliente. |
| **8** | **Documentación y preparación para despliegue** | **CUMPLE** | Swagger UI (`/docs`) y ReDoc (`/redoc`) enriquecidos con `openapi_tags`, descripciones, resumen y ejemplos. Archivos [`backend/requirements.txt`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/backend/requirements.txt), [`backend/.env.example`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/backend/.env.example) y [`frontend/.env.example`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/frontend/.env.example). |
| **9** | **Pruebas (Testing)** | **CUMPLE** | Suite completa con `pytest` y `TestClient` en [`backend/tests/`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/backend/tests/) con 19 pruebas unitarias y de integración que cubren autenticación, roles, CRUDs completos, validaciones de Pydantic y el servicio de IA (100% PASS). |
| **10** | **Frontend — React** | **CUMPLE** | Cliente HTTP centralizado en [`frontend/src/services/api.js`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/frontend/src/services/api.js) leyendo la URL del backend mediante la variable `import.meta.env.VITE_API_URL`. CRUD completo en la interfaz (listar, crear, editar, eliminar y cambiar estado). Validación en cliente y servidor con estados de carga (*loading*) y manejo de errores. Componente interactivo [`AiCoffeeRecommender.js`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/frontend/src/components/AiCoffeeRecommender.js) integrado en la Home. |
| **11** | **Comparativa técnica y sustentación** | **CUMPLE** | Documento técnico formal de sustentación [`COMPARATIVA_FASTAPI_VS_DRF.md`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/COMPARATIVA_FASTAPI_VS_DRF.md) con análisis multidimensional entre FastAPI y Django REST Framework, justificación de arquitectura y decisiones técnicas. |

---

## 🚀 3. Instrucciones de Instalación y Ejecución

### Requisitos Previos
- Python 3.10 o superior.
- Node.js 18 o superior y npm.

---

### Paso 1: Ejecutar el Backend (FastAPI)

1. Abrir una terminal en la carpeta `backend`:
   ```powershell
   cd c:\Users\User\Desktop\SOFTWARE\APIREACT\backend
   ```
2. Activar el entorno virtual:
   ```powershell
   venv\Scripts\activate
   ```
3. Instalar dependencias (si no se han instalado):
   ```powershell
   pip install -r requirements.txt
   ```
4. Iniciar el servidor Uvicorn:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```
5. Acceder a la documentación interactiva:
   - **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

> **Credenciales de Administrador por defecto:**
> - **Correo:** `admin@cafecato.com`
> - **Contraseña:** `Admin123*`

---

### Paso 2: Ejecutar las Pruebas Automatizadas (Pytest)

En la terminal del backend con el entorno virtual activo:
```powershell
pytest tests -v
```
*Todas las 19 pruebas se ejecutarán y deberán pasar en verde (100% de éxito).*

---

### Paso 3: Ejecutar el Frontend (React + Vite)

1. Abrir otra terminal en la carpeta `frontend`:
   ```powershell
   cd c:\Users\User\Desktop\SOFTWARE\APIREACT\frontend
   ```
2. Instalar paquetes de npm (si no se han instalado):
   ```powershell
   npm install
   ```
3. Iniciar el servidor de desarrollo Vite:
   ```powershell
   npm start
   ```
   *(o `npx vite`)*
4. Abrir en el navegador:
   - **Aplicación Web:** [http://localhost:5173](http://localhost:5173)

---

## 🌐 4. Principales Endpoints de la API

| Módulo | Método | Ruta | Seguridad / Rol | Descripción |
|---|:---:|---|:---:|---|
| **Auth** | `POST` | `/api/auth/login` | Público | Autenticación JSON; entrega JWT y perfil |
| **Auth** | `POST` | `/api/auth/token` | Estándar OAuth2 | Token para botón *Authorize* en Swagger UI |
| **Auth** | `GET` | `/api/auth/me` | Bearer Token | Retorna perfil del usuario autenticado |
| **IA** | `POST` | `/api/ia/recomendar` | Público | Sommelier de Café & Cat Matchmaker con IA |
| **Productos** | `GET` | `/api/productos` | Público | Listar productos activos (con filtros y búsqueda) |
| **Productos** | `GET` | `/api/productos/{id}` | Público | Consultar producto individual por ID |
| **Productos** | `GET` | `/api/productos/admin`| Administrador | Listar catálogo completo para administración |
| **Productos** | `POST` | `/api/productos` | Administrador | Crear producto (despacha BackgroundTask) |
| **Productos** | `PUT` | `/api/productos/{id}`| Administrador | Actualizar información del producto |
| **Productos** | `DELETE`| `/api/productos/{id}`| Administrador | Desactivar / eliminar producto |
| **Gatos** | `GET` | `/api/gatos` | Público | Listar gatos en adopción con filtros |
| **Gatos** | `POST` | `/api/gatos` | Administrador | Registrar gato (con validación de edad y ficha) |
| **Gatos** | `DELETE`| `/api/gatos/{id}` | Administrador | Eliminar gato del catálogo |
| **Servicios** | `GET` | `/api/servicios` | Público | Listar servicios y talleres de barismo |
| **Usuarios** | `POST` | `/api/usuarios/registro`| Público | Auto-registro con envío asíncrono de bienvenida |
| **Usuarios** | `GET` | `/api/usuarios` | Administrador | CRUD completo y auditoría de usuarios |

---

## 📖 5. Documento de Sustentación Técnica

Para conocer la justificación arquitectónica completa y el análisis comparativo entre **FastAPI** y **Django REST Framework**, consulta el documento:
👉 [`COMPARATIVA_FASTAPI_VS_DRF.md`](file:///c:/Users/User/Desktop/SOFTWARE/APIREACT/COMPARATIVA_FASTAPI_VS_DRF.md)
