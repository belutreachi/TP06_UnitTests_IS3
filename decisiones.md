# decisiones.md - TP06 Unit Tests - Ing de Software 3
## App utilizada para el TP
Para este TP usaremos una aplicación web full-stack construida con Node.js y Express, usando una base de datos SQLite. 
La aplicación llamada **TikTask** es un gestor de tareas donde se le permite a los usuarios registrarse, iniciar sesión, crear y gestionar tareas personales, hacer búsquedas filtradas de las mismas y ver estadísticas sobre su avance. El usuario administrador además puede gestionar usuarios y ver las tareas de todos.

## 1. Verificar el correcto funcionamiento de nuestra App
Primero debemos corroborar que todas las funcionalidades de la App funcionan correctamente.

### Registro de usuarios
Registramos a un usuario con los siguientes datos:
- Nombre de usuario: juanperez
- Email: juan@example.com
- Contraseña: Juan123
![alt text](image.png)
Registro exitoso:
![alt text](image-1.png)

### Login
Iniciamos sesión con el usuario que acabamos de crear:
![alt text](image-2.png)
![alt text](image-3.png)

### Creación de tareas
Creamos varias tareas haciendo click en _Nueva tarea_ y completando con los siguientes datos:
![alt text](image-4.png)
![alt text](image-5.png)
Incluso en una de las tareas agregamos un archivo de prueba.

### Búsqueda por filtros
Buscamos tareas filtrando de distintas maneras:
- Tareas entre una y otra fecha:
![alt text](image-6.png)
- Tareas pendientes (Todas):
![alt text](image-7.png)
- Tareas que contengan una palabra clave en su título o descripción:
![alt text](image-8.png)
- Mezclamos filtros:
![alt text](image-9.png)
![alt text](image-10.png)

### Ver estadísticas
Se muestran la cantidad de tareas pendientes y completadas, y a partir de la cantidad de tareas completadas vemos el progreso del usuario:
![alt text](image-11.png)
Si marcamos una tarea completada cambian las estadísticas:
![alt text](image-12.png)

### Usuario administrador: ver tareas de todos 
Ingresamos al perfil del usuario Administrador y vemos las tareas de todos:
![alt text](image-13.png)
![alt text](image-14.png)

### Usuario administrador: gestión de usuarios
Entramos a la parte de usuarios y modificamos un usuario. Al usuario juanperez le modificamos su email de "juan@example.com" a "juanperez@example.com":
![alt text](image-15.png)
![alt text](image-16.png)
![alt text](image-17.png)
Eliminamos el usuario juanperez:
![alt text](image-18.png)
![alt text](image-19.png)
Vemos que se borraron también todas sus tareas, solo aparecen las de los demás usuarios:
![alt text](image-20.png)

## 2. Implementación de pruebas unitarias en backend
### 2.1. Configuración del entorno de testing (frameworks y herramientas)
En la raíz del repo corro el comando:
```bash
npm i -D jest supertest jest-environment-node cross-env
```
Instalando de esta forma:
- jest: framework de testing (= xUnit)
- supertest: tests de controladores/rutas Express
- jest-environment-node: entorno Node
- cross-env: setear NODE_ENV=test en scripts

Para mocking frameworks, Jest ya trae jest.fn(), jest.spyOn(), jest.mock().

### 2.2. Estructura del proyecto de pruebas
En la raíz del repo creo la siguiente carpeta y archivos:
```bash
tests/
  unit/
  integration/
  setupTests.js
jest.config.cjs
```
**Carpetas:**
- `/tests/unit`: contiene tests unitarios. Testean funciones individuales, middleware, y lógica pequeña ya aislada.
- `/tests/integration`: contiene tests de integración. Testean endpoints reales y flujo completo (crear — actualizar — leer — eliminar).

**Archivos:**
- `jest.config.cjs` - **Configuración de Jest**: creo este archivo porque Jest necesita saber cómo ejecutar los tests en un proyecto Node/Express. Le dice a Jest cómo correr los tests y dónde encontrarlos.
- `tests/setupTests.js` - **Inicialización de entorno de pruebas**: este archivo se ejecuta antes de todos los tests, y fue necesario para que nuestras pruebas funcionaran correctamente. Prepara un ambiente controlado para que los tests sean consistentes, independientes y repetibles.

