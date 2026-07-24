const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('./setup');

jest.setTimeout(120000);

let app;
let User;
let Client;
let Policy;
let Incident;
let Claim;
let Notification;

beforeAll(async () => {
  await connect();
  app = require('../src/app');
  User = require('../src/models/User');
  Client = require('../src/models/Client');
  Policy = require('../src/models/Policy');
  Incident = require('../src/models/Incident');
  Claim = require('../src/models/Claim');
  Notification = require('../src/models/Notification');
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

async function loginAsAgent() {
  const agent = await User.create({
    name: 'Agent',
    email: 'agent-workflow@test.com',
    password: 'Passw0rd!',
    role: 'user',
    status: 'active'
  });

  const res = await request(app).post('/api/auth/login').send({ email: agent.email, password: 'Passw0rd!' });
  return { token: res.body.data.token, agent };
}

async function createClient(token, overrides = {}) {
  return request(app).post('/api/clients').set('Authorization', `Bearer ${token}`).send({
    name: 'Maria Gonzalez',
    identification: '8-888-888',
    phone: '6000-0000',
    email: 'maria@example.com',
    address: 'Calle Principal 123',
    ...overrides
  });
}

async function createPolicy(token, clientId, overrides = {}) {
  return request(app).post('/api/policies').set('Authorization', `Bearer ${token}`).send({
    client: clientId,
    insuranceType: 'auto',
    coverage: 'Cobertura total',
    premium: 500,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'active',
    ...overrides
  });
}

describe('Insurance workflow rules', () => {
  test('registers a valid payment for an active policy', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const policyRes = await createPolicy(token, clientRes.body.data.client._id);

    const res = await request(app).post('/api/payments').set('Authorization', `Bearer ${token}`).send({
      policy: policyRes.body.data.policy._id,
      amount: 250,
      paymentDate: '2026-07-01',
      method: 'cash',
      status: 'paid'
    });

    expect(res.status).toBe(201);
    expect(res.body.data.payment.policy).toBe(policyRes.body.data.policy._id);
  });

  test('rejects a payment for a cancelled policy', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const policyRes = await createPolicy(token, clientRes.body.data.client._id, { status: 'cancelled' });

    const res = await request(app).post('/api/payments').set('Authorization', `Bearer ${token}`).send({
      policy: policyRes.body.data.policy._id,
      amount: 250,
      paymentDate: '2026-07-01',
      method: 'cash',
      status: 'paid'
    });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('POLICY_CANCELLED');
  });

  test('creates a claim for an existing incident on the correct policy', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const policyRes = await createPolicy(token, clientRes.body.data.client._id);
    const incidentRes = await request(app).post('/api/incidents').set('Authorization', `Bearer ${token}`).send({
      policy: policyRes.body.data.policy._id,
      description: 'Accidente menor',
      eventDate: '2026-06-10'
    });

    const res = await request(app).post('/api/claims').set('Authorization', `Bearer ${token}`).send({
      incident: incidentRes.body.data.incident._id,
      amountRequested: 1000,
      description: 'Daños al vehículo'
    });

    expect(res.status).toBe(201);
    expect(res.body.data.claim.incident).toBe(incidentRes.body.data.incident._id);
    expect(res.body.data.claim.policy).toBe(policyRes.body.data.policy._id);
  });

  test('rejects a claim for a closed incident', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const policyRes = await createPolicy(token, clientRes.body.data.client._id);
    const incidentRes = await request(app).post('/api/incidents').set('Authorization', `Bearer ${token}`).send({
      policy: policyRes.body.data.policy._id,
      description: 'Accidente cerrado',
      eventDate: '2026-06-10',
      status: 'closed'
    });

    const res = await request(app).post('/api/claims').set('Authorization', `Bearer ${token}`).send({
      incident: incidentRes.body.data.incident._id,
      amountRequested: 1000,
      description: 'Daños al vehículo'
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INCIDENT_CLOSED');
  });

  test('allows a valid incident state transition', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const policyRes = await createPolicy(token, clientRes.body.data.client._id);
    const incidentRes = await request(app).post('/api/incidents').set('Authorization', `Bearer ${token}`).send({
      policy: policyRes.body.data.policy._id,
      description: 'Accidente en revisión',
      eventDate: '2026-06-10'
    });

    const res = await request(app).patch(`/api/incidents/${incidentRes.body.data.incident._id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'under_review' });

    expect(res.status).toBe(200);
    expect(res.body.data.incident.status).toBe('under_review');
  });

  test('rejects an invalid incident state transition', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const policyRes = await createPolicy(token, clientRes.body.data.client._id);
    const incidentRes = await request(app).post('/api/incidents').set('Authorization', `Bearer ${token}`).send({
      policy: policyRes.body.data.policy._id,
      description: 'Accidente ya cerrado',
      eventDate: '2026-06-10',
      status: 'closed'
    });

    const res = await request(app).patch(`/api/incidents/${incidentRes.body.data.incident._id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'reported' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_INCIDENT_TRANSITION');
  });

  test('creates a notification when a claim status changes', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const policyRes = await createPolicy(token, clientRes.body.data.client._id);
    const incidentRes = await request(app).post('/api/incidents').set('Authorization', `Bearer ${token}`).send({
      policy: policyRes.body.data.policy._id,
      description: 'Accidente en análisis',
      eventDate: '2026-06-10'
    });
    const claimRes = await request(app).post('/api/claims').set('Authorization', `Bearer ${token}`).send({
      incident: incidentRes.body.data.incident._id,
      amountRequested: 1000,
      description: 'Daños al vehículo'
    });

    const res = await request(app).patch(`/api/claims/${claimRes.body.data.claim._id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'under_analysis' });

    expect(res.status).toBe(200);

    const notifications = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    expect(notifications.body.data.some((notification) => notification.type === 'claim' && notification.message.includes('En análisis'))).toBe(true);
  });
});
