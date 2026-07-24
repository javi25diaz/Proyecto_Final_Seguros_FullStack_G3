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

async function loginAsAgent() {
  const agent = await User.create({ name: 'Agent', email: 'agent@test.com', password: 'Passw0rd!', role: 'user', status: 'active' });
  const res = await request(app).post('/api/auth/login').send({ email: agent.email, password: 'Passw0rd!' });
  return { token: res.body.data.token, agent };
}

async function createClient(token, overrides = {}) {
  const res = await request(app).post('/api/clients').set('Authorization', `Bearer ${token}`).send({
    name: 'Maria Gonzalez',
    identification: '8-888-888',
    phone: '6000-0000',
    email: 'maria@example.com',
    address: 'Calle Principal 123',
    ...overrides
  });
  return res;
}

async function createPolicy(token, clientId, overrides = {}) {
  const res = await request(app).post('/api/policies').set('Authorization', `Bearer ${token}`).send({
    client: clientId,
    insuranceType: 'auto',
    coverage: 'Cobertura total',
    premium: 500,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'active',
    ...overrides
  });
  return res;
}

describe('Clients', () => {
  test('creates a client', async () => {
    const { token } = await loginAsAgent();
    const res = await createClient(token);
    expect(res.status).toBe(201);
    expect(res.body.data.client.identification).toBe('8-888-888');
  });

  test('rejects a duplicate identification', async () => {
    const { token } = await loginAsAgent();
    await createClient(token);
    const res = await createClient(token, { email: 'other@example.com' });
    expect(res.status).toBe(409);
  });

  test('cannot delete a client that has policies', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const clientId = clientRes.body.data.client._id;
    await createPolicy(token, clientId);

    const res = await request(app).delete(`/api/clients/${clientId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CLIENT_HAS_POLICIES');
  });
});

describe('Policies', () => {
  test('creates a policy with an auto-generated policy number', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const res = await createPolicy(token, clientRes.body.data.client._id);
    expect(res.status).toBe(201);
    expect(res.body.data.policy.policyNumber).toMatch(/^POL-\d{4}-\d{6}$/);
  });

  test('rejects an end date before the start date', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const res = await createPolicy(token, clientRes.body.data.client._id, { startDate: '2026-12-31', endDate: '2026-01-01' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_DATE_RANGE');
  });

  test('rejects a policy for an inactive client', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token, { status: 'inactive' });
    const res = await createPolicy(token, clientRes.body.data.client._id);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CLIENT_INACTIVE');
  });
});

describe('Payments', () => {
  test('registering a paid payment creates an automatic notification', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const policyRes = await createPolicy(token, clientRes.body.data.client._id);

    const paymentRes = await request(app).post('/api/payments').set('Authorization', `Bearer ${token}`).send({
      policy: policyRes.body.data.policy._id,
      amount: 250,
      paymentDate: '2026-07-01',
      method: 'cash',
      status: 'paid'
    });
    expect(paymentRes.status).toBe(201);
    // client is always derived from the policy, guaranteeing client/policy consistency by construction
    expect(paymentRes.body.data.payment.client).toBe(clientRes.body.data.client._id);

    const notifications = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    expect(notifications.body.data.some((n) => n.type === 'payment')).toBe(true);
  });

  test('rejects a payment for a non-existent policy', async () => {
    const { token } = await loginAsAgent();
    const res = await request(app).post('/api/payments').set('Authorization', `Bearer ${token}`).send({
      policy: '507f1f77bcf86cd799439011',
      amount: 100,
      paymentDate: '2026-07-01',
      method: 'cash'
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('POLICY_NOT_FOUND');
  });
});

describe('Incidents', () => {
  test('rejects an event date outside policy coverage', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const policyRes = await createPolicy(token, clientRes.body.data.client._id);

    const res = await request(app).post('/api/incidents').set('Authorization', `Bearer ${token}`).send({
      policy: policyRes.body.data.policy._id,
      description: 'Fuera de rango',
      eventDate: '2027-01-05'
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('EVENT_OUTSIDE_COVERAGE');
  });

  test('cannot delete an incident that has claims', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const policyRes = await createPolicy(token, clientRes.body.data.client._id);
    const incidentRes = await request(app).post('/api/incidents').set('Authorization', `Bearer ${token}`).send({
      policy: policyRes.body.data.policy._id,
      description: 'Accidente',
      eventDate: '2026-07-05'
    });
    await request(app).post('/api/claims').set('Authorization', `Bearer ${token}`).send({
      incident: incidentRes.body.data.incident._id,
      amountRequested: 1000,
      description: 'Reparacion'
    });

    const res = await request(app).delete(`/api/incidents/${incidentRes.body.data.incident._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INCIDENT_HAS_CLAIMS');
  });
});

describe('Claims', () => {
  async function createIncident(token, clientId) {
    const policyRes = await createPolicy(token, clientId);
    const incidentRes = await request(app).post('/api/incidents').set('Authorization', `Bearer ${token}`).send({
      policy: policyRes.body.data.policy._id,
      description: 'Accidente',
      eventDate: '2026-07-05'
    });
    return incidentRes.body.data.incident;
  }

  test('requires amountApproved when approving a claim', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const incident = await createIncident(token, clientRes.body.data.client._id);
    const claimRes = await request(app).post('/api/claims').set('Authorization', `Bearer ${token}`).send({
      incident: incident._id,
      amountRequested: 1500,
      description: 'Reparacion de vehiculo'
    });

    const res = await request(app).patch(`/api/claims/${claimRes.body.data.claim._id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'approved' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('AMOUNT_APPROVED_REQUIRED');
  });

  test('requires resolutionNotes when rejecting a claim', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const incident = await createIncident(token, clientRes.body.data.client._id);
    const claimRes = await request(app).post('/api/claims').set('Authorization', `Bearer ${token}`).send({
      incident: incident._id,
      amountRequested: 1500,
      description: 'Reparacion de vehiculo'
    });

    const res = await request(app).patch(`/api/claims/${claimRes.body.data.claim._id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'rejected' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('RESOLUTION_NOTES_REQUIRED');
  });

  test('approves a claim and generates an automatic notification', async () => {
    const { token } = await loginAsAgent();
    const clientRes = await createClient(token);
    const incident = await createIncident(token, clientRes.body.data.client._id);
    const claimRes = await request(app).post('/api/claims').set('Authorization', `Bearer ${token}`).send({
      incident: incident._id,
      amountRequested: 1500,
      description: 'Reparacion de vehiculo'
    });

    await request(app).patch(`/api/claims/${claimRes.body.data.claim._id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'under_analysis' });

    const res = await request(app).patch(`/api/claims/${claimRes.body.data.claim._id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'approved', amountApproved: 1200 });
    expect(res.status).toBe(200);
    expect(res.body.data.claim.status).toBe('approved');

    const notifications = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    expect(notifications.body.data.some((n) => n.message.includes('Aprobada'))).toBe(true);
  });
});
