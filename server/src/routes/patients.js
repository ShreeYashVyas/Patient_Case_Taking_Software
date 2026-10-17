import { Router } from 'express';
import mongoose from 'mongoose';
import Patient from '../models/Patient.js';
import Encounter from '../models/Encounter.js';

const router = Router();

function cleanOptionalString(value) {
  if (typeof value !== 'string') return value;
  const cleaned = value.trim();
  return cleaned === '—' ? '' : cleaned;
}

router.get('/', async (req, res) => {
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

  const patients = await Patient.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ data: patients, count: patients.length });
});

router.post('/', async (req, res) => {
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
    chiefComplaint: payload.chiefComplaint || '',
  });
  res.status(201).json({ data: patient });
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid patient ID.' });
  }
  const patient = await Patient.findById(req.params.id).lean();
  if (!patient) return res.status(404).json({ message: 'Patient not found.' });

  const encounters = await Encounter.find({ patient: patient._id })
    .sort({ visitDate: -1 })
    .limit(100)
    .lean();
  res.json({ data: { ...patient, encounters } });
});

router.patch('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid patient ID.' });
  }
  const allowed = ['fullName', 'dateOfBirth', 'age', 'gender', 'phone', 'email', 'bloodGroup', 'status', 'chiefComplaint'];
  const updates = {};
  for (const key of allowed) {
    if (Object.hasOwn(req.body, key)) updates[key] = cleanOptionalString(req.body[key]);
  }
  const patient = await Patient.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!patient) return res.status(404).json({ message: 'Patient not found.' });
  res.json({ data: patient });
});

export default router;
