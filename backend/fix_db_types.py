import pymysql
import os

# Obtener los datos de conexión desde el entorno, de la misma forma que lo hace la aplicación
host = os.getenv("DB_HOST", "b7zenjdqabzmkwzpvz1c-mysql.services.clever-cloud.com")
user = os.getenv("DB_USER", "uirs5zlkfzgksqss")
password = os.getenv("DB_PASSWORD", "brQbFUjfkyO8bzYSCeja")
database = os.getenv("DB_NAME", "b7zenjdqabzmkwzpvz1c")

print(f"Conectando a {host}...")

conn = pymysql.connect(
    host=host,
    user=user,
    password=password,
    database=database
)

# Instrucciones para cambiar de INT UNSIGNED a INT (firmado) para que coincida con SQLAlchemy Integer
statements = [
    # 1. Eliminar llaves foráneas existentes
    "ALTER TABLE roles_permisos DROP FOREIGN KEY roles_permisos_ibfk_1;",
    "ALTER TABLE roles_permisos DROP FOREIGN KEY roles_permisos_ibfk_2;",
    "ALTER TABLE usuarios DROP FOREIGN KEY usuarios_ibfk_1;",
    "ALTER TABLE productos DROP FOREIGN KEY productos_ibfk_1;",
    "ALTER TABLE servicios DROP FOREIGN KEY servicios_ibfk_1;",
    "ALTER TABLE gatos DROP FOREIGN KEY gatos_ibfk_1;",

    # 2. Modificar columnas ID a INT normal
    "ALTER TABLE permisos MODIFY id INT NOT NULL AUTO_INCREMENT;",
    "ALTER TABLE roles MODIFY id INT NOT NULL AUTO_INCREMENT;",
    "ALTER TABLE roles_permisos MODIFY rol_id INT NOT NULL;",
    "ALTER TABLE roles_permisos MODIFY permiso_id INT NOT NULL;",
    "ALTER TABLE usuarios MODIFY id INT NOT NULL AUTO_INCREMENT;",
    "ALTER TABLE usuarios MODIFY rol_id INT NOT NULL;",
    "ALTER TABLE productos MODIFY id INT NOT NULL AUTO_INCREMENT;",
    "ALTER TABLE productos MODIFY creado_por INT NOT NULL;",
    "ALTER TABLE servicios MODIFY id INT NOT NULL AUTO_INCREMENT;",
    "ALTER TABLE servicios MODIFY creado_por INT NOT NULL;",
    "ALTER TABLE gatos MODIFY id INT NOT NULL AUTO_INCREMENT;",
    "ALTER TABLE gatos MODIFY creado_por INT NOT NULL;",

    # 3. Restaurar llaves foráneas
    "ALTER TABLE roles_permisos ADD CONSTRAINT roles_permisos_ibfk_1 FOREIGN KEY (rol_id) REFERENCES roles (id) ON DELETE CASCADE;",
    "ALTER TABLE roles_permisos ADD CONSTRAINT roles_permisos_ibfk_2 FOREIGN KEY (permiso_id) REFERENCES permisos (id) ON DELETE CASCADE;",
    "ALTER TABLE usuarios ADD CONSTRAINT usuarios_ibfk_1 FOREIGN KEY (rol_id) REFERENCES roles (id);",
    "ALTER TABLE productos ADD CONSTRAINT productos_ibfk_1 FOREIGN KEY (creado_por) REFERENCES usuarios (id);",
    "ALTER TABLE servicios ADD CONSTRAINT servicios_ibfk_1 FOREIGN KEY (creado_por) REFERENCES usuarios (id);",
    "ALTER TABLE gatos ADD CONSTRAINT gatos_ibfk_1 FOREIGN KEY (creado_por) REFERENCES usuarios (id);"
]

try:
    with conn.cursor() as cursor:
        for stmt in statements:
            print(f"Ejecutando: {stmt}")
            cursor.execute(stmt)
        conn.commit()
        print("¡Base de datos actualizada exitosamente! El error de llaves foráneas ha sido resuelto.")
except Exception as e:
    print(f"Error al modificar la base de datos: {e}")
finally:
    conn.close()
