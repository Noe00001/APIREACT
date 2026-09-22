import sqlite3

def update_images():
    conn = sqlite3.connect('cafe_cato.db')
    cursor = conn.cursor()

    # Productos
    productos = {
        'Té Matcha Helado': 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=500&q=80',
        'Café Americano': 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=500&q=80',
        'Cheesecake de Frambuesa': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&q=80',
        'Croissant de Almendras': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80',
        'Batido de Fresa y Plátano': 'https://images.unsplash.com/photo-1628557044797-f21a177c37ec?w=500&q=80',
        'Galletas con Chispas': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&q=80',
        'Sandwich Caprese': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&q=80',
        'Ensalada Felina': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80',
        'Té Chai Latte': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&q=80',
        'Macarons Surtidos': 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500&q=80'
    }

    # Servicios
    servicios = {
        'Taller de Repostería Felina': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500&q=80',
        'Suscripción Cat Lover': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&q=80',
        'Fotografía con Gatos': 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=500&q=80',
        'Celebración de Cumpleaños Miau': 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=500&q=80',
        'Clase de Yoga con Gatos': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80',
        'Asesoría de Adopción': 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=500&q=80',
        'Paseo Guiado de Socialización': 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=500&q=80',
        'Seminario: Lenguaje Felino': 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=500&q=80',
        'Club de Lectura y Ronroneos': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&q=80',
        'Tarde de Juegos': 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=500&q=80'
    }

    # Gatos
    gatos = {
        'Garfield': 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=500&q=80',
        'Luna': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&q=80',
        'Simba': 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=500&q=80',
        'Pelusa': 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=500&q=80',
        'Salem': 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=500&q=80',
        'Nala': 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500&q=80',
        'Félix': 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=500&q=80',
        'Tom': 'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=500&q=80',
        'Chloe': 'https://images.unsplash.com/photo-1501820488136-72669149e0d4?w=500&q=80',
        'Oliver': 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=500&q=80'
    }

    for nombre, img_url in productos.items():
        cursor.execute("UPDATE productos SET imagen = ? WHERE nombre = ?", (img_url, nombre))
    
    for nombre, img_url in servicios.items():
        cursor.execute("UPDATE servicios SET imagen = ? WHERE nombre = ?", (img_url, nombre))
        
    for nombre, img_url in gatos.items():
        cursor.execute("UPDATE gatos SET imagen = ? WHERE nombre = ?", (img_url, nombre))

    conn.commit()
    conn.close()
    print('Imágenes actualizadas correctamente.')

if __name__ == '__main__':
    update_images()
