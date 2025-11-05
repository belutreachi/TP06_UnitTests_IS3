# TikTask

TikTask es una aplicación web moderna de gestión de tareas construida con Node.js, Express y SQLite.

## Características

- **Autenticación de Usuarios**: Registro e inicio de sesión con hash seguro de contraseñas (BCrypt)
- **Gestión de Tareas**: Crear, editar, eliminar y marcar tareas como completadas
- **Fechas de Vencimiento**: Establecer fechas límite para las tareas
- **Rol de Administrador**: Los usuarios administradores pueden ver las tareas de todos los usuarios con sus nombres de usuario
- **Diseño Responsivo**: UI limpia y moderna con HTML/CSS/JavaScript puro
- **Autenticación JWT**: Endpoints de API seguros con tokens JWT
- **Base de Datos SQLite**: Base de datos ligera y portátil

## Estructura del Proyecto

```
TikTask/
├── public/                 # Frontend (HTML/CSS/JavaScript)
│   ├── index.html         # Aplicación de una sola página
│   ├── styles.css         # Estilos
│   └── app.js             # Lógica del cliente
├── src/
│   ├── config/            # Configuración
│   │   └── database.js    # Configuración de SQLite
│   ├── middleware/        # Middleware de Express
│   │   └── auth.js        # Middleware de autenticación
│   ├── models/            # Modelos de datos
│   │   ├── User.js        # Modelo de usuario
│   │   └── Task.js        # Modelo de tarea
│   ├── routes/            # Rutas de API
│   │   ├── auth.js        # Rutas de autenticación
│   │   └── tasks.js       # Rutas de tareas
│   └── seed.js            # Seeding de base de datos
├── server.js              # Punto de entrada del servidor
├── package.json           # Dependencias de Node.js
├── web.config             # Configuración para Azure App Services
└── azure-pipelines.yml    # Pipeline de Azure DevOps
```

## Tecnologías Utilizadas

- **Node.js**: Runtime de JavaScript
- **Express**: Framework web
- **SQLite**: Base de datos
- **JWT (JSON Web Tokens)**: Autenticación
- **BCrypt**: Hash de contraseñas
- **HTML/CSS/JavaScript**: Frontend sin frameworks

## Requisitos Previos

