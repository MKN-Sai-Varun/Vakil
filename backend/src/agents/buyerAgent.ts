import { groq, GROQ_MODEL } from './groqClient';
import { BuyerMoveSchema, BuyerMove } from './schema';
import { buyerSystemPrompt } from './prompts';

interface BuyerContext {
  maxUnitPrice: number;
  remainingSpend: number;
  turnHistory: string;
  currentOffer: { unit_price: number; quantity: number } | null;
}

export async function proposeBuyerMove(ctx: BuyerContext): Promise<BuyerMove> {
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: buyerSystemPrompt({ max_unit_price: ctx.maxUnitPrice, remainingSpend: ctx.remainingSpend }) },
        { role: 'user', content: `Turn history:\n${ctx.turnHistory}\n\nMerchant's current offer: ${JSON.stringify(ctx.currentOffer)}\n\nWhat is your move?` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const parsed = BuyerMoveSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      console.error('[buyerAgent] Schema validation failed. Raw response:', raw, 'Errors:', parsed.error);
      return fallbackBuyerMove(ctx);
    }
    return parsed.data;
  } catch (err) {
    console.error('[buyerAgent] Groq call failed:', err);
    return fallbackBuyerMove(ctx);
  }
}

function fallbackBuyerMove(ctx: BuyerContext): BuyerMove & { _fallback: true } {
  // Never echo an offer that violates our own constraints - clamp to our actual ceiling
  const quantity = ctx.currentOffer?.quantity ?? 1;
  const safeUnitPrice = Math.min(
    ctx.currentOffer?.unit_price ?? ctx.maxUnitPrice,
    ctx.maxUnitPrice
  );
  const total = safeUnitPrice * quantity;

  // If even our own ceiling can't afford this quantity within remaining budget, walk away rather than propose an illegal deal
  if (total > ctx.remainingSpend) {
    return {
      type: 'walk_away',
      unit_price: null,
      quantity,
      total: 0,
      rationale: 'This is outside what we can offer within our current budget.',
      _fallback: true,
    };
  }

  return {
    type: 'counter',
    unit_price: safeUnitPrice,
    quantity,
    total,
    rationale: 'Holding at our current position while we review the terms.',
    _fallback: true,
  };
}