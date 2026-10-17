import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    lowercase: true,
    maxlength: 254,
  },
  passwordHash: { type: String, required: true, select: false },
  role: {
    type: String,
    required: true,
    enum: ['patient', 'receptionist', 'doctor'],
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null,
    index: true,
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

userSchema.pre('validate', function validatePatientLink() {
  if (this.role === 'patient' && !this.patientId) {
    this.invalidate('patientId', 'Patient accounts must be linked to a patient record.');
  }
  if (this.role !== 'patient') this.patientId = null;
});

export default mongoose.model('User', userSchema);
