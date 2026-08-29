import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sessionsRouter } from './routes/sessions';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/sessions', sessionsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Vakil backend running on port ${PORT}`));