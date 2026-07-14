const { Schema, model } = require('mongoose');

const policySchema = new Schema(
  {
    policyNumber: { type: String, required: true, unique: true, trim: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    insuranceType: { type: String, enum: ['auto', 'home', 'life', 'health', 'travel', 'other'], required: true },
    coverage: { type: String, required: true, trim: true },
    premium: { type: Number, required: true, min: [0.01, 'La prima debe ser mayor que cero'] },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'active', 'expired', 'cancelled'], default: 'draft' },
    assignedAgent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

policySchema.index({ client: 1 });
policySchema.index({ status: 1 });
policySchema.index({ insuranceType: 1 });

module.exports = model('Policy', policySchema);
