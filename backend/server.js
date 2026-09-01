import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import steamRoutes from './routes/steam.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/steam', steamRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Steam backend running on port ${PORT}`);
});
