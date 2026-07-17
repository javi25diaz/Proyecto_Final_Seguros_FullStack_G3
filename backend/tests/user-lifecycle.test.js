const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('./setup');

let app;
let User;
let Client;
let Policy;
let Notification;
let Payment;
let Incident;
let Claim;

beforeAll(async () => {
  await connect();
  app = require('../src/app');
  User = require('../src/models/User');
  Client = require('../src/models/Client');
  Policy = require('../src/models/Policy');
  Notification = require('../src/models/Notification');
  Payment = require('../src/models/Payment');
  Incident = require('../src/models/Incident');
  Claim = require('../src/models/Claim');
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

async function createAndLoginUser(overrides = {}) {
  const user = await User.create({
    name: 'Agente Test',
    email: 'agent.test@example.com',
    password: 'Passw0rd!',
    role: 'user',
    status: 'active',
    ...overrides
  });

  const loginRes = await request(app).post('/api/auth/login').send({ email: user.email, password: 'Passw0rd!' });
  return { user, token: loginRes.body.data.token };
}

async function createAdminAndToken(overrides = {}) {
  const admin = await User.create({
    name: 'Admin Test',
    email: 'admin.test@example.com',
    password: 'Passw0rd!',
    role: 'admin',
    status: 'active',
    ...overrides
  });

  const loginRes = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'Passw0rd!' });
  return { admin, token: loginRes.body.data.token };
}

async function seedLifecycleDependencies(targetUser) {
  const client = await Client.create({
    name: 'Cliente Dependencias',
    identification: `ID-${targetUser._id.toString().slice(-6)}`,
    phone: '6000-1000',
    email: `cliente-${targetUser._id.toString().slice(-6)}@example.com`,
    address: 'Calle Dependencias 123',
    status: 'active',
    assignedAgent: targetUser._id,
    notes: 'Cliente de prueba',
    createdBy: targetUser._id
  });

  const policy = await Policy.create({
    policyNumber: `POL-TEST-${targetUser._id.toString().slice(-6)}`,
    client: client._id,
    insuranceType: 'auto',
    coverage: 'Cobertura total',
    premium: 500,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    status: 'active',
    assignedAgent: targetUser._id,
    notes: 'Póliza de prueba',
    createdBy: targetUser._id
  });

  const incident = await Incident.create({
    incidentNumber: `INC-TEST-${targetUser._id.toString().slice(-6)}`,
    client: client._id,
    policy: policy._id,
    description: 'Siniestro de prueba',
    eventDate: new Date('2026-06-01'),
    reportedBy: targetUser._id
  });

  await Claim.create({
    claimNumber: `CLAIM-TEST-${targetUser._id.toString().slice(-6)}`,
    client: client._id,
    policy: policy._id,
    incident: incident._id,
    claimDate: new Date('2026-06-02'),
    amountRequested: 1500,
    description: 'Reclamación de prueba',
    handledBy: targetUser._id
  });

  await Payment.create({
    receiptNumber: `PAY-TEST-${targetUser._id.toString().slice(-6)}`,
    client: client._id,
    policy: policy._id,
    amount: 250,
    paymentDate: new Date('2026-06-03'),
    status: 'paid',
    method: 'cash',
    registeredBy: targetUser._id
  });

  await Notification.create({
    message: 'Notificación de prueba',
    type: 'policy',
    recipientUser: targetUser._id,
    client: client._id,
    relatedEntityType: 'Policy',
    relatedEntityId: policy._id,
    createdBy: targetUser._id
  });

  return { client, policy, incident };
}

