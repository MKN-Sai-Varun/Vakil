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
      return fallbackBuyerMove(ctx);
    }
    return parsed.data;
  } catch (err) {
    return fallbackBuyerMove(ctx);
  }
}

function fallbackBuyerMove(ctx: BuyerContext): BuyerMove {
  return {
    type: 'counter',
    unit_price: ctx.currentOffer?.unit_price ?? ctx.maxUnitPrice,
    quantity: ctx.currentOffer?.quantity ?? 1,
    total: (ctx.currentOffer?.unit_price ?? ctx.maxUnitPrice) * (ctx.currentOffer?.quantity ?? 1),
    rationale: 'Fallback: holding current offer due to invalid or failed LLM response',
  };
}