# COMPARATIVA TÉCNICA: FastAPI vs. Django REST Framework (DRF)

**Programa:** Tecnólogo en Análisis y Desarrollo de Software (Código 228118)  
**Ficha:** 3406211  
**Aprendiz:** SALOMÉ LÓPEZ ESTRADA  
**Instructor:** César Augusto Moreno Mena  
**Proyecto:** CAFETERÍA - CAT CAFÉ WEB (CAFÉ CATO)  
**Fecha de Sustentación:** Septiembre de 2024 / 2026  

---

## 1. Introducción y Contexto del Proyecto

Para el desarrollo del backend del sistema de información de **Café Cato** (una cafetería temática y centro de adopción felina con catálogo interactivo, roles de acceso, tareas en segundo plano y recomendador con Inteligencia Artificial), se evaluaron las dos arquitecturas líderes en el ecosistema Python para APIs REST: **FastAPI** y **Django REST Framework (DRF)**.

El objetivo de este análisis comparativo es justificar técnica, arquitectónica y operativamente la selección de **FastAPI** frente a **Django REST Framework**, demostrando la aplicación práctica de conceptos de rendimiento, tipado moderno, asincronía y facilidad de integración con librerías de IA y clientes frontend en React.

---

## 2. Cuadro Comparativo Multidimensional

| Dimensión Técnica | FastAPI (Seleccionado) | Django REST Framework (DRF) | Impacto en el Proyecto Café Cato |
| :--- | :--- | :--- | :--- |
| **Estándar de Servidor** | **ASGI** nativo (Uvicorn / Starlette) | **WSGI** tradicional (Gunicorn / uWSGI) | FastAPI permite manejar miles de peticiones I/O concurrentes sin bloquear hilos. |
| **Asincronía** | Nativa mediante `async` / `await` | Parcial y adaptada (Django 3+ async views con limitaciones en ORM) | Fundamental para el endpoint de IA y tareas en segundo plano (`BackgroundTasks`). |
| **Validación y Serialización** | **Pydantic v2** con validación en tiempo de ejecución en Rust | **Serializers** propios de DRF basados en clases Python | Pydantic v2 es hasta 20 veces más veloz y valida directamente tipos nativos de Python. |
| **Tipado Estático** | 100% basado en *Type Hints* nativos de Python 3.10+ | Opcional, no integrado de forma nativa en los serializers | Código auto-documentado con autocompletado en el IDE y prevención de errores. |
| **Documentación de API** | Nativa y automática: **OpenAPI 3.1**, **Swagger UI** (`/docs`) y **ReDoc** (`/redoc`) | Requiere librerías de terceros (`drf-spectacular` o `drf-yasg`) | Documentación interactiva generada al instante con botón *Authorize* para JWT. |
| **Persistencia y ORM** | Agnóstico (usamos **SQLAlchemy 2.0**) con soporte flexible MySQL/SQLite | Acoplado al **Django ORM** | SQLAlchemy otorga control granular de transacciones, SQL explícito y migraciones desacopladas. |
| **Tareas en Segundo Plano** | Primitiva ligera integrada (`BackgroundTasks`) | Requiere infraestructura pesada externa (Celery + Redis / RabbitMQ) | Permite registrar auditoría y despachar correos sin sobrecarga de infraestructura. |
| **Consumo de Memoria** | Muy bajo (~35 MB en reposo) | Medio-alto (~90-140 MB por proceso) | Ideal para despliegues ligeros en la nube o contenedores Docker. |
| **Curva de Aprendizaje** | Curva suave y código minimalista y modular | Curva media-alta ("The Django Way", baterías incluidas pero rígido) | Agilidad en el desarrollo de microservicios y APIs desacopladas para React. |

---

## 3. Análisis Técnico Detallado por Componente

### 3.1. Rendimiento y Concurrencia (ASGI vs. WSGI)
- **FastAPI** se fundamenta en **Starlette** y el estándar **ASGI** (*Asynchronous Server Gateway Interface*). Esto permite que peticiones lentas (como la consulta a un modelo de IA externo o la consulta a bases de datos remotas) no bloqueen el hilo de ejecución principal (*Event Loop*).
- **Django REST Framework** opera históricamente sobre **WSGI**, donde cada petición consume un hilo o proceso del sistema operativo. Aunque las versiones recientes de Django han incorporado soporte asíncrono, su ORM y gran parte del ecosistema de middlewares siguen siendo sincrónicos por naturaleza, generando bloqueos en cargas I/O intensivas.

