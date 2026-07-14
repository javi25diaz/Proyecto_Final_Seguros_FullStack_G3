const { Schema, model } = require('mongoose');

const notificationSchema = new Schema(
  {
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ['policy', 'payment', 'incident', 'claim', 'system'], required: true },
    recipientUser: { type: Schema.Types.ObjectId, ref: 'User' },
    client: { type: Schema.Types.ObjectId, ref: 'Client' },
    relatedEntityType: { type: String, enum: ['Policy', 'Payment', 'Incident', 'Claim', 'User'] },
    relatedEntityId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
    isAutomatic: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

notificationSchema.pre('validate', function requireRecipient(next) {
  if (!this.recipientUser && !this.client) {
    next(new Error('La notificación debe tener al menos un destinatario (usuario o cliente)'));
    return;
  }
  next();
});

notificationSchema.index({ recipientUser: 1 });
notificationSchema.index({ client: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ date: -1 });

module.exports = model('Notification', notificationSchema);
