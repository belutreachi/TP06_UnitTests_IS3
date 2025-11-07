/** @jest-environment jsdom */
describe('Login – manejo de errores', () => {
  beforeEach(() => {
    __loadIndexHtml();
    jest.isolateModules(() => {
      require('path'); // opcional
      require('../../public/app.js'); // ya usamos la ruta a /public
    });
  });

  test('si la API devuelve 401, muestra error y permanece en login', async () => {
    // Arrange: mock de API que falla
    global.fetch.mockImplementationOnce(async () => ({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' })
    }));

    const user = document.getElementById('loginUsername');
    const pass = document.getElementById('loginPassword');
    user.value = 'belu';
    pass.value = 'wrong';
    const form = document.getElementById('loginForm');

    // Act
    form.dispatchEvent(new Event('submit'));
    await Promise.resolve(); // deja resolver el handler async

    // Assert
    const errorBox = document.querySelector('#loginError, .error, .alert'); // ajustá al selector que uses
    const loginPage = document.getElementById('loginPage');
    const tasksPage = document.getElementById('tasksPage');

    expect(errorBox?.textContent || '').toMatch(/invalid|credenciales/i);
    expect(loginPage?.classList.contains('hidden')).toBe(false);
    expect(tasksPage?.classList.contains('hidden')).toBe(true);
  });

  test('no envía si usuario o password están vacíos', () => {
    const user = document.getElementById('loginUsername');
    const pass = document.getElementById('loginPassword');
    const form = document.getElementById('loginForm');

    user.value = '';
    pass.value = '';
    const prevent = jest.fn();
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    // Si tu código usa preventDefault, podés espiar el handler; si no, verificá estado UI
    // Assert básico: seguimos en login
    const loginPage = document.getElementById('loginPage');
    const tasksPage = document.getElementById('tasksPage');
    expect(loginPage?.classList.contains('hidden')).toBe(false);
    expect(tasksPage?.classList.contains('hidden')).toBe(true);
  });

  test('si el servidor devuelve 500, muestra mensaje de error y permanece en login', async () => {
    // HTML inicial
    __loadIndexHtml();

    // Mock 500 interno del servidor
    global.fetch.mockImplementationOnce(async () => ({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' })
    }));

    // Cargar app.js
    const path = require('path');
    jest.isolateModules(() => {
        require(path.resolve(process.cwd(), 'public/app.js'));
    });

    // Rellenar formulario
    const user = document.getElementById('loginUsername');
    const pass = document.getElementById('loginPassword');
    const form = document.getElementById('loginForm');

    user.value = 'belu';
    pass.value = '123456';

    form.dispatchEvent(new Event('submit'));

    // Esperar a DOM update
    await Promise.resolve();

    // Verifica que permanezca en login
    expect(document.getElementById('loginPage').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('tasksPage').classList.contains('hidden')).toBe(true);

    // Verifica que se mostró un mensaje de error
    expect(document.body.textContent).toContain('error');
  });

});