### 2.3. Archivos específicos para los tests del backend
Para hacer los tests, creo diferentes archivos en la estructura creada en el paso anterior:
- Unit Tests - Auth Middleware: creo el archivo `auth.middleware.test.js` en `tests/unit/`.
- Unit Tests - Task Model Logic: creo el archivo `task.model.test.js` en `tests/unit`.
- Integration Tests — AUTH + TASKS: creo el archivo `tasks.controller.test.js` en `tests/integration`. --> DB nueva por test, CRUD completo.

Corro los siguientes comandos para ejecutar los tests:
```bash
npm run build
npm test
```
### Resultados de esta parte
Se hicieron tests para servicios, controladores y lógica de negocio usando:
- **Patrón AAA**: todos los tests siguen Arrange → Act → Assert.
- **Unit tests**: `auth.middleware.test.js` (autenticación), `admin.middleware.test.js` (autorización por rol).
- **Integration tests**: `tasks.controller.test.js` (CRUD completo), `tasks.update.int.test.js` (reglas de negocio: dueño vs otro usuario vs admin, y códigos 200/403/404).
- **Resultados**: 4/4 suites OK, 14/14 tests OK.
![alt text](image-21.png)

## 4. Implementación de pruebas unitarias en backend
### 4.1. Instalación de dependencias
Con el siguiente comando instalo el ambiente de navegador y los matchers de DOM:
```bash
npm i -D jest-environment-jsdom @testing-library/dom @testing-library/jest-dom
```
- **Jest**: runner y aserciones.
- `jest-environment-jsdom`: DOM virtual para ejecutar tests de UI en Node.
- **Node + módulos nativos**: fs y path (para inyectar index.html en jsdom).

### 4.2. Estructura
Creo una nueva carpeta `frontend` dentro de la carpeta `tests` creada anteriormente, con los siguientes archivos:
```bash
tests/
  frontend/
    setupFrontend.js
    app.render.test.js
    app.flow.test.js
```
**Archivos:**
- `setupFrontend.js`: se encarga de preparar el entorno de pruebas del frontend.
- `app.render.test.js`: hace los tests de renderizado inicial:
  - Carga `index.html` en jsdom.
  - `require(path.resolve(process.cwd(), 'public/app.js'))` para registrar los listeners del front.
  - Verifica elementos clave de la UI: título, form de login, y que la vista de tareas arranca oculta.
- `app.flow.test.js`: hace los tests de lógica mínima de flujo:
  - Mockea `fetch('/api/auth/login')` para simular login OK.
  - Completa el form y hace `submit`.
  - Asegura que se oculta la pantalla de login y se muestra la de tareas.
- `jest.config.cjs`: en este archivo que creé anteriormente, se configuran las `roots: ['<rootDir>/tests']` para centralizar todos los tests.

### 4.3. Resultados
Se cubrieron los siguientes casos unitarios:
1. **Render básico (UI)**: 
  - Existe el título **“TikTask”** en la sección de login.
  - Existe el form `#loginForm`.
  - La vista de tareas `#tasksPage` inicia oculta.
2. **Flujo simple de login**:
  - Mock de `fetch` devuelve `{ ok: true, token, user }`.
  - Completa `#loginUsername` y `#loginPassword`, hace `submit`.
  - Verifica que:
    - La pantalla de login queda oculta.
    - La pantalla de tareas queda visible.

**Patrón AAA (Arrange–Act–Assert)**:

Aplicado explícitamente en cada test:
- **Arrange (preparar)**
  - `__loadIndexHtml()` para montar el DOM.
  - `require(.../public/app.js)` para registrar eventos.
  - Mocks necesarios (por ejemplo `global.fetch.mockImplementationOnce(...)`).
  - Selección de elementos (`document.getElementById(...)`).
- **Act (actuar)**
  - Seteo de valores en inputs (`.value = ...`).
  - Disparo de eventos (`form.dispatchEvent(new Event('submit', { bubbles: true }))`).
