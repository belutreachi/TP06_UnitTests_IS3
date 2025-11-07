// Se ejecuta después de cargar Jest, para TODOS los tests.
// Solo hace cosas de DOM si existe window (o sea: en jsdom).
if (typeof window !== 'undefined') {
  // Mock simple de localStorage
  const store = new Map();
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear()
    },
    writable: false
  });

  // fetch mockeado por defecto (cada test puede sobrescribirlo)
  if (!global.fetch) {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({})
    }));
  }

  // ----- CARGA ROBUSTA DE index.html -----
  const fs = require('fs');
  const path = require('path');

  function firstExisting(paths) {
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  function resolveIndexHtml() {
    // __dirname = <root>/tests/frontend
    const candidates = [
      path.resolve(__dirname, '..', '..', 'index.html'),           // <root>/index.html
      path.resolve(__dirname, '..', '..', 'frontend', 'index.html'),
      path.resolve(__dirname, '..', '..', 'public', 'index.html'),
      path.resolve(__dirname, '..', '..', 'src', 'index.html'),
      path.resolve(__dirname, '..', '..', 'src', 'public', 'index.html'),
    ];
    const found = firstExisting(candidates);
    if (found) return found;

    const msg =
      'index.html no encontrado.\n' +
      'Probé:\n' + candidates.join('\n') + '\n\n' +
      `cwd: ${process.cwd()}\n` +
      `__dirname: ${__dirname}\n` +
      'Mové tu index.html a una de esas rutas o ajustá este archivo.';
    throw new Error(msg);
  }

  global.__loadIndexHtml = () => {
    const file = resolveIndexHtml();
    const html = fs.readFileSync(file, 'utf8');
    document.documentElement.innerHTML = html;
  };
}

// Limpieza entre tests
afterEach(() => {
  if (global.fetch?.mockClear) global.fetch.mockClear();
});
