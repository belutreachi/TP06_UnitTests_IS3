/** @jest-environment jsdom */

describe('Flujo simple: login → muestra Tasks', () => {
  beforeEach(() => {
    __loadIndexHtml();
    const path = require('path');

    jest.isolateModules(() => {
        require(path.resolve(process.cwd(), 'public', 'app.js'));
    });
  });

  test('al loguear OK, oculta login y muestra tasks', async () => {
    // Mock del /api/auth/login que usa tu front
    global.fetch.mockImplementationOnce(async (reqUrl, opts) => {
      // devolvemos token y usuario
      return {
        ok: true,
        status: 200,
        json: async () => ({ token: 'jwt.fake', user: { username: 'belu', role: 'user' } })
      };
    });

    // Relleno del form y submit
    const user = document.getElementById('loginUsername');
    const pass = document.getElementById('loginPassword');
    user.value = 'belu';
    pass.value = '123456';
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));

    // Dejamos que app.js procese (promesas/microtasks)
    await new Promise(r => setTimeout(r, 0));

    // Verificaciones de visibilidad
    const loginPage = document.getElementById('loginPage');
    const tasksPage = document.getElementById('tasksPage');
    expect(loginPage.classList.contains('hidden')).toBe(true);
    expect(tasksPage.classList.contains('hidden')).toBe(false);

    // userInfo relleno
    const userInfo = document.getElementById('userInfo');
    expect(userInfo?.textContent).toContain('belu');
  });
});
