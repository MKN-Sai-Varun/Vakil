import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sessionsRouter } from './routes/sessions';

dotenv.config();

import { webhooksRouter } from './routes/webhooks';

const app = express();
app.use(cors());
app.use('/webhooks', webhooksRouter); // must come BEFORE express.json(), needs raw body
app.use(express.json());
app.use('/sessions', sessionsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Vakil backend running on port ${PORT}`));