const { Schema, model } = require('mongoose');

const paymentSchema = new Schema(
  {
    receiptNumber: { type: String, required: true, unique: true, trim: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    policy: { type: Schema.Types.ObjectId, ref: 'Policy', required: true },
    amount: { type: Number, required: true, min: [0.01, 'El monto debe ser mayor que cero'] },
    paymentDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'paid', 'reversed'], default: 'pending' },
    method: { type: String, enum: ['cash', 'card', 'transfer', 'other'], required: true },
    reference: { type: String, trim: true },
    notes: { type: String, trim: true },
    registeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

paymentSchema.index({ client: 1 });
paymentSchema.index({ policy: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentDate: 1 });

module.exports = model('Payment', paymentSchema);
