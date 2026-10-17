import 'dotenv/config';
import mongoose from 'mongoose';
import Patient from '../src/models/Patient.js';
import User from '../src/models/User.js';
import { hashPassword } from '../src/lib/password.js';

const allowedRoles = new Set(['patient', 'receptionist', 'doctor']);

async function main() {
  const name = process.env.BOOTSTRAP_USER_NAME?.trim();
  const email = process.env.BOOTSTRAP_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_USER_PASSWORD;
  const role = process.env.BOOTSTRAP_USER_ROLE;
  const patientId = process.env.BOOTSTRAP_PATIENT_ID?.trim() || null;

  if (!name || !email || !password || !allowedRoles.has(role)) {
    throw new Error('Set BOOTSTRAP_USER_NAME, BOOTSTRAP_USER_EMAIL, BOOTSTRAP_USER_PASSWORD, and BOOTSTRAP_USER_ROLE in server/.env.');
  }
  if (password.length < 12 || password.length > 128) {
    throw new Error('BOOTSTRAP_USER_PASSWORD must be between 12 and 128 characters.');
  }
  if (await User.exists({ email })) {
    throw new Error('An account with that email already exists. No changes were made.');
  }

  let linkedPatient = null;
  if (role === 'patient') {
    if (!patientId || !mongoose.isValidObjectId(patientId)) {
      throw new Error('For a patient account, set BOOTSTRAP_PATIENT_ID to the existing patient record ID.');
    }
    linkedPatient = await Patient.findById(patientId).select('_id');
    if (!linkedPatient) throw new Error('The patient record for BOOTSTRAP_PATIENT_ID was not found.');
  } else if (patientId) {
    throw new Error('Only patient accounts may use BOOTSTRAP_PATIENT_ID.');
  }

  const user = await User.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    role,
    patientId: linkedPatient?._id || null,
  });
  console.log(`Created ${user.role} account for ${user.email}.`);
}

main()
  .catch((error) => {
    console.error(error.message || 'Could not create account.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
