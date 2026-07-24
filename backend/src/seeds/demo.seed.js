const { connectDatabase, disconnectDatabase } = require('../config/database');
const { ensureDefaultAdmin } = require('./defaultAdmin.seed');
const { generateBusinessId } = require('../services/sequence.service');
const { createAutomaticNotification } = require('../services/notification.service');

const User = require('../models/User');
const Client = require('../models/Client');
const Policy = require('../models/Policy');
const Payment = require('../models/Payment');
const Incident = require('../models/Incident');
const Claim = require('../models/Claim');

async function normalizeLegacyE2EUsers() {
  const legacyUsers = await User.find({ email: /^e2euser\d+@test\.com$/i });
  const realProfiles = [
    { name: 'Raúl Herrera', email: 'raul.herrera@insuretech.com' },
    { name: 'Marta López', email: 'marta.lopez@insuretech.com' },
    { name: 'Diego Torres', email: 'diego.torres@insuretech.com' },
    { name: 'Nadia Flores', email: 'nadia.flores@insuretech.com' },
    { name: 'Sebastián Ruiz', email: 'sebastian.ruiz@insuretech.com' }
  ];

  for (const [index, legacyUser] of legacyUsers.entries()) {
    const profile = realProfiles[index % realProfiles.length];
    legacyUser.name = profile.name;
    legacyUser.email = profile.email;
    legacyUser.role = 'user';
    legacyUser.status = 'active';
    await legacyUser.save();
    console.log(`[seed:demo] Renamed legacy E2E user ${legacyUser.email} to ${profile.email}`);
  }
}

async function ensureUser({ name, email, password, role, status = 'active' }) {
  let user = await User.findOne({ email });

  if (user) {
    const needsUpdate = user.name !== name || user.role !== role || user.status !== status;
    if (needsUpdate) {
      user.name = name;
      user.role = role;
      user.status = status;
      await user.save();
    }

    console.log(`[seed:demo] User present: ${email} (${role})`);
    return user;
  }

  user = await User.create({ name, email, password, role, status });
  console.log(`[seed:demo] Created user: ${email} (${role})`);
  return user;
}

async function normalizeLegacyE2EClients() {
  const legacyClients = await Client.find({ identification: /^E2E-/i });
  const normalizedClientEmails = {
    'jose.perez@insuretech.com': 'jose.perez@gmail.com',
    'patricia.vega@insuretech.com': 'patricia.vega@yahoo.com',
    'miguel.castro@insuretech.com': 'miguel.castro@hotmail.com',
    'clara.morales@insuretech.com': 'clara.morales@outlook.com',
    'tomas.rios@insuretech.com': 'tomas.rios@gmail.com'
  };

  const realProfiles = [
    { name: 'José Pérez', identification: '8-100-123', phone: '6111-1111', email: 'jose.perez@gmail.com' },
    { name: 'Patricia Vega', identification: '8-101-456', phone: '6111-3333', email: 'patricia.vega@yahoo.com' },
    { name: 'Miguel Castro', identification: '8-102-789', phone: '6111-4444', email: 'miguel.castro@hotmail.com' },
    { name: 'Clara Morales', identification: '8-103-147', phone: '6111-5555', email: 'clara.morales@outlook.com' },
    { name: 'Tomás Ríos', identification: '8-104-258', phone: '6111-6666', email: 'tomas.rios@gmail.com' }
  ];

  for (const [index, legacyClient] of legacyClients.entries()) {
    const profile = realProfiles[index % realProfiles.length];
    legacyClient.name = profile.name;
    legacyClient.identification = profile.identification;
    legacyClient.phone = profile.phone;
    legacyClient.email = profile.email;
    legacyClient.status = 'active';
    await legacyClient.save();
    console.log(`[seed:demo] Normalized legacy E2E client: ${profile.name}`);
  }

  const enterpriseDomainClients = await Client.find({ email: /@insuretech\.com$/i });
  for (const enterpriseDomainClient of enterpriseDomainClients) {
    enterpriseDomainClient.email = normalizedClientEmails[enterpriseDomainClient.email] || enterpriseDomainClient.email.replace(/@insuretech\.com$/i, '@gmail.com');
    await enterpriseDomainClient.save();
    console.log(`[seed:demo] Fixed customer email domain to external address: ${enterpriseDomainClient.email}`);
  }
}

