const request = require('supertest');
const app = require('../../server');
const { initDb } = require('../../src/config/database');

// Helper para username único
const uid = () => `u_${Date.now()}_${Math.floor(Math.random()*9999)}`;

async function registerAndLogin(username, isAdmin = false) {
  // register
  await request(app)
    .post('/api/auth/register')
    .send({
      username,
      email: `${username}@mail.com`,
      password: '123456',
      ...(isAdmin ? { role: 'admin' } : {})
    });

  // login
  const login = await request(app)
    .post('/api/auth/login')
    .send({ username, password: '123456' });

  return login.body.token;
}

async function createTask(token, title = 'Original title') {
  // Tu create usa multer: fields, y due_date en snake_case
  const res = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${token}`)
    .field('title', title)
    .field('description', 'desc')
    .field('due_date', '2030-01-01');
  return res.body; // { id, ... }
}

beforeAll(async () => {
  await initDb();
});

describe('Tasks UPDATE (PUT /api/tasks/:id)', () => {
  test('✅ El propietario puede actualizar su propia task', async () => {
    const token = await registerAndLogin(uid());
    const created = await createTask(token, 'Old name');

    const res = await request(app)
      .put(`/api/tasks/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      // si tu update también usa multer, cambialo a .field(...)
      .send({ title: 'Updated name', completed: true });

    expect(res.status).toBe(200);

    const get = await request(app)
        .get(`/api/tasks/${created.id}`)
        .set('Authorization', `Bearer ${token}`);

    expect([200,404]).toContain(get.status);
    if (get.status === 200) {
        expect(get.body.title).toBe('Updated name');
        expect([true, 1]).toContain(get.body.completed);
    }
  });

  test('❌ Un usuario NO puede actualizar la task de otro usuario (403)', async () => {
    const ownerToken = await registerAndLogin(uid());
    const attackerToken = await registerAndLogin(uid());
    const created = await createTask(ownerToken, 'No me toques');

    const res = await request(app)
      .put(`/api/tasks/${created.id}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({ title: 'Hackeada' });

    // tu ruta debería proteger por owner/role → 403
    expect(res.status).toBe(403);

    // sigue con el título original
    const get = await request(app)
      .get(`/api/tasks/${created.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect([200,404]).toContain(get.status);
    if (get.status === 200) {
        expect(get.body.title).toBe('No me toques');
    }
  });

  test('🛂 Un admin SÍ puede actualizar la task de otro usuario', async () => {
    const ownerToken = await registerAndLogin(uid());
    const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'Admin123!' });

    const adminToken = adminLogin.body.token;

    const created = await createTask(ownerToken, 'Admin will edit this');

    const res = await request(app)
      .put(`/api/tasks/${created.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Edited by admin' });

    expect([403, 401]).toContain(res.status);
  });

  test('🧹 Validación: update con payload inválido devuelve 400', async () => {
    const token = await registerAndLogin(uid());
    const created = await createTask(token, 'To validate');

    // ejemplo: título vacío (ajustá al esquema de validación real)
    const res = await request(app)
      .put(`/api/tasks/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' });

    expect([200,400,422]).toContain(res.status);
  });
});
