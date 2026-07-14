const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('./setup');

let app;
let User;

beforeAll(async () => {
  await connect();
  app = require('../src/app');
  User = require('../src/models/User');
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

async function registerAndLogin(overrides = {}) {
  const payload = {
    name: 'Test User',
    email: 'user@test.com',
    password: 'Passw0rd!',
    ...overrides
  };
  await request(app).post('/api/auth/register').send(payload);
  const res = await request(app).post('/api/auth/login').send({ email: payload.email, password: payload.password });
  return res.body.data.token;
}

describe('POST /api/auth/register', () => {
  test('creates a guest user even when a different role is requested', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'John Doe',
      email: 'john@test.com',
      password: 'Passw0rd!',
      role: 'admin'
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('guest');
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('rejects a weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Weak',
      email: 'weak@test.com',
      password: 'weak'
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Alice', email: 'dup@test.com', password: 'Passw0rd!' });
    const res = await request(app).post('/api/auth/register').send({ name: 'Bob', email: 'dup@test.com', password: 'Passw0rd!' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  test('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Jane', email: 'jane@test.com', password: 'Passw0rd!' });
    const res = await request(app).post('/api/auth/login').send({ email: 'jane@test.com', password: 'Passw0rd!' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  test('rejects an incorrect password without revealing whether the email exists', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Jane', email: 'jane2@test.com', password: 'Passw0rd!' });
    const res = await request(app).post('/api/auth/login').send({ email: 'jane2@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  test('rejects an inactive user', async () => {
    await User.create({ name: 'Inactive', email: 'inactive@test.com', password: 'Passw0rd!', role: 'user', status: 'inactive' });
    const res = await request(app).post('/api/auth/login').send({ email: 'inactive@test.com', password: 'Passw0rd!' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INACTIVE_ACCOUNT');
  });
});

describe('Role protected routes', () => {
  test('returns 401 without a token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  test('returns 403 for an insufficient role (guest)', async () => {
    const token = await registerAndLogin({ email: 'guest2@test.com' });
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('admin can list users, agent cannot', async () => {
    const admin = await User.create({ name: 'Admin', email: 'admin2@test.com', password: 'Passw0rd!', role: 'admin', status: 'active' });
    const loginRes = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'Passw0rd!' });
    const adminToken = loginRes.body.data.token;

    const agent = await User.create({ name: 'Agent', email: 'agent@test.com', password: 'Passw0rd!', role: 'user', status: 'active' });
    const agentLogin = await request(app).post('/api/auth/login').send({ email: agent.email, password: 'Passw0rd!' });
    const agentToken = agentLogin.body.data.token;

    const asAdmin = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
    expect(asAdmin.status).toBe(200);

    const asAgent = await request(app).get('/api/users').set('Authorization', `Bearer ${agentToken}`);
    expect(asAgent.status).toBe(403);
  });

  test('cannot delete the last admin', async () => {
    const admin = await User.create({ name: 'Solo Admin', email: 'solo@test.com', password: 'Passw0rd!', role: 'admin', status: 'active' });
    const loginRes = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'Passw0rd!' });
    const token = loginRes.body.data.token;

    const other = await User.create({ name: 'Other Admin Target', email: 'target@test.com', password: 'Passw0rd!', role: 'admin', status: 'active' });

    const res = await request(app).delete(`/api/users/${other._id}`).set('Authorization', `Bearer ${token}`);
    // deleting the *other* admin should succeed since one admin remains
    expect(res.status).toBe(200);

    const selfDelete = await request(app).delete(`/api/users/${admin._id}`).set('Authorization', `Bearer ${token}`);
    expect(selfDelete.status).toBe(409);
    expect(selfDelete.body.code).toBe('SELF_DELETE');
  });
});
