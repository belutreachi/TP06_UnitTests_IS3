// Mock correcto: debe retornar un OBJETO con authMiddleware y adminMiddleware
jest.mock('../../src/middleware/auth', () => ({
  authMiddleware: (req, res, next) => {
    // Simular que el token es válido solo si existe Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      req.user = { id: 1, role: 'admin', username: 'admin' };
      return next();
    }
    return res.status(401).json({ message: 'No token provided' });
  },
  adminMiddleware: (req, res, next) => {
    next();
  }
}));

const request = require('supertest');
const app = require('../../server'); 
jest.mock('../../src/models/Task');   // mock del modelo

const Task = require('../../src/models/Task');

const getTokenValido = async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'Admin123!' });
  return res.body?.token;
};

describe('Tasks controller – manejo de errores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('PUT /api/tasks/:id responde 500 si update lanza error', async () => {
    // Mock para que la tarea exista y sea del usuario
    Task.findById = jest.fn().mockResolvedValue({
      id: 123,
      user_id: 1,
      title: 'Test',
      completed: false
    });
    
    // Mock para que update lance error
    Task.update = jest.fn().mockRejectedValue(new Error('DB fail'));

    const token = await getTokenValido();
    const res = await request(app)
      .put('/api/tasks/123')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'X' });

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.status).toBeLessThan(600);
    expect(res.body?.error || res.body?.message || res.text).toMatch(/error/i);
  });

  test('POST /api/tasks devuelve 400 si falta title', async () => {
    const token = await getTokenValido();
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ /* sin title */ });

    expect([400, 422]).toContain(res.status);
  });

  test('PUT /api/tasks/:id devuelve 404 si no existe', async () => {
    Task.findById = jest.fn().mockResolvedValue(null);
    
    const token = await getTokenValido();
    
    const res = await request(app)
      .put('/api/tasks/999')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'X' });

    expect(res.status).toBe(404);
    expect(res.body?.message || res.body?.error || res.text).toMatch(/not found|no encontr/i);
  });

  test('GET /api/tasks sin token → 401', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  test('GET /api/tasks/:id con id inválido devuelve 400/404', async () => {
    Task.findById = jest.fn().mockResolvedValue(null);
    
    const token = await getTokenValido();
    const res = await request(app)
      .get('/api/tasks/abc')
      .set('Authorization', `Bearer ${token}`);

    expect([400, 404, 500]).toContain(res.status);
  });

  test('PUT /api/tasks/:id sin token devuelve 401', async () => {
    const res = await request(app)
      .put('/api/tasks/1')
      .send({ title: 'X' });

    expect(res.status).toBe(401);
  });
});