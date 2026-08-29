import { appendTurn, updateSessionStatus } from '../db/sessions';

const MAX_TURNS = 10;

const SCRIPTED_MOVES: Array<{ actor: 'buyer' | 'merchant'; type: string; unit_price?: number }> = [
  { actor: 'buyer', type: 'counter', unit_price: 800 },
  { actor: 'merchant', type: 'counter', unit_price: 950 },
  { actor: 'buyer', type: 'counter', unit_price: 870 },
  { actor: 'merchant', type: 'accept' },
];

export async function runStubNegotiation(sessionId: string) {
  let turn = 0;
  let converged = false;

  for (const move of SCRIPTED_MOVES) {
    turn++;
    await appendTurn(sessionId, move.actor, move, 'pass', 'stub — no policy gate yet');
    if (move.type === 'accept') {
      converged = true;
      break;
    }
    if (turn >= MAX_TURNS) break;
  }

  await updateSessionStatus(sessionId, converged ? 'converged' : 'failed');
  return { converged, turnsUsed: turn };
}
