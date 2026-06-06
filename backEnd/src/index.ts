import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import streamRoutes from './routes/streams';
import studentRoutes from './routes/students';
import subjectRoutes from './routes/subjects';
import teacherRoutes from './routes/teachers';
import scoreRoutes from './routes/scores';
import gradingScaleRoutes from './routes/gradingScale';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173','http://localhost:5174'],
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Ikonex Academy API is running', timestamp: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/streams', streamRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/grading-scale', gradingScaleRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error Handler ──────────────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 Ikonex Academy API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