- [Node.js 18+](https://nodejs.org/)
- npm (viene con Node.js)

## Inicio Rápido

### 1. Clonar el Repositorio

```bash
git clone https://github.com/baujuncos/TP5_IS3.git
cd TP5_IS3
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` si necesitas cambiar la configuración:
```
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
DATABASE_PATH=./database.sqlite
```

### 4. Iniciar el Servidor

```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000`

### 5. Acceder a la Aplicación

Abre tu navegador y navega a `http://localhost:3000`

## Credenciales por Defecto

### Usuario Administrador
- **Usuario**: `admin`
- **Contraseña**: `Admin123!`

### Crear Usuario Normal
1. Haz clic en "Regístrate aquí" en la página de inicio de sesión
2. Completa el formulario con tus datos
3. Haz clic en "Registrarse"

## Uso de la Aplicación

### 1. Registro/Inicio de Sesión
- Al abrir la aplicación, serás redirigido a la página de inicio de sesión
- Puedes registrarte o iniciar sesión con el usuario admin

### 2. Crear una Tarea
1. Haz clic en el botón "+ Nueva Tarea"
2. Completa el formulario:
   - **Título**: Título de la tarea (requerido)
   - **Descripción**: Descripción detallada (opcional)
   - **Fecha de Vencimiento**: Fecha límite (opcional)
3. Haz clic en "Guardar"

### 3. Gestionar Tareas
- **Completar**: Haz clic en "Completar" para marcar una tarea como completada
- **Editar**: Haz clic en "Editar" para modificar una tarea
- **Eliminar**: Haz clic en "Eliminar" para eliminar una tarea

### 4. Funcionalidad de Administrador
1. Inicia sesión como administrador
2. Verás un botón "Ver Todas las Tareas"
3. Haz clic para ver las tareas de todos los usuarios con sus nombres de usuario
4. Haz clic en "Ver Mis Tareas" para volver a tus tareas

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar un nuevo usuario
- `POST /api/auth/login` - Iniciar sesión y obtener token JWT

### Tareas
- `GET /api/tasks` - Obtener las tareas del usuario actual
- `GET /api/tasks/all` - Obtener todas las tareas (Solo Admin)
- `POST /api/tasks` - Crear nueva tarea
- `PUT /api/tasks/:id` - Actualizar tarea
- `PATCH /api/tasks/:id/complete` - Alternar completado de tarea
- `DELETE /api/tasks/:id` - Eliminar tarea

## Despliegue en Azure App Services

### Configuración Automática con Azure DevOps

El proyecto incluye un archivo `azure-pipelines.yml` configurado para:
1. Construcción automática del código
2. Pruebas (cuando estén disponibles)
3. Publicación de artefactos
4. Despliegue automático a Azure App Services

### Pasos de Configuración:

1. **Crear Azure App Service**:
   - Crea un Azure App Service con runtime Node.js 18 LTS
   - El archivo `web.config` está incluido para configuración de IIS

2. **Configurar Variables de Pipeline en Azure DevOps**:
   - `AzureSubscription`: Tu conexión de servicio de Azure
   - `AppName`: Nombre del App Service

3. **Configurar Variables de Entorno en Azure**:
   - En Azure Portal, ve a tu App Service
   - Settings > Configuration > Application settings
   - Agrega:
     - `JWT_SECRET`: Una clave secreta fuerte
     - `NODE_ENV`: `production`
     - `DATABASE_PATH`: `/home/data/database.sqlite` (para persistencia)

4. **Crear Pipeline**:
   - En Azure DevOps, crea un nuevo pipeline
   - Selecciona el repositorio y usa el `azure-pipelines.yml` existente

### Base de Datos en Azure

SQLite funciona en Azure App Services. Para persistencia de datos:
- Usa `/home/data/` como ruta de base de datos
- Este directorio persiste entre reinicios
- Configurado en `DATABASE_PATH=/home/data/database.sqlite`

## Desarrollo

### Ejecutar en Modo Desarrollo

Para desarrollo con auto-reload, instala nodemon:

```bash
npm install -g nodemon
npm run dev
```

### Estructura de la Base de Datos

#### Tabla Users
- `id`: INTEGER PRIMARY KEY
- `username`: TEXT UNIQUE
- `email`: TEXT UNIQUE
- `password`: TEXT (hash BCrypt)
- `role`: TEXT ('user' o 'admin')
- `created_at`: DATETIME

#### Tabla Tasks
- `id`: INTEGER PRIMARY KEY
- `title`: TEXT
- `description`: TEXT
- `due_date`: DATE
- `completed`: BOOLEAN
- `user_id`: INTEGER (FK a Users)
- `created_at`: DATETIME
- `updated_at`: DATETIME

## Seguridad

✅ Contraseñas hasheadas con BCrypt
✅ Autenticación JWT con expiración
✅ Autorización basada en roles
✅ Validación de datos en backend
✅ Protección contra acceso no autorizado
✅ Helmet para headers de seguridad HTTP
✅ Rate limiting en endpoints de API
✅ CORS configurado

**Notas Importantes para Producción**:
- Cambia la clave secreta JWT a un valor fuerte y aleatorio
- Usa HTTPS en producción
- Almacena secretos en Azure Key Vault o variables de entorno
- Considera agregar límites de tasa más estrictos

## Solución de Problemas

### El servidor no inicia
- Verifica que el puerto 3000 esté disponible
- Asegúrate de tener Node.js 18+ instalado
- Ejecuta `npm install` para instalar dependencias

### Error de base de datos
- Elimina el archivo `database.sqlite` y reinicia el servidor
- Verifica permisos de escritura en la carpeta
- En Azure, asegúrate de usar `/home/data/` para la ruta de BD

### La aplicación no carga en el navegador
- Verifica que el servidor esté ejecutándose
- Comprueba la consola del navegador para errores
- Asegúrate de que el puerto coincida en tu configuración

## Soporte

Para reportar problemas o solicitar nuevas características:
- Abre un issue en: https://github.com/baujuncos/TP5_IS3/issues

## Licencia

Este proyecto está licenciado bajo la Licencia MIT.

## Autor

Desarrollado como parte del TP5 de Ingeniería de Software 3.

