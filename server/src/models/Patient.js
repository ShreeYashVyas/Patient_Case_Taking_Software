import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  patientCode: {
    type: String,
    unique: true,
    index: true,
    immutable: true,
  },
  fullName: { type: String, required: true, trim: true, maxlength: 120 },
  dateOfBirth: { type: Date, default: null },
  age: { type: Number, min: 0, max: 125, default: null },
  gender: {
    type: String,
    enum: ['Female', 'Male', 'Non-binary', 'Other', 'Prefer not to say'],
    default: 'Prefer not to say',
  },
  phone: { type: String, trim: true, maxlength: 30, default: '' },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
  bloodGroup: {
    type: String,
    enum: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    default: '',
  },
  status: { type: String, enum: ['Active', 'Follow-up', 'Inactive'], default: 'Active' },
  chiefComplaint: { type: String, trim: true, maxlength: 500, default: '' },
  lastVisit: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

patientSchema.pre('validate', function assignPatientCode() {
  if (!this.patientCode) this.patientCode = `PT-${randomUUID().slice(0, 8).toUpperCase()}`;
});

export default mongoose.model('Patient', patientSchema);
