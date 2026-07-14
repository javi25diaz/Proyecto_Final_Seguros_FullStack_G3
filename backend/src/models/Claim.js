const { Schema, model } = require('mongoose');

const claimSchema = new Schema(
  {
    claimNumber: { type: String, required: true, unique: true, trim: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    policy: { type: Schema.Types.ObjectId, ref: 'Policy', required: true },
    incident: { type: Schema.Types.ObjectId, ref: 'Incident', required: true },
    claimDate: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ['received', 'under_analysis', 'approved', 'rejected'], default: 'received' },
    amountRequested: { type: Number, required: true, min: [0.01, 'El monto solicitado debe ser mayor que cero'] },
    amountApproved: { type: Number, min: 0 },
    description: { type: String, required: true, trim: true },
    documentUrls: { type: [String], default: [] },
    resolutionNotes: { type: String, trim: true },
    handledBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

claimSchema.index({ client: 1 });
claimSchema.index({ policy: 1 });
claimSchema.index({ incident: 1 });
claimSchema.index({ status: 1 });
claimSchema.index({ claimDate: 1 });

module.exports = model('Claim', claimSchema);