- **Assert (afirmar)**
  - Chequeos de texto / existencia de nodos (`textContent`, `querySelector`).
  - Chequeos de visibilidad por clases (`classList.contains('hidden')`).

**Junto con los tests del backend, todos los tests pasan correctamente:**
![alt text](image-22.png)

## 5. Testing avanzado - Mocking y Aislamiento
### 5.1. Contexto
Para esta parte necesitábamos pruebas rápidas, deterministas y aisladas que no dependan de red, filesystem real ni estados globales del DOM/browser. La app tiene puntos de integración “costosos” o frágiles: DB (sqlite), FS (adjuntos), red (fetch), DOM (render dinámico), middlewares (auth/admin).

### 5.2. Mocks para dependencias externas
**Mock de base de datos SQLite**:

En el archivo `tests/setupTests.js` se hizo:
```bash
process.env.DATABASE_PATH = ':memory:';
```
Se decidió usar SQLite en memoria para todos los tests, evitando dependencias de archivos físicos y acelerando la ejecución.

*Justificación:*
- Los tests son aislados y reproducibles.
- No hay efectos secundarios entre suites de tests.
- Mayor velocidad de ejecución (todo en RAM).

**Mock del Modelo Task**:

En el archivo `tests/unit/tasks.controller.errors.test.js` se hizo:
```bash
jest.mock('../../src/models/Task');
const Task = require('../../src/models/Task');

// Ejemplo de uso:
Task.findById = jest.fn().mockResolvedValue({ id: 123, user_id: 1 });
Task.update = jest.fn().mockRejectedValue(new Error('DB fail'));
```
En esta parte se mockeo el modelo Task completo para simular diferentes escenarios de base de datos sin necesidad de datos reales.

*Justificación:*
- Permite simular errores de DB sin romper la base de datos real.
- Control total sobre los valores retornados.
- Tests más rápidos al evitar I/O de disco.

**Mock de Middleware de Autenticación**:

En el archivo `tests/unit/tasks.controller.errors.test.js` se hizo:
```bash
jest.mock('../../src/middleware/auth', () => ({
  authMiddleware: (req, res, next) => {
    if (req.headers.authorization?.startsWith('Bearer ')) {
      req.user = { id: 1, role: 'admin', username: 'admin' };
      return next();
    }
    return res.status(401).json({ message: 'No token provided' });
  },
  adminMiddleware: (req, res, next) => next()
}));
```
Se crearon mocks que simulan el comportamiento real de los middlewares pero sin validar JWTs reales.

*Justificación:*
- Evita dependencia de tokens JWT válidos y secrets.
- Permite testear tanto casos autenticados como no autenticados.
- Mantiene la lógica de autorización pero simplificada.

**Mock de Fetch API (Frontend)**:

En el archivo `tests/frontend/setupFrontend.js` se hizo:
```bash
global.fetch = jest.fn(async () => ({
  ok: true,
  status: 200,
  json: async () => ({})
}));
```
Se decidió mockear fetch globalmente para simular respuestas de API sin hacer llamadas HTTP reales.

*Justificación:*
- Tests de frontend completamente aislados del backend.
- Control sobre respuestas exitosas y errores.
- Velocidad de ejecución (sin latencia de red).

**Mock de LocalStorage**:

En el archivo `tests/frontend/setupFrontend.js` se hizo:
```bash
const store = new Map();
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (k) => store.has(k) ? store.get(k) : null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  }
});
```
Se implementó localStorage en memoria usando un Map de JavaScript.

*Justificación:*
- jsdom no incluye localStorage por defecto.
- Permite testear persistencia de sesión sin dependencias externas.
- Se limpia automáticamente entre tests.

### 5.3. Tests para Manejo de Excepciones
**Errores de Servidor (500)**:

En el archivo `tests/unit/tasks.controller.errors.test.js` se hizo:
```bash
test('PUT /api/tasks/:id responde 500 si update lanza error', async () => {
  Task.findById = jest.fn().mockResolvedValue({ id: 123, user_id: 1 });
  Task.update = jest.fn().mockRejectedValue(new Error('DB fail'));
  
  const res = await request(app)
    .put('/api/tasks/123')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'X' });

  expect(res.status).toBeGreaterThanOrEqual(500);
  expect(res.body?.message).toMatch(/error/i);
});
```
Se simularon errores internos de base de datos para verificar que el servidor responde correctamente con 5xx.

