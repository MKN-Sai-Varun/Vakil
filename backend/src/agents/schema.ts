import { z } from 'zod';

export const BuyerMoveSchema = z.object({
  type: z.enum(['accept', 'counter', 'reduce_quantity', 'walk_away']),
  unit_price: z.number().positive().nullable(),
  quantity: z.number().int().min(0),
  total: z.number().min(0),
  rationale: z.string().min(1),
});
export type BuyerMove = z.infer<typeof BuyerMoveSchema>;

export const MerchantMoveSchema = z.object({
  type: z.enum(['accept', 'counter', 'bundle', 'reject']),
  unit_price: z.number().positive().nullable(),
  bundle_items: z.array(z.object({
    item_id: z.string(),
    quantity: z.number().int().positive(),
  })).nullable(),
  quantity: z.number().int().min(0),
  rationale: z.string().min(1),
});
export type MerchantMove = z.infer<typeof MerchantMoveSchema>;