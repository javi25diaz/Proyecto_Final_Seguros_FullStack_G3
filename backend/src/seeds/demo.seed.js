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

async function ensureUser({ name, email, password, role }) {
  let user = await User.findOne({ email });
  if (user) {
    console.log(`[seed:demo] User already exists, skipping: ${email}`);
    return user;
  }
  user = await User.create({ name, email, password, role, status: 'active' });
  console.log(`[seed:demo] Created user: ${email} (${role})`);
  return user;
}

async function run() {
  await connectDatabase();
  await ensureDefaultAdmin();

  const agent = await ensureUser({ name: 'Carlos Rodríguez', email: 'carlos@insuretech.com', password: 'Agente123*', role: 'user' });
  await ensureUser({ name: 'Invitado Demo', email: 'guest@insuretech.com', password: 'Guest123*', role: 'guest' });

  let client = await Client.findOne({ identification: '8-888-888' });
  if (client) {
    console.log('[seed:demo] Demo client already exists, skipping full flow to avoid duplicates.');
    await disconnectDatabase();
    return;
  }

  client = await Client.create({
    name: 'María González',
    identification: '8-888-888',
    phone: '6000-0000',
    email: 'maria@example.com',
    address: 'Calle Principal 123, Ciudad de Panamá',
    status: 'active',
    assignedAgent: agent._id,
    createdBy: agent._id
  });
  console.log(`[seed:demo] Created client: ${client.name}`);

  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  const policy = await Policy.create({
    policyNumber: await generateBusinessId('POL'),
    client: client._id,
    insuranceType: 'auto',
    coverage: 'Cobertura total',
    premium: 500,
    startDate,
    endDate,
    status: 'active',
    assignedAgent: agent._id,
    createdBy: agent._id
  });
  await createAutomaticNotification({
    message: `Se creó la póliza ${policy.policyNumber} para ${client.name}.`,
    type: 'policy',
    recipientUser: agent._id,
    client: client._id,
    relatedEntityType: 'Policy',
    relatedEntityId: policy._id
  });
  console.log(`[seed:demo] Created policy: ${policy.policyNumber}`);

  const payment = await Payment.create({
    receiptNumber: await generateBusinessId('PAY'),
    client: client._id,
    policy: policy._id,
    amount: 250,
    paymentDate: new Date(),
    status: 'paid',
    method: 'cash',
    registeredBy: agent._id
  });
  await createAutomaticNotification({
    message: `Se registró el pago ${payment.receiptNumber} por B/. ${payment.amount.toFixed(2)}.`,
    type: 'payment',
    recipientUser: agent._id,
    client: client._id,
    relatedEntityType: 'Payment',
    relatedEntityId: payment._id
  });
  console.log(`[seed:demo] Created payment: ${payment.receiptNumber}`);

  const eventDate = new Date();
  const incident = await Incident.create({
    incidentNumber: await generateBusinessId('INC'),
    client: client._id,
    policy: policy._id,
    description: 'Accidente de tránsito en Vía España',
    eventDate,
    status: 'reported',
    reportedBy: agent._id
  });
  await createAutomaticNotification({
    message: `Se reportó el siniestro ${incident.incidentNumber}.`,
    type: 'incident',
    recipientUser: agent._id,
    client: client._id,
    relatedEntityType: 'Incident',
    relatedEntityId: incident._id
  });
  console.log(`[seed:demo] Created incident: ${incident.incidentNumber}`);

  const claim = await Claim.create({
    claimNumber: await generateBusinessId('CLM'),
    client: client._id,
    policy: policy._id,
    incident: incident._id,
    claimDate: new Date(),
    status: 'under_analysis',
    amountRequested: 1500,
    description: 'Reparación de vehículo por daños de accidente',
    handledBy: agent._id
  });
  await createAutomaticNotification({
    message: `La reclamación ${claim.claimNumber} cambió a En análisis.`,
    type: 'claim',
    recipientUser: agent._id,
    client: client._id,
    relatedEntityType: 'Claim',
    relatedEntityId: claim._id
  });
  console.log(`[seed:demo] Created claim: ${claim.claimNumber}`);

  console.log('[seed:demo] Demo data seeded successfully.');
  await disconnectDatabase();
}

run().catch((err) => {
  console.error('[seed:demo] Failed:', err);
  process.exit(1);
});