*Justificación:*
- Asegura que los errores internos no exponen información sensible.
- Verifica el manejo robusto de excepciones.
- Previene que errores de DB rompan toda la aplicación.

**Errores de Autenticación (401)**:

En los archivos `tests/unit/tasks.controller.errors.test.js` y `tests/frontend/app.login.errors.test.js` se hizo:
```bash
test('GET /api/tasks sin token → 401', async () => {
  const res = await request(app).get('/api/tasks');
  expect(res.status).toBe(401);
});

test('si la API devuelve 401, muestra error y permanece en login', async () => {
  global.fetch.mockImplementationOnce(async () => ({
    ok: false,
    status: 401,
    json: async () => ({ message: 'Invalid credentials' })
  }));
  
  // ... simular login ...
  
  expect(errorBox?.textContent).toMatch(/invalid|credenciales/i);
  expect(loginPage?.classList.contains('hidden')).toBe(false);
});
```
Se testearon tanto backend (sin token) como frontend (credenciales inválidas).

*Justificación:*
- Seguridad: asegura que rutas protegidas rechacen accesos no autorizados.
- UX: verifica que el usuario reciba feedback claro.
- No se navega a otras páginas cuando hay errores de auth.

**Errores de Recurso No Encontrado (404)**:

En el archivo `` se hizo:
```bash
test('PUT /api/tasks/:id devuelve 404 si no existe', async () => {
  Task.findById = jest.fn().mockResolvedValue(null);
  
  const res = await request(app)
    .put('/api/tasks/999')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'X' });

  expect(res.status).toBe(404);
  expect(res.body?.message).toMatch(/not found|no encontr/i);
});
```
Se verific'o que operaciones sobre recursos inexistentes retornen 404.

*Justificación:*
- RESTful: seguir convenciones HTTP estándar.
- Claridad: el cliente sabe que el recurso no existe.
- Seguridad: no exponer información sobre otros recursos.

**Errores de Validación (400)**:
En el archivo `tests/unit/tasks.controller.errors.test.js` se hizo:
```bash
test('POST /api/tasks devuelve 400 si falta title', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({ /* sin title */ });

  expect([400, 422]).toContain(res.status);
});
```
Se decidió validar que el servidor rechace requests con datos inválidos o incompletos.

*Justificación:*
- Integridad de datos: no permitir tareas sin título.
- Feedback temprano: el cliente sabe qué falta antes de procesamiento.
- Prevención de datos corruptos en la DB.

**Errores de Red (Frontend)**:
En el archivo `tests/frontend/app.tasks.edge.test.js` se hizo:
```bash
test('si /api/tasks devuelve 500, muestra estado de error y no rompe', async () => {
  global.fetch
    .mockImplementationOnce(/* login OK */)
    .mockImplementationOnce(async () => ({ 
      ok: false, 
      status: 500 
    }));

  // ... trigger request ...
  
  const errorBox = document.querySelector('#tasksList .error');
  expect(errorBox).toBeTruthy();
  expect(errorBox.textContent.toLowerCase()).toMatch(/error|intente/);
});
```
Se verificó que errores de servidor se muestren al usuario sin romper la UI.

*Justificación:*
- Resiliencia: la app sigue funcionando aunque falle una request.
- UX: feedback claro al usuario sobre qué salió mal.
- Debugging: mensajes de error informativos.

### 5.4. Tests de Casos Edge y Validaciones
**Lista Vacía de Tareas**:
En el archivo `tests/frontend/app.tasks.edge.test.js` se hizo:
```bash
test('si /api/tasks devuelve arreglo vacío, se muestra estado "sin tareas"', async () => {
  global.fetch
    .mockImplementationOnce(/* login OK */)
    .mockImplementationOnce(async () => ({ ok: true, json: async () => [] }))
    .mockImplementationOnce(/* stats OK */);

  // ... login ...
  await new Promise(resolve => setTimeout(resolve, 50));

  const emptyState = document.querySelector('.empty-state');
  expect(emptyState).toBeTruthy();
  expect(emptyState.textContent).toMatch(/no hay tareas/i);
});
```
Se verificó que el UI muestre un estado vacío amigable cuando no hay tareas.

