const User = require('../models/User');
const Client = require('../models/Client');
const Policy = require('../models/Policy');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const Incident = require('../models/Incident');
const Claim = require('../models/Claim');
const ApiError = require('../utils/ApiError');

const SAFE_USER_FIELDS = 'name email role status createdAt updatedAt';

function buildDependencySnapshot(dependencies) {
  const breakdown = {
    reassignable: {
      assignedClients: dependencies.assignedClients,
      assignedPolicies: dependencies.assignedPolicies,
      recipientNotifications: dependencies.recipientNotifications
    },
    blocking: {
      createdClients: dependencies.createdClients,
      createdPolicies: dependencies.createdPolicies,
      createdNotifications: dependencies.createdNotifications,
      handledClaims: dependencies.handledClaims,
      registeredPayments: dependencies.registeredPayments,
      reportedIncidents: dependencies.reportedIncidents
    }
  };

  const reassignableCount = Object.values(breakdown.reassignable).reduce((sum, value) => sum + value, 0);
  const blockingCount = Object.values(breakdown.blocking).reduce((sum, value) => sum + value, 0);
  const totalDependencies = reassignableCount + blockingCount;

  return {
    dependencies,
    breakdown,
    reassignableCount,
    blockingCount,
    totalDependencies,
    canDelete: totalDependencies === 0
  };
}

async function getUserLifecycleDependencies(userId) {
  const user = await User.findById(userId).select(SAFE_USER_FIELDS);
  if (!user) {
    throw ApiError.notFound('Usuario no encontrado');
  }

  const [assignedClients, assignedPolicies, recipientNotifications, createdClients, createdPolicies, createdNotifications, handledClaims, registeredPayments, reportedIncidents] = await Promise.all([
    Client.countDocuments({ assignedAgent: user._id }),
    Policy.countDocuments({ assignedAgent: user._id }),
    Notification.countDocuments({ recipientUser: user._id }),
    Client.countDocuments({ createdBy: user._id }),
    Policy.countDocuments({ createdBy: user._id }),
    Notification.countDocuments({ createdBy: user._id }),
    Claim.countDocuments({ handledBy: user._id }),
    Payment.countDocuments({ registeredBy: user._id }),
    Incident.countDocuments({ reportedBy: user._id })
  ]);

  return {
    user: user.toSafeObject(),
    ...buildDependencySnapshot({
      assignedClients,
      assignedPolicies,
      recipientNotifications,
      createdClients,
      createdPolicies,
      createdNotifications,
      handledClaims,
      registeredPayments,
      reportedIncidents
    })
  };
}

async function assertValidReplacementUser(sourceUserId, replacementUserId) {
  if (String(sourceUserId) === String(replacementUserId)) {
    throw ApiError.badRequest('El usuario reemplazo no puede ser el mismo usuario de origen', 'SAME_REPLACEMENT_USER');
  }

  const replacementUser = await User.findById(replacementUserId).select(SAFE_USER_FIELDS);
  if (!replacementUser) {
    throw ApiError.notFound('Usuario reemplazo no encontrado', 'REPLACEMENT_USER_NOT_FOUND');
  }

  if (replacementUser.status !== 'active') {
    throw ApiError.badRequest('El usuario reemplazo debe estar activo', 'REPLACEMENT_USER_INACTIVE');
  }

  if (!['user', 'admin'].includes(replacementUser.role)) {
    throw ApiError.badRequest('El usuario reemplazo debe tener rol user o admin', 'REPLACEMENT_USER_ROLE_INVALID');
  }

  return replacementUser;
}

async function reassignUserResponsibilities(sourceUserId, replacementUserId) {
  const sourceSnapshot = await getUserLifecycleDependencies(sourceUserId);
  const replacementUser = await assertValidReplacementUser(sourceUserId, replacementUserId);

  const [clientsResult, policiesResult, notificationsResult] = await Promise.all([
    Client.updateMany({ assignedAgent: sourceUserId }, { $set: { assignedAgent: replacementUser._id } }),
    Policy.updateMany({ assignedAgent: sourceUserId }, { $set: { assignedAgent: replacementUser._id } }),
    Notification.updateMany({ recipientUser: sourceUserId }, { $set: { recipientUser: replacementUser._id } })
  ]);

  const remainingDependencies = await getUserLifecycleDependencies(sourceUserId);

  return {
    sourceUser: sourceSnapshot.user,
    replacementUser: replacementUser.toSafeObject(),
    updated: {
      clients: clientsResult.modifiedCount,
      policies: policiesResult.modifiedCount,
      notifications: notificationsResult.modifiedCount
    },
    totalUpdated: clientsResult.modifiedCount + policiesResult.modifiedCount + notificationsResult.modifiedCount,
    remainingDependencies,
    canDeleteSourceUser: remainingDependencies.canDelete
  };
}

module.exports = {
  getUserLifecycleDependencies,
  reassignUserResponsibilities
};