const User = require('../models/User');
const Client = require('../models/Client');
const Policy = require('../models/Policy');
const Payment = require('../models/Payment');
const Incident = require('../models/Incident');
const Claim = require('../models/Claim');
const Notification = require('../models/Notification');

// Uses UTC boundaries because date-only strings (e.g. "2026-07-01") sent by the
// client are parsed by JS/Mongoose as UTC midnight; comparing against a
// server-local-time month start would misclassify payments near month edges
// whenever the server timezone is not UTC.
function startOfMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function getAdminSummary() {
  const [
    totalUsers,
    activeUsers,
    totalClients,
    activePolicies,
    pendingClaims,
    openIncidents,
    paidThisMonth,
    unreadNotifications,
    recentClients,
    recentClaims
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ status: 'active' }),
    Client.countDocuments({}),
    Policy.countDocuments({ status: 'active' }),
    Claim.countDocuments({ status: { $in: ['received', 'under_analysis'] } }),
    Incident.countDocuments({ status: { $ne: 'closed' } }),
    Payment.aggregate([
      { $match: { status: 'paid', paymentDate: { $gte: startOfMonth() } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Notification.countDocuments({ isRead: false }),
    Client.find({}).sort('-createdAt').limit(5).select('name identification status createdAt'),
    Claim.find({}).sort('-createdAt').limit(5).select('claimNumber status amountRequested createdAt').populate('client', 'name')
  ]);

  return {
    totalUsers,
    activeUsers,
    totalClients,
    activePolicies,
    pendingClaims,
    openIncidents,
    totalPaidThisMonth: paidThisMonth[0]?.total || 0,
    unreadNotifications,
    recentClients,
    recentClaims
  };
}

async function getAgentSummary(agentId) {
  const clientIds = await Client.find({ assignedAgent: agentId }).distinct('_id');

  const [
    myClients,
    myPolicies,
    claimsUnderAnalysis,
    openIncidents,
    recentPayments,
    myNotifications
  ] = await Promise.all([
    Client.countDocuments({ assignedAgent: agentId }),
    Policy.countDocuments({ assignedAgent: agentId }),
    Claim.countDocuments({ client: { $in: clientIds }, status: 'under_analysis' }),
    Incident.countDocuments({ client: { $in: clientIds }, status: { $ne: 'closed' } }),
    Payment.find({ client: { $in: clientIds } }).sort('-createdAt').limit(5).populate('client', 'name'),
    Notification.find({ $or: [{ recipientUser: agentId }, { client: { $in: clientIds } }] }).sort('-date').limit(5)
  ]);

  return {
    myClients,
    myPolicies,
    claimsUnderAnalysis,
    openIncidents,
    recentPayments,
    myNotifications
  };
}

async function getRecentActivity(limit = 15) {
  const [policies, payments, incidents, claims] = await Promise.all([
    Policy.find({}).sort('-createdAt').limit(limit).select('policyNumber status createdAt').populate('client', 'name'),
    Payment.find({}).sort('-createdAt').limit(limit).select('receiptNumber amount status createdAt').populate('client', 'name'),
    Incident.find({}).sort('-createdAt').limit(limit).select('incidentNumber status createdAt').populate('client', 'name'),
    Claim.find({}).sort('-createdAt').limit(limit).select('claimNumber status createdAt').populate('client', 'name')
  ]);

  const activity = [
    ...policies.map((p) => ({ entityType: 'Policy', label: p.policyNumber, status: p.status, client: p.client?.name, date: p.createdAt })),
    ...payments.map((p) => ({ entityType: 'Payment', label: p.receiptNumber, status: p.status, client: p.client?.name, date: p.createdAt })),
    ...incidents.map((i) => ({ entityType: 'Incident', label: i.incidentNumber, status: i.status, client: i.client?.name, date: i.createdAt })),
    ...claims.map((c) => ({ entityType: 'Claim', label: c.claimNumber, status: c.status, client: c.client?.name, date: c.createdAt }))
  ];

  activity.sort((a, b) => new Date(b.date) - new Date(a.date));

  return activity.slice(0, limit);
}

module.exports = { getAdminSummary, getAgentSummary, getRecentActivity };
