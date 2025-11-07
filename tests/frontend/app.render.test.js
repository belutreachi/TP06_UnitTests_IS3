/** @jest-environment jsdom */

describe('UI render básico (index.html)', () => {
  beforeEach(() => {
    __loadIndexHtml();
    // Carga los listeners del front
    const path = require('path');

    jest.isolateModules(() => {
        // Carga app.js desde la raíz del proyecto, sin depender de rutas relativas
        require(path.resolve(process.cwd(), 'public', 'app.js'));
    });
  });

  test('muestra el título TikTask y el form de login', () => {
    // El H1 con el nombre está en login
    const h1 = document.querySelector('#loginPage h1');
    expect(h1?.textContent).toContain('TikTask');

    // Form de login presente
    const loginForm = document.querySelector('#loginForm');
    expect(loginForm).toBeTruthy();

    // La página de tareas arranca oculta
    const tasksPage = document.getElementById('tasksPage');
    expect(tasksPage?.classList.contains('hidden')).toBe(true);
  });

  test('tiene los elementos clave de la vista de tareas', () => {
    // Verificamos que existen en el DOM (aunque empiecen ocultos)
    expect(document.getElementById('tasksTitle')).toBeTruthy();     // encabezado
    expect(document.getElementById('filtersForm')).toBeTruthy();    // filtros
    expect(document.getElementById('tasksList')).toBeTruthy();      // lista
    expect(document.getElementById('taskModal')).toBeTruthy();      // modal tareas
  });
});
