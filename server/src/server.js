import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import encounterRoutes from './routes/encounters.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const port = Number(process.env.PORT) || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

if (!process.env.AUTH_SECRET || Buffer.byteLength(process.env.AUTH_SECRET) < 32) {
  console.warn('AUTH_SECRET is missing or too short. Set a random value of at least 32 bytes in server/.env before signing in.');
}

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: clientOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
}));
app.use(express.json({ limit: '100kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'caseflow-api',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/encounters', encounterRoutes);
app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, async () => {
  try {
    await connectDatabase();
    console.log(`CaseFlow API is running on http://localhost:${port}`);
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    server.close(() => process.exit(1));
  }
});

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  server.close(() => process.exit(0));
});
process.on('SIGTERM', async () => {
  await mongoose.disconnect();
  server.close(() => process.exit(0));
});
