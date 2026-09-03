import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import steamRoutes from './routes/steam.js';
import authRoutes from './routes/auth-router.js';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:4200';

const app = express();

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/steam', steamRoutes);
app.use('/auth', authRoutes);

export default app;
