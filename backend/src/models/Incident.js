const { Schema, model } = require('mongoose');

const incidentSchema = new Schema(
  {
    incidentNumber: { type: String, required: true, unique: true, trim: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    policy: { type: Schema.Types.ObjectId, ref: 'Policy', required: true },
    description: { type: String, required: true, trim: true },
    eventDate: { type: Date, required: true },
    evidenceUrl: { type: String, trim: true },
    status: { type: String, enum: ['reported', 'under_review', 'closed'], default: 'reported' },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

incidentSchema.index({ client: 1 });
incidentSchema.index({ policy: 1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ eventDate: 1 });

module.exports = model('Incident', incidentSchema);
