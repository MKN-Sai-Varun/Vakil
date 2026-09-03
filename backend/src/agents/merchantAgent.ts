import { groq, GROQ_MODEL } from './groqClient';
import { MerchantMoveSchema, MerchantMove } from './schema';
import { merchantSystemPrompt } from './prompts';

interface MerchantContext {
  floorPrice: number;
  basePrice: number;
  turnHistory: string;
  currentOffer: { unit_price: number; quantity: number } | null;
  canOfferBundle: boolean;
}

export async function proposeMerchantMove(ctx: MerchantContext): Promise<MerchantMove> {
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: merchantSystemPrompt({ floor_price: ctx.floorPrice, base_price: ctx.basePrice, canOfferBundle: ctx.canOfferBundle }) },
        { role: 'user', content: `Turn history:\n${ctx.turnHistory}\n\nBuyer's current offer: ${JSON.stringify(ctx.currentOffer)}\n\nWhat is your move?` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const parsed = MerchantMoveSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      console.error('[merchantAgent] Schema validation failed. Raw response:', raw, 'Errors:', parsed.error);
      return fallbackMerchantMove(ctx);
    }
    return parsed.data;
  } catch (err) {
    console.error('[merchantAgent] Groq call failed:', err);
    return fallbackMerchantMove(ctx);
  }
}

function fallbackMerchantMove(ctx: MerchantContext): MerchantMove & { _fallback: true } {
  // Never echo an offer that violates our own floor - clamp to our actual floor
  const quantity = ctx.currentOffer?.quantity ?? 1;
  const safeUnitPrice = Math.max(
    ctx.currentOffer?.unit_price ?? ctx.basePrice,
    ctx.floorPrice
  );

  return {
    type: 'counter',
    unit_price: safeUnitPrice,
    bundle_items: null,
    quantity,
    rationale: 'Holding at our current position while we review the terms.',
    _fallback: true,
  };
}