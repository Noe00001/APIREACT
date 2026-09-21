# Café Salome

Aplicación React conectada a una API Node.js/Express y MySQL para XAMPP. Incluye registro de clientes, inicio de sesión con JWT, hashing de contraseñas, roles y endpoints CRUD de productos.

## Configuración con XAMPP

1. Inicia **Apache** y **MySQL** desde el panel de XAMPP.
2. Abre `http://localhost/phpmyadmin`, crea/importa la base ejecutando [`backend/schema.sql`](backend/schema.sql) en la pestaña SQL.
3. Copia `.env.example` como `.env` dentro de la raíz del proyecto y ajusta `DB_USER`, `DB_PASSWORD` y `JWT_SECRET` según tu instalación.
4. Instala dependencias con `npm install`.

## Ejecución

En una terminal ejecuta `npm run server` para levantar la API en `http://localhost:5000`.
En otra terminal ejecuta `npm start` para abrir React en `http://localhost:3000`.

La API expone registro, login, recuperación (`/api/auth/*`), CRUD de usuarios (`/api/users`), productos (`/api/products`) y servicios (`/api/services`). Las rutas administrativas exigen un JWT con rol `Administrador`. El frontend incluye panel de administrador, empleado y cliente, con navegación protegida por JWT. Para probar las rutas protegidas con Postman, envía el token como `Authorization: Bearer <token>`.

## Crear una cuenta de administrador

Los registros públicos se crean como `Cliente`. Después de registrar la cuenta, asígnale el rol administrador desde phpMyAdmin:

```sql
UPDATE usuarios
SET rol_id = (SELECT id FROM roles WHERE nombre = 'Administrador')
WHERE email = 'tu-correo@example.com';
```

Cierra sesión y vuelve a iniciar sesión. En `Mi panel` aparecerá la administración del catálogo. Allí puedes agregar productos o servicios mediante el formulario; los visitantes, clientes y empleados solo pueden consultar los registros activos en la sección pública de Inicio. Las acciones de escritura también están protegidas en el backend, por lo que no se pueden ejecutar modificando el navegador.

## Imágenes del catálogo

Si la base `cafe_cato` ya existía, ejecuta una sola vez [`backend/migration-images.sql`](backend/migration-images.sql) en phpMyAdmin. Después reinicia `npm run server`. El formulario de administrador acepta imágenes JPG, PNG o WebP de máximo 3 MB; se guardan como datos en la columna `imagen` y se muestran en las cartas públicas de Inicio.

## Scripts del frontend

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
