import { Router } from 'express';
import mongoose from 'mongoose';
import Patient from '../models/Patient.js';
import Encounter from '../models/Encounter.js';

const router = Router();

router.get('/', async (req, res) => {
  const filter = {};
  if (typeof req.query.patientId === 'string' && req.query.patientId) {
    if (!mongoose.isValidObjectId(req.query.patientId)) {
      return res.status(400).json({ message: 'Invalid patientId.' });
    }
    filter.patient = req.query.patientId;
  }

  const encounters = await Encounter.find(filter)
    .populate('patient', 'patientCode fullName')
    .sort({ visitDate: -1 })
    .limit(100)
    .lean();
  res.json({ data: encounters, count: encounters.length });
});

router.post('/', async (req, res) => {
  const body = req.body || {};
  if (!body.patientId || !mongoose.isValidObjectId(body.patientId)) {
    return res.status(400).json({ message: 'Select a valid patient.' });
  }
  if (typeof body.chiefComplaint !== 'string' || !body.chiefComplaint.trim()) {
    return res.status(400).json({ message: 'chiefComplaint is required.' });
  }

  const patient = await Patient.findById(body.patientId);
  if (!patient) return res.status(404).json({ message: 'Patient not found.' });

  const encounter = await Encounter.create({
    patient: patient._id,
    visitDate: body.visitDate || new Date(),
    chiefComplaint: body.chiefComplaint,
    duration: body.duration || '',
    history: body.history || '',
    medicalHistory: body.medicalHistory || '',
    allergies: body.allergies || '',
    medications: body.medications || '',
    vitals: {
      bloodPressure: body.bloodPressure || body.vitals?.bloodPressure || '',
      pulse: body.pulse || body.vitals?.pulse || '',
      temperature: body.temperature || body.vitals?.temperature || '',
      respiratoryRate: body.respiratoryRate || body.vitals?.respiratoryRate || '',
      weight: body.weight || body.vitals?.weight || '',
    },
    examination: body.examination || '',
    assessment: body.assessment || '',
    plan: body.plan || '',
    followUpDate: body.followUpDate || null,
    status: body.status || (body.followUpDate ? 'Follow-up' : 'Completed'),
  });

  patient.lastVisit = encounter.visitDate;
  patient.chiefComplaint = encounter.chiefComplaint;
  if (encounter.followUpDate) patient.status = 'Follow-up';
  await patient.save();

  const saved = await Encounter.findById(encounter._id)
    .populate('patient', 'patientCode fullName')
    .lean();
  res.status(201).json({ data: saved });
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid case ID.' });
  }
  const encounter = await Encounter.findById(req.params.id)
    .populate('patient', 'patientCode fullName')
    .lean();
  if (!encounter) return res.status(404).json({ message: 'Consultation not found.' });
  res.json({ data: encounter });
});

export default router;
