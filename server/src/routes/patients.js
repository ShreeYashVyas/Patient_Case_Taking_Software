import { Router } from 'express';
import mongoose from 'mongoose';
import Patient from '../models/Patient.js';
import Encounter from '../models/Encounter.js';
import { authorizeRoles, requireAuth, requireSameOrigin } from '../middleware/auth.js';

const router = Router();

function cleanOptionalString(value) {
  if (typeof value !== 'string') return value;
  const cleaned = value.trim();
  return cleaned === '—' ? '' : cleaned;
}

router.get('/', requireAuth, authorizeRoles('doctor', 'receptionist'), async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const filter = search
    ? {
        $or: [
          { fullName: { $regex: search.slice(0, 100), $options: 'i' } },
          { patientCode: { $regex: search.slice(0, 100), $options: 'i' } },
          { phone: { $regex: search.slice(0, 100), $options: 'i' } },
        ],
      }
    : {};

  const query = Patient.find(filter).sort({ createdAt: -1 }).limit(100);
  if (req.user.role === 'receptionist') query.select('-chiefComplaint');
  const patients = await query.lean();
  res.json({ data: patients, count: patients.length });
});

router.post('/', requireSameOrigin, requireAuth, authorizeRoles('doctor', 'receptionist'), async (req, res) => {
  const payload = { ...req.body };
  for (const key of ['phone', 'email', 'bloodGroup', 'chiefComplaint']) {
    if (payload[key] !== undefined) payload[key] = cleanOptionalString(payload[key]);
  }
  if (!payload.fullName || typeof payload.fullName !== 'string' || !payload.fullName.trim()) {
    return res.status(400).json({ message: 'fullName is required.' });
  }
  if (payload.email && !/^\S+@\S+\.\S+$/.test(payload.email)) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }

  const patient = await Patient.create({
    fullName: payload.fullName,
    dateOfBirth: payload.dateOfBirth || null,
    age: payload.age === '' || payload.age == null ? null : Number(payload.age),
    gender: payload.gender || 'Prefer not to say',
    phone: payload.phone || '',
    email: payload.email || '',
    bloodGroup: payload.bloodGroup || '',
    status: payload.status || 'Active',
    chiefComplaint: req.user.role === 'doctor' ? (payload.chiefComplaint || '') : '',
  });
  res.status(201).json({ data: patient });
});

router.get('/:id', requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid patient ID.' });
  }
  if (!['doctor', 'receptionist', 'patient'].includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to access this resource.' });
  }

  const patient = await Patient.findById(req.params.id).lean();
  if (!patient) return res.status(404).json({ message: 'Patient not found.' });

  if (req.user.role === 'patient' && req.user.patientId !== String(patient._id)) {
    return res.status(403).json({ message: 'You can only access your own patient record.' });
  }

  if (req.user.role === 'receptionist') {
    const {
      _id, patientCode, fullName, dateOfBirth, age, gender, phone,
      email, bloodGroup, status, createdAt, updatedAt,
    } = patient;
    return res.json({
      data: {
        _id, patientCode, fullName, dateOfBirth, age, gender, phone,
        email, bloodGroup, status, createdAt, updatedAt,
      },
    });
  }

  const encounterFilter = { patient: patient._id };
  if (req.user.role === 'patient') {
    encounterFilter.status = { $in: ['Completed', 'Follow-up'] };
    encounterFilter.patientVisible = true;
  }
  const encounters = await Encounter.find(encounterFilter)
    .sort({ visitDate: -1 })
    .limit(100)
    .lean();
  res.json({ data: { ...patient, encounters } });
});

router.patch('/:id', requireSameOrigin, requireAuth, authorizeRoles('doctor', 'receptionist'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid patient ID.' });
  }
  const allowed = ['fullName', 'dateOfBirth', 'age', 'gender', 'phone', 'email', 'bloodGroup', 'status'];
  const updates = {};
  for (const key of allowed) {
    if (Object.hasOwn(req.body, key)) updates[key] = cleanOptionalString(req.body[key]);
  }
  const patient = await Patient.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!patient) return res.status(404).json({ message: 'Patient not found.' });
  if (req.user.role === 'receptionist') {
    const {
      _id, patientCode, fullName, dateOfBirth, age, gender, phone,
      email, bloodGroup, status, createdAt, updatedAt,
    } = patient.toObject();
    return res.json({
      data: {
        _id, patientCode, fullName, dateOfBirth, age, gender, phone,
        email, bloodGroup, status, createdAt, updatedAt,
      },
    });
  }
  return res.json({ data: patient });
});

export default router;
