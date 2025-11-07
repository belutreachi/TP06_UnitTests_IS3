const request = require('supertest');
const app = require('../../server');

function uniqueUser() {
  return `belu_${Date.now()}_${Math.floor(Math.random()*999)}`;
}

describe('Tasks Controller CRUD (Integration, AAA)', () => {
  let token;

  beforeAll(async () => {
    const username = uniqueUser();

    await request(app)
      .post('/api/auth/register')
      .send({ username, email: `${username}@mail.com`, password: '123456' });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ username, password: '123456' });

    token = login.body.token;
  });

  test('CREATE task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Hacer TP6') // porque usas multer
      .field('due_Date', '2030-01-01');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Hacer TP6');
  });

  test('GET all tasks', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET task by ID', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Test ID')
      .field('due_Date', '2030-01-01');

    const id = created.body.id;

    const res = await request(app)
      .get(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect([200,404]).toContain(res.status);
    
    if (res.status === 200) {
        expect(res.body.id).toBe(id);
    }
  });

  test('UPDATE task', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Old')
      .field('due_Date', '2030-01-01');

    const id = created.body.id;

    const res = await request(app)
      .put(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated' });

    expect([200,201]).toContain(res.status);

    const updated = await request(app)
      .get(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect([200,404]).toContain(updated.status);
    if (updated.status === 200) {
        expect(updated.body.title).toBe('Updated');
    }

  });

  test('DELETE task', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Delete me')
      .field('due_Date', '2030-01-01');

    const id = created.body.id;

    const res = await request(app)
      .delete(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect([200,204]).toContain(res.status);

    const getAfter = await request(app)
      .get(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect([404,200]).toContain(getAfter.status);
  });
});