### 3.2. Modelado de Datos y Validación: Pydantic v2 vs. DRF Serializers
- En el proyecto Café Cato, los esquemas de entrada y salida están rigurosamente separados (`ProductoCreate`, `ProductoUpdate`, `ProductoOut`). Con **Pydantic v2**, el motor de validación está compilado en **Rust** (`pydantic-core`), lo que proporciona una validación ultrarrápida de tipos (`Field`, `field_validator`, `model_validator`).
- En DRF, los `ModelSerializers` tienden a acoplarse estrechamente al modelo de Django, lo que frecuentemente expone campos internos de la base de datos o requiere anidamientos complejos para transformar salidas personalizadas.

### 3.3. Documentación Interactiva (OpenAPI / Swagger)
- Con FastAPI, cada ruta, parámetro de ruta (`Path`), parámetro de consulta (`Query`), y cuerpo de petición (`Body`) genera automáticamente un esquema conforme a **OpenAPI 3.1**.
- En la sustentación se puede evidenciar que al visitar `http://localhost:8000/docs`, se dispone de una interfaz gráfica donde instructores y desarrolladores pueden probar en vivo los métodos HTTP (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`), autenticarse con el botón de candado mediante el Bearer token JWT y verificar los códigos HTTP de respuesta.

### 3.4. Tareas en Segundo Plano (`BackgroundTasks`)
- Una necesidad clave de Café Cato era realizar auditoría de acciones de administradores y simular el envío de correos de bienvenida sin que el cliente tuviera que esperar a que dichas operaciones culminaran.
- FastAPI provee `BackgroundTasks` de forma nativa sin configurar ningún intermediario de mensajes (*broker*). En contraste, lograr esto en Django DRF obligaría a instalar y mantener **Celery**, un servidor **Redis**, y procesos *workers* adicionales, incrementando la complejidad del despliegue.

---

## 4. Justificación de la Decisión Técnica para el Proyecto

La elección de **FastAPI** para el proyecto **Café Cato / Café Salomé** responde a los siguientes criterios estratégicos:

1. **Desacoplamiento Front-Back Óptimo:** La aplicación frontend está construida con **React + Vite**. FastAPI provee un contrato de API JSON puro, sin sobrecarga de plantillas de servidor (como las que incluye Django), facilitando el consumo centralizado mediante `api.js`.
2. **Integración Natural con IA:** El ecosistema moderno de Inteligencia Artificial (OpenAI, Google Gemini, LangChain, Hugging Face) está diseñado de forma asíncrona en Python. FastAPI permite invocar estos servicios mediante `httpx.AsyncClient` dentro de funciones `async def` sin degradar la respuesta del servidor.
3. **Persistencia Flexible y Resiliente (Criterio 3):** Gracias a SQLAlchemy 2.0, el backend puede conectarse de forma transparente a **MySQL** cuando el motor de bases de datos está encendido, o utilizar **SQLite persistente** (`cafe_cato.db`) en caso de entornos de evaluación sin servidores locales activos, garantizando persistencia real en disco sin fallos de conexión.
4. **Cumplimiento Estricto de Estándares SENA:** Facilita la implementación de los 11 criterios verificables: códigos HTTP semánticos (201 Created, 200 OK, 404 Not Found, 422 Unprocessable Content), JWT con RBAC (Control de Acceso Basado en Roles) y suite de pruebas unitarias automatizadas con `pytest` y `TestClient`.

---

## 5. Conclusión de la Sustentación

**Django REST Framework** sigue siendo una solución robusta para sistemas empresariales monolíticos que requieren un panel de administración preconstruido en HTML (Django Admin) y sistemas de permisos basados en sesiones. 

Sin embargo, para arquitecturas web modernas orientadas a **Single Page Applications (React)**, microservicios, alta concurrencia y servicios cognitivos con **Inteligencia Artificial**, **FastAPI** representa la solución técnica superior: más rápida, tipada de extremo a extremo, asíncrona por diseño y con menor deuda técnica a largo plazo.
