import sqlite3
from datetime import datetime

conn = sqlite3.connect('cafe_cato.db')
cursor = conn.cursor()

productos = [
    ('Té Matcha Helado', 'Bebida refrescante de té verde', 12000.00, 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=500&q=80'),
    ('Café Americano', 'Clásico americano con granos seleccionados', 6000.00, 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=500&q=80'),
    ('Cheesecake de Frambuesa', 'Delicioso pastel de queso con salsa de frambuesa', 15000.00, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&q=80'),
    ('Croissant de Almendras', 'Croissant hojaldrado relleno de crema de almendras', 8000.00, 'https://images.unsplash.com/photo-1518110925501-44445cdbe7b2?w=500&q=80'),
    ('Batido de Fresa y Plátano', 'Batido natural con leche descremada', 10000.00, 'https://images.unsplash.com/photo-1628557044797-f21a177c37ec?w=500&q=80'),
    ('Galletas con Chispas', 'Galletas artesanales recién horneadas', 4500.00, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&q=80'),
    ('Sandwich Caprese', 'Pan artesanal con tomate, mozzarella y pesto', 18000.00, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&q=80'),
    ('Ensalada Felina', 'Mix de verdes con trozos de pollo y aderezo', 20000.00, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80'),
    ('Té Chai Latte', 'Té especiado con leche espumosa', 9500.00, 'https://images.unsplash.com/photo-1576092762791-dd9e2220abd4?w=500&q=80'),
    ('Macarons Surtidos', 'Caja de 4 macarons de diferentes sabores', 14000.00, 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500&q=80')
]

servicios = [
    ('Taller de Repostería Felina', 'Aprende a hacer snacks seguros para gatos', 55000.00, 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500&q=80'),
    ('Suscripción Cat Lover', 'Acceso libre al café y mimos ilimitados por un mes', 80000.00, 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&q=80'),
    ('Fotografía con Gatos', 'Sesión de 30 minutos con fotógrafo profesional', 45000.00, 'https://images.unsplash.com/photo-1516280440502-861009088ab7?w=500&q=80'),
    ('Celebración de Cumpleaños Miau', 'Reserva de espacio para hasta 5 personas', 120000.00, 'https://images.unsplash.com/photo-1530103862676-de8892bf309c?w=500&q=80'),
    ('Clase de Yoga con Gatos', 'Relajación y meditación junto a nuestros felinos', 35000.00, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80'),
    ('Asesoría de Adopción', 'Asesoría virtual sobre cómo preparar tu hogar', 20000.00, 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=500&q=80'),
    ('Paseo Guiado de Socialización', 'Aprende a presentar a tu nuevo gato con otros', 30000.00, 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=500&q=80'),
    ('Seminario: Lenguaje Felino', 'Charla de comportamiento felino', 40000.00, 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=500&q=80'),
    ('Club de Lectura y Ronroneos', 'Tarde de lectura en la zona de gatos', 10000.00, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&q=80'),
    ('Tarde de Juegos', 'Sesión guiada de juego para ejercitar a los gatos', 15000.00, 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=500&q=80')
]

gatos = [
    ('Garfield', 'Gato naranja y perezoso, le encanta comer', 3, 'Mestizo', 'Macho', 'Naranja', 6.5, 1, 1, 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=500&q=80'),
    ('Luna', 'Gatita muy curiosa y juguetona', 1, 'Bombay', 'Hembra', 'Negro', 3.2, 1, 1, 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&q=80'),
    ('Simba', 'Gato con espíritu aventurero', 2, 'Angora', 'Macho', 'Dorado', 4.8, 1, 1, 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=500&q=80'),
    ('Pelusa', 'Extremadamente cariñosa y suave', 4, 'Persa', 'Hembra', 'Blanco', 5.0, 1, 1, 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=500&q=80'),
    ('Salem', 'Misterioso y elegante, amante de las alturas', 5, 'Mestizo', 'Macho', 'Negro', 4.5, 1, 1, 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=500&q=80'),
    ('Nala', 'Gatita tímida pero muy tierna', 2, 'Siames', 'Hembra', 'Crema', 3.8, 1, 1, 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500&q=80'),
    ('Félix', 'Gato enérgico, ideal para casas con niños', 1, 'Europeo', 'Macho', 'Bicolor', 4.1, 1, 1, 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=500&q=80'),
    ('Tom', 'Siempre buscando atención y mimos', 3, 'Azul Ruso', 'Macho', 'Gris', 5.2, 1, 1, 'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=500&q=80'),
    ('Chloe', 'Le encanta dormir al sol durante horas', 6, 'Mestizo', 'Hembra', 'Carey', 4.0, 1, 1, 'https://images.unsplash.com/photo-1501820488136-72669149e0d4?w=500&q=80'),
    ('Oliver', 'Gato rescatado muy agradecido', 2, 'Mestizo', 'Macho', 'Atigrado', 4.3, 1, 1, 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=500&q=80')
]

creado_en = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

for p in productos:
    cursor.execute("INSERT INTO productos (nombre, descripcion, precio, imagen, estado, creado_por, creado_en) VALUES (?, ?, ?, ?, 'Activo', 1, ?)", (p[0], p[1], p[2], p[3], creado_en))

for s in servicios:
    cursor.execute("INSERT INTO servicios (nombre, descripcion, precio, imagen, estado, creado_por, creado_en) VALUES (?, ?, ?, ?, 'Activo', 1, ?)", (s[0], s[1], s[2], s[3], creado_en))

for g in gatos:
    cursor.execute("INSERT INTO gatos (nombre, descripcion, edad, raza, sexo, color, peso, esterilizado, vacunado, imagen, estado, creado_por, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo', 1, ?)", (g[0], g[1], g[2], g[3], g[4], g[5], g[6], g[7], g[8], g[9], creado_en))

conn.commit()
conn.close()
print('Datos insertados correctamente.')
