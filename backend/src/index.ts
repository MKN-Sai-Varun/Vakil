import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sessionsRouter } from './routes/sessions';
import { mandatesRouter } from './routes/mandates';
import { catalogRouter } from './routes/catalog';
import { ledgerRouter } from './routes/ledger';
import { authRouter } from './routes/auth';
import { merchantsRouter } from './routes/merchants';

dotenv.config();

import { webhooksRouter } from './routes/webhooks';


const app = express();
app.use(cors());
app.use('/webhooks', webhooksRouter); // must come BEFORE express.json(), needs raw body
app.use(express.json());
app.use('/sessions', sessionsRouter);
app.use('/mandates', mandatesRouter);
app.use('/catalog-items', catalogRouter);
app.use('/ledger', ledgerRouter);
app.use('/auth',authRouter);
app.use('/merchants', merchantsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Vakil backend running on port ${PORT}`));