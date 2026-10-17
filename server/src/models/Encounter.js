import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';

const vitalsSchema = new mongoose.Schema({
  bloodPressure: { type: String, trim: true, maxlength: 40, default: '' },
  pulse: { type: String, trim: true, maxlength: 40, default: '' },
  temperature: { type: String, trim: true, maxlength: 40, default: '' },
  respiratoryRate: { type: String, trim: true, maxlength: 40, default: '' },
  weight: { type: String, trim: true, maxlength: 40, default: '' },
}, { _id: false });

const encounterSchema = new mongoose.Schema({
  caseCode: { type: String, unique: true, index: true, immutable: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  visitDate: { type: Date, default: Date.now, index: true },
  chiefComplaint: { type: String, required: true, trim: true, maxlength: 2000 },
  duration: { type: String, trim: true, maxlength: 200, default: '' },
  history: { type: String, trim: true, maxlength: 10000, default: '' },
  medicalHistory: { type: String, trim: true, maxlength: 10000, default: '' },
  allergies: { type: String, trim: true, maxlength: 5000, default: '' },
  medications: { type: String, trim: true, maxlength: 5000, default: '' },
  vitals: { type: vitalsSchema, default: () => ({}) },
  examination: { type: String, trim: true, maxlength: 10000, default: '' },
  assessment: { type: String, trim: true, maxlength: 10000, default: '' },
  plan: { type: String, trim: true, maxlength: 10000, default: '' },
  followUpDate: { type: Date, default: null },
  status: { type: String, enum: ['In progress', 'Completed', 'Follow-up'], default: 'Completed' },
  patientVisible: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

encounterSchema.pre('validate', function assignCaseCode() {
  if (!this.caseCode) this.caseCode = `CS-${randomUUID().slice(0, 8).toUpperCase()}`;
});

export default mongoose.model('Encounter', encounterSchema);
