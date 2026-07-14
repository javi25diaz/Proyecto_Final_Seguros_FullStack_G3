const Notification = require('../models/Notification');

// Called after the primary CRUD operation has already succeeded. A failure here is
// logged but never propagated, so a secondary notification write can never roll back
// or block the primary business operation (policy/payment/incident/claim).
async function createAutomaticNotification({ message, type, recipientUser, client, relatedEntityType, relatedEntityId, createdBy }) {
  try {
    return await Notification.create({
      message,
      type,
      recipientUser,
      client,
      relatedEntityType,
      relatedEntityId,
      isAutomatic: true,
      createdBy,
      date: new Date()
    });
  } catch (err) {
    console.error('[notification.service] Failed to create automatic notification:', err.message);
    return null;
  }
}

module.exports = { createAutomaticNotification };