*Justificación:*
- UX: evitar pantallas en blanco confusas.
- Guía al usuario: indica cómo crear la primera tarea.
- Edge case común: usuarios nuevos siempre empiezan sin tareas.

**Lista Grande (Performance)**:
En el archivo `tests/frontend/app.tasks.edge.test.js` se hizo:
```bash
test('renderiza una lista grande sin romper (100 ítems)', async () => {
  const bigList = Array.from({ length: 100 }, (_, i) => ({ 
    id: i+1, 
    title: `T${i+1}`,
    due_date: '2024-12-31',
    completed: false,
    user_id: 1
  }));
  
  global.fetch
    .mockImplementationOnce(/* login OK */)
    .mockImplementationOnce(async () => ({ ok: true, json: async () => bigList }));

  // ... render ...
  
  const rows = document.querySelectorAll('.task-card');
  expect(rows.length).toBeGreaterThanOrEqual(100);
});
```
Se decidió testear que el renderizado funcione correctamente con grandes volúmenes de datos.

*Justificación:*
- Performance: detectar problemas de rendimiento temprano.
- Edge case real: usuarios productivos pueden tener muchas tareas.
- Prevención de crashes: asegura que no hay límites artificiales.

**Campos Vacíos en Login**:
En el archivo `tests/frontend/app.login.errors.test.js` se hizo:
```bash
test('no envía si usuario o password están vacíos', () => {
  user.value = '';
  pass.value = '';
  form.dispatchEvent(new Event('submit'));
  
  expect(loginPage?.classList.contains('hidden')).toBe(false);
  expect(tasksPage?.classList.contains('hidden')).toBe(true);
});
```
Se validó que el formulario de login no se envíe con campos vacíos.

*Justificación:*
- UX: evitar requests innecesarios.
- Seguridad: validación client-side como primera línea de defensa.
- Feedback inmediato: el usuario sabe que debe llenar los campos.

**IDs Inválidos**:
En el archivo `tests/unit/tasks.controller.errors.test.js` se hizo:
```bash
test('GET /api/tasks/:id con id inválido devuelve 400/404', async () => {
  const res = await request(app)
    .get('/api/tasks/abc')  // ID no numérico
    .set('Authorization', `Bearer ${token}`);

  expect([400, 404, 500]).toContain(res.status);
});
```
Se verificó el manejo de IDs malformados o no numéricos.

*Justificación:*
- Robustez: la API no debe fallar con inputs inesperados.
- Seguridad: prevenir inyecciones o manipulación de URLs.
- Edge case común: URLs manuales o typos.

**Timeouts y Sincronización (Frontend)**:
Se usó el siguiente patrón en todos los tests del frontend:
```bash
await new Promise(resolve => setTimeout(resolve, 50));
```
Se decidió agregar timeouts explícitos después de eventos asíncronos.

*Justificación:*
- jsdom no procesa microtasks automáticamente como browsers reales.
- await Promise.resolve() no es suficiente para operaciones fetch.
- 50ms es un balance entre velocidad y confiabilidad.

### 5.5. Resultado final:
![alt text](image-23.png)

## 6. Integración con CI/CD
Necesitamos configurar la integración CI/CD en Azure DevOps para el proyecto.

### 6.1. Configurar Jest para generar reportes XML
Primero necesitamos que Jest genere reportes en formato XML (JUnit) para que Azure DevOps pueda leerlos, entonces modificamos ese archivo.

### 6.2. Instalar jest-junit
Instalamos jest-unit con el siguiente comando:
```bash
npm install --save-dev jest-junit
```
Luego actualizamos el archivo `package.json`.

### 6.3. Crear el Pipeline de Azure DevOps
Creamos el archivo `azure-pipelines.yml` en la raíz del proyecto.

