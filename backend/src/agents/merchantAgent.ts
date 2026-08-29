import { groq, GROQ_MODEL } from './groqClient';
import { MerchantMoveSchema, MerchantMove } from './schema';
import { merchantSystemPrompt } from './prompts';

interface MerchantContext {
  floorPrice: number;
  basePrice: number;
  turnHistory: string;
  currentOffer: { unit_price: number; quantity: number } | null;
}

export async function proposeMerchantMove(ctx: MerchantContext): Promise<MerchantMove> {
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: merchantSystemPrompt({ floor_price: ctx.floorPrice, base_price: ctx.basePrice }) },
        { role: 'user', content: `Turn history:\n${ctx.turnHistory}\n\nBuyer's current offer: ${JSON.stringify(ctx.currentOffer)}\n\nWhat is your move?` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const parsed = MerchantMoveSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      return fallbackMerchantMove(ctx);
    }
    return parsed.data;
  } catch (err) {
    return fallbackMerchantMove(ctx);
  }
}

function fallbackMerchantMove(ctx: MerchantContext): MerchantMove {
  return {
    type: 'counter',
    unit_price: ctx.currentOffer?.unit_price ?? ctx.basePrice,
    bundle_items: null,
    quantity: ctx.currentOffer?.quantity ?? 1,
    rationale: 'Fallback: holding current offer due to invalid or failed LLM response',
  };
}