describe('User lifecycle administration', () => {
  test('an unauthenticated user cannot query dependencies', async () => {
    const target = await User.create({ name: 'Target', email: 'target-no-auth@example.com', password: 'Passw0rd!', role: 'user', status: 'active' });

    const res = await request(app).get(`/api/users/${target._id}/dependencies`);
    expect(res.status).toBe(401);
  });

  test('a user role cannot query dependencies', async () => {
    const { user: requester, token } = await createAndLoginUser({ email: 'user-role@example.com' });
    const target = await User.create({ name: 'Target', email: 'target-user-role@example.com', password: 'Passw0rd!', role: 'user', status: 'active' });

    const res = await request(app).get(`/api/users/${target._id}/dependencies`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(requester.role).toBe('user');
  });

  test('an admin can query dependencies with correct counts', async () => {
    const { token } = await createAdminAndToken({ email: 'admin-deps@example.com' });
    const target = await User.create({ name: 'Target Deps', email: 'target-deps@example.com', password: 'Passw0rd!', role: 'user', status: 'active' });
    await seedLifecycleDependencies(target);

    const res = await request(app).get(`/api/users/${target._id}/dependencies`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(target.email);
    expect(res.body.data.dependencies.assignedClients).toBe(1);
    expect(res.body.data.dependencies.assignedPolicies).toBe(1);
    expect(res.body.data.dependencies.recipientNotifications).toBe(1);
    expect(res.body.data.dependencies.createdClients).toBe(1);
    expect(res.body.data.dependencies.createdPolicies).toBe(1);
    expect(res.body.data.dependencies.createdNotifications).toBe(1);
    expect(res.body.data.dependencies.handledClaims).toBe(1);
    expect(res.body.data.dependencies.registeredPayments).toBe(1);
    expect(res.body.data.dependencies.reportedIncidents).toBe(1);
    expect(res.body.data.reassignableCount).toBe(3);
    expect(res.body.data.blockingCount).toBe(6);
    expect(res.body.data.totalDependencies).toBe(9);
    expect(res.body.data.canDelete).toBe(false);
  });

  test('cannot delete an agent with assigned clients', async () => {
    const { token } = await createAdminAndToken({ email: 'admin-client-delete@example.com' });
    const target = await User.create({ name: 'Target Client', email: 'target-client@example.com', password: 'Passw0rd!', role: 'user', status: 'active' });
    await Client.create({
      name: 'Cliente Bloqueante',
      identification: 'CLI-DEL-001',
      phone: '6000-2000',
      email: 'cli-del-001@example.com',
      address: 'Calle 1',
      status: 'active',
      assignedAgent: target._id,
      createdBy: target._id
    });

    const res = await request(app).delete(`/api/users/${target._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('USER_HAS_DEPENDENCIES');
    expect(await User.findById(target._id)).not.toBeNull();
  });

  test('cannot delete an agent with assigned policies', async () => {
    const { token } = await createAdminAndToken({ email: 'admin-policy-delete@example.com' });
    const target = await User.create({ name: 'Target Policy', email: 'target-policy@example.com', password: 'Passw0rd!', role: 'user', status: 'active' });
    const owner = await User.create({ name: 'Owner', email: 'owner-policy@example.com', password: 'Passw0rd!', role: 'user', status: 'active' });
    const client = await Client.create({
      name: 'Cliente Poliza',
      identification: 'CLI-POL-001',
      phone: '6000-3000',
      email: 'cli-pol-001@example.com',
      address: 'Calle 2',
      status: 'active',
      assignedAgent: owner._id,
      createdBy: owner._id
    });
    await Policy.create({
      policyNumber: 'POL-DEL-001',
      client: client._id,
      insuranceType: 'auto',
      coverage: 'Cobertura total',
      premium: 400,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'active',
      assignedAgent: target._id,
      createdBy: owner._id
    });

    const res = await request(app).delete(`/api/users/${target._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('USER_HAS_DEPENDENCIES');
    expect(await User.findById(target._id)).not.toBeNull();
  });

  test('cannot reassign responsibilities to a guest', async () => {
    const { token } = await createAdminAndToken({ email: 'admin-guest-reassign@example.com' });
    const source = await User.create({ name: 'Source', email: 'source-guest@example.com', password: 'Passw0rd!', role: 'user', status: 'active' });
    await seedLifecycleDependencies(source);
    const guest = await User.create({ name: 'Guest', email: 'guest-reassign@example.com', password: 'Passw0rd!', role: 'guest', status: 'active' });

    const res = await request(app)
      .patch(`/api/users/${source._id}/reassign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ replacementUserId: guest._id });

    expect(res.status).toBe(400);
  });

  test('cannot reassign responsibilities to an inactive user', async () => {
    const { token } = await createAdminAndToken({ email: 'admin-inactive-reassign@example.com' });
    const source = await User.create({ name: 'Source Inactive', email: 'source-inactive@example.com', password: 'Passw0rd!', role: 'user', status: 'active' });
    await seedLifecycleDependencies(source);
    const inactive = await User.create({ name: 'Inactive', email: 'inactive-reassign@example.com', password: 'Passw0rd!', role: 'user', status: 'inactive' });

    const res = await request(app)
      .patch(`/api/users/${source._id}/reassign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ replacementUserId: inactive._id });

    expect(res.status).toBe(400);
  });

  test('cannot reassign responsibilities to the same user', async () => {
    const { token } = await createAdminAndToken({ email: 'admin-same-reassign@example.com' });
    const source = await User.create({ name: 'Source Same', email: 'source-same@example.com', password: 'Passw0rd!', role: 'user', status: 'active' });
    await seedLifecycleDependencies(source);

    const res = await request(app)
      .patch(`/api/users/${source._id}/reassign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ replacementUserId: source._id });

    expect(res.status).toBe(400);
  });

  test('reassignment updates operational references but not historical authorship', async () => {
    const { token } = await createAdminAndToken({ email: 'admin-reassign@example.com' });
    const source = await User.create({ name: 'Source Reassign', email: 'source-reassign@example.com', password: 'Passw0rd!', role: 'user', status: 'active' });
    const replacement = await User.create({ name: 'Replacement Reassign', email: 'replacement-reassign@example.com', password: 'Passw0rd!', role: 'user', status: 'active' });
    const { client, policy } = await seedLifecycleDependencies(source);

    const res = await request(app)
      .patch(`/api/users/${source._id}/reassign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ replacementUserId: replacement._id });

    expect(res.status).toBe(200);
    expect(res.body.data.updated.clients).toBeGreaterThanOrEqual(1);
    expect(res.body.data.updated.policies).toBeGreaterThanOrEqual(1);
    expect(res.body.data.updated.notifications).toBeGreaterThanOrEqual(1);

    const updatedClient = await Client.findById(client._id);
    const updatedPolicy = await Policy.findById(policy._id);
    const updatedNotification = await Notification.findOne({ recipientUser: replacement._id, client: client._id });
    const originalNotification = await Notification.findOne({ createdBy: source._id, client: client._id });

    expect(String(updatedClient.assignedAgent)).toBe(String(replacement._id));
    expect(String(updatedClient.createdBy)).toBe(String(source._id));
    expect(String(updatedPolicy.assignedAgent)).toBe(String(replacement._id));
    expect(String(updatedPolicy.createdBy)).toBe(String(source._id));
    expect(updatedNotification).not.toBeNull();
    expect(String(originalNotification.createdBy)).toBe(String(source._id));
  });

  test('after reassignment, dependency counts are updated', async () => {
    const { token } = await createAdminAndToken({ email: 'admin-reassign-counts@example.com' });
    const source = await User.create({ name: 'Source Counts', email: 'source-counts@example.com', password: 'Passw0rd!', role: 'user', status: 'active' });
    const replacement = await User.create({ name: 'Replacement Counts', email: 'replacement-counts@example.com', password: 'Passw0rd!', role: 'user', status: 'active' });
    await seedLifecycleDependencies(source);

    const reassignRes = await request(app)
      .patch(`/api/users/${source._id}/reassign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ replacementUserId: replacement._id });

    expect(reassignRes.status).toBe(200);

    const depsRes = await request(app).get(`/api/users/${source._id}/dependencies`).set('Authorization', `Bearer ${token}`);
    expect(depsRes.status).toBe(200);
    expect(depsRes.body.data.reassignableCount).toBe(0);
    expect(depsRes.body.data.blockingCount).toBe(6);
    expect(depsRes.body.data.totalDependencies).toBe(6);
    expect(depsRes.body.data.canDelete).toBe(false);
  });

  test('a user without dependencies can be deleted', async () => {
    const { token } = await createAdminAndToken({ email: 'admin-delete-clean@example.com' });
    const target = await User.create({ name: 'Clean User', email: 'clean-user@example.com', password: 'Passw0rd!', role: 'user', status: 'active' });

    const res = await request(app).delete(`/api/users/${target._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(await User.findById(target._id)).toBeNull();
  });
});