async function ensureClient({ name, identification, phone, email, address, status, assignedAgent, createdBy }) {
  let client = await Client.findOne({ identification });

  if (client) {
    const needsUpdate =
      client.name !== name ||
      client.phone !== phone ||
      client.email !== email ||
      client.address !== address ||
      client.status !== status ||
      client.assignedAgent?.toString() !== assignedAgent.toString();

    if (needsUpdate) {
      client.name = name;
      client.phone = phone;
      client.email = email;
      client.address = address;
      client.status = status;
      client.assignedAgent = assignedAgent;
      client.createdBy = createdBy;
      await client.save();
    }

    console.log(`[seed:demo] Client present: ${name} (${identification})`);
    return client;
  }

  client = await Client.create({
    name,
    identification,
    phone,
    email,
    address,
    status,
    assignedAgent,
    createdBy
  });

  console.log(`[seed:demo] Created client: ${client.name}`);
  return client;
}

async function ensurePolicy({ policyNumber, client, insuranceType, coverage, premium, startDate, endDate, status, assignedAgent, createdBy }) {
  let policy = await Policy.findOne({ policyNumber });

  if (policy) {
    return policy;
  }

  policy = await Policy.create({
    policyNumber,
    client,
    insuranceType,
    coverage,
    premium,
    startDate,
    endDate,
    status,
    assignedAgent,
    createdBy
  });

  console.log(`[seed:demo] Created policy: ${policy.policyNumber}`);
  return policy;
}

async function ensurePayment({ receiptNumber, client, policy, amount, paymentDate, status, method, registeredBy }) {
  let payment = await Payment.findOne({ receiptNumber });

  if (payment) {
    return payment;
  }

  payment = await Payment.create({
    receiptNumber,
    client,
    policy,
    amount,
    paymentDate,
    status,
    method,
    registeredBy
  });

  console.log(`[seed:demo] Created payment: ${payment.receiptNumber}`);
  return payment;
}

async function ensureIncident({ incidentNumber, client, policy, description, eventDate, status, reportedBy }) {
  let incident = await Incident.findOne({ incidentNumber });

  if (incident) {
    return incident;
  }

  incident = await Incident.create({
    incidentNumber,
    client,
    policy,
    description,
    eventDate,
    status,
    reportedBy
  });

  console.log(`[seed:demo] Created incident: ${incident.incidentNumber}`);
  return incident;
}

async function ensureClaim({ claimNumber, client, policy, incident, claimDate, status, amountRequested, description, handledBy }) {
  let claim = await Claim.findOne({ claimNumber });

  if (claim) {
    return claim;
  }

  claim = await Claim.create({
    claimNumber,
    client,
    policy,
    incident,
    claimDate,
    status,
    amountRequested,
    description,
    handledBy
  });

  console.log(`[seed:demo] Created claim: ${claim.claimNumber}`);
  return claim;
}

