const { Schema, model } = require('mongoose');

const clientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
    identification: { type: String, required: true, trim: true, unique: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    assignedAgent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

clientSchema.index({ email: 1 });
clientSchema.index({ name: 1 });
clientSchema.index({ assignedAgent: 1 });

module.exports = model('Client', clientSchema);
