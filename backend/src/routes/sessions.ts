import { Router } from 'express';
import { createSession, getSession, getTurns } from '../db/sessions';
import { runStubNegotiation } from '../orchestrator/orchestrator';

export const sessionsRouter = Router();

sessionsRouter.post('/', async (req, res) => {
  const { mandate_id, catalog_item_id } = req.body;
  if (!mandate_id || !catalog_item_id) {
    return res.status(400).json({ error: 'mandate_id and catalog_item_id required' });
  }
  const session = await createSession(mandate_id, catalog_item_id);
  res.json(session);
});

sessionsRouter.post('/:id/run-stub', async (req, res) => {
  const result = await runStubNegotiation(req.params.id);
  res.json(result);
});

sessionsRouter.get('/:id', async (req, res) => {
  const session = await getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'not found' });
  const turns = await getTurns(req.params.id);
  res.json({ ...session, turns });
});