async function run() {
  await connectDatabase();
  await ensureDefaultAdmin();
  await normalizeLegacyE2EUsers();
  await normalizeLegacyE2EClients();

  const admin = await User.findOne({ role: 'admin' });
  const agentCarlos = await ensureUser({
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@insuretech.com',
    password: 'Agente123*',
    role: 'user'
  });
  const agentSofia = await ensureUser({
    name: 'Sofía Álvarez',
    email: 'sofia.alvarez@insuretech.com',
    password: 'Agente123*',
    role: 'user'
  });
  await ensureUser({
    name: 'Ana García',
    email: 'ana.garcia@insuretech.com',
    password: 'Guest123*',
    role: 'guest'
  });

  const clientDefinitions = [
    {
      name: 'María González',
      identification: '8-888-888',
      phone: '6000-0000',
      email: 'maria.gonzalez@gmail.com',
      address: 'Calle Principal 123, Panama City',
      status: 'active'
    },
    {
      name: 'Luis Ortega',
      identification: '4-123-456',
      phone: '6542-1100',
      email: 'luis.ortega@yahoo.com',
      address: 'Avenida Central 88, Panama City',
      status: 'active'
    },
    {
      name: 'Lucía Ramírez',
      identification: '8-456-789',
      phone: '6123-4455',
      email: 'lucia.ramirez@hotmail.com',
      address: 'Via España 45, Panama City',
      status: 'inactive'
    },
    {
      name: 'Javier Morales',
      identification: '6-321-654',
      phone: '6988-9012',
      email: 'javier.morales@outlook.com',
      address: 'Calle 50 101, San Miguelito',
      status: 'active'
    }
  ];

  const clients = [];
  for (const clientDefinition of clientDefinitions) {
    const assignedAgent = clientDefinition.status === 'inactive' ? agentSofia : agentCarlos;
    const client = await ensureClient({
      ...clientDefinition,
      assignedAgent: assignedAgent._id,
      createdBy: admin ? admin._id : assignedAgent._id
    });
    clients.push(client);
  }

  const today = new Date();
  const oneYearLater = new Date(today);
  const oneYearAgo = new Date(today);
  const sixMonthsAgo = new Date(today);
  oneYearLater.setFullYear(today.getFullYear() + 1);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  sixMonthsAgo.setMonth(today.getMonth() - 6);

  const policyDefinitions = [
    {
      client: clients[0]._id,
      insuranceType: 'auto',
      coverage: 'Cobertura total para vehículo',
      premium: 520,
      startDate: today,
      endDate: oneYearLater,
      status: 'active'
    },
    {
      client: clients[0]._id,
      insuranceType: 'home',
      coverage: 'Cobertura de hogar y contenido',
      premium: 420,
      startDate: sixMonthsAgo,
      endDate: oneYearLater,
      status: 'active'
    },
    {
      client: clients[1]._id,
      insuranceType: 'health',
      coverage: 'Cobertura médica familiar',
      premium: 680,
      startDate: oneYearAgo,
      endDate: sixMonthsAgo,
      status: 'expired'
    },
    {
      client: clients[1]._id,
      insuranceType: 'travel',
      coverage: 'Cobertura internacional de viaje',
      premium: 210,
      startDate: today,
      endDate: oneYearLater,
      status: 'draft'
    },
    {
      client: clients[2]._id,
      insuranceType: 'life',
      coverage: 'Seguro de vida con beneficiarios',
      premium: 390,
      startDate: today,
      endDate: oneYearLater,
      status: 'cancelled'
    },
    {
      client: clients[3]._id,
      insuranceType: 'auto',
      coverage: 'Cobertura de daños parciales',
      premium: 470,
      startDate: today,
      endDate: oneYearLater,
      status: 'active'
    }
  ];

  const policies = [];
  for (const [index, policyDefinition] of policyDefinitions.entries()) {
    const policy = await ensurePolicy({
      policyNumber: await generateBusinessId('POL'),
      client: policyDefinition.client,
      insuranceType: policyDefinition.insuranceType,
      coverage: policyDefinition.coverage,
      premium: policyDefinition.premium,
      startDate: policyDefinition.startDate,
      endDate: policyDefinition.endDate,
      status: policyDefinition.status,
      assignedAgent: agentCarlos._id,
      createdBy: admin ? admin._id : agentCarlos._id
    });

    await createAutomaticNotification({
      message: `Se registró la póliza ${policy.policyNumber} para ${await Client.findById(policy.client).then((client) => client.name)}.`,
      type: 'policy',
      recipientUser: agentCarlos._id,
      client: policy.client,
      relatedEntityType: 'Policy',
      relatedEntityId: policy._id
    });

    policies.push(policy);
  }

  const paymentDefinitions = [
    {
      client: clients[0]._id,
      policy: policies[0]._id,
      amount: 260,
      paymentDate: today,
      status: 'paid',
      method: 'transfer'
    },
    {
      client: clients[1]._id,
      policy: policies[2]._id,
      amount: 340,
      paymentDate: today,
      status: 'pending',
      method: 'card'
    },
    {
      client: clients[3]._id,
      policy: policies[5]._id,
      amount: 235,
      paymentDate: today,
      status: 'reversed',
      method: 'cash'
    }
  ];

  for (const [index, paymentDefinition] of paymentDefinitions.entries()) {
    const payment = await ensurePayment({
      receiptNumber: await generateBusinessId('PAY'),
      client: paymentDefinition.client,
      policy: paymentDefinition.policy,
      amount: paymentDefinition.amount,
      paymentDate: paymentDefinition.paymentDate,
      status: paymentDefinition.status,
      method: paymentDefinition.method,
      registeredBy: agentCarlos._id
    });

    await createAutomaticNotification({
      message: `Se registró el pago ${payment.receiptNumber} por B/. ${payment.amount.toFixed(2)}.`,
      type: 'payment',
      recipientUser: agentCarlos._id,
      client: payment.client,
      relatedEntityType: 'Payment',
      relatedEntityId: payment._id
    });
  }

  const incidentDefinitions = [
    {
      client: clients[0]._id,
      policy: policies[0]._id,
      description: 'Colisión en Vía España con impacto leve en el vehículo.',
      eventDate: today,
      status: 'reported'
    },
    {
      client: clients[1]._id,
      policy: policies[2]._id,
      description: 'Consulta de atención médica por emergencia domiciliaria.',
      eventDate: sixMonthsAgo,
      status: 'closed'
    }
  ];

  const incidents = [];
  for (const incidentDefinition of incidentDefinitions) {
    const incident = await ensureIncident({
      incidentNumber: await generateBusinessId('INC'),
      client: incidentDefinition.client,
      policy: incidentDefinition.policy,
      description: incidentDefinition.description,
      eventDate: incidentDefinition.eventDate,
      status: incidentDefinition.status,
      reportedBy: agentCarlos._id
    });

    await createAutomaticNotification({
      message: `Se reportó el siniestro ${incident.incidentNumber}.`,
      type: 'incident',
      recipientUser: agentCarlos._id,
      client: incident.client,
      relatedEntityType: 'Incident',
      relatedEntityId: incident._id
    });

    incidents.push(incident);
  }

  const claimDefinitions = [
    {
      client: clients[0]._id,
      policy: policies[0]._id,
      incident: incidents[0]._id,
      claimDate: today,
      status: 'under_analysis',
      amountRequested: 1500,
      description: 'Reparación total del vehículo por choque frontal.'
    },
    {
      client: clients[1]._id,
      policy: policies[2]._id,
      incident: incidents[1]._id,
      claimDate: sixMonthsAgo,
      status: 'approved',
      amountRequested: 875,
      description: 'Cobertura de hospitalización por atención médica urgente.'
    }
  ];

  for (const claimDefinition of claimDefinitions) {
    const claim = await ensureClaim({
      claimNumber: await generateBusinessId('CLM'),
      client: claimDefinition.client,
      policy: claimDefinition.policy,
      incident: claimDefinition.incident,
      claimDate: claimDefinition.claimDate,
      status: claimDefinition.status,
      amountRequested: claimDefinition.amountRequested,
      description: claimDefinition.description,
      handledBy: agentCarlos._id
    });

    await createAutomaticNotification({
      message: `La reclamación ${claim.claimNumber} cambió a ${claim.status}.`,
      type: 'claim',
      recipientUser: agentCarlos._id,
      client: claim.client,
      relatedEntityType: 'Claim',
      relatedEntityId: claim._id
    });
  }

  console.log('[seed:demo] Demo data seeded successfully with realistic variety.');
  await disconnectDatabase();
}

run().catch((err) => {
  console.error('[seed:demo] Failed:', err);
  process.exit(1);
});
