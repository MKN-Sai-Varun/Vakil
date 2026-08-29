export interface MandatePolicy {
  max_total_spend: number;
  spend_used: number;
  max_unit_price: number;
  category_allowlist: string[];
  expires_at: string;
}

export interface BuyerMoveInput {
  type: 'accept' | 'counter' | 'reduce_quantity' | 'walk_away';
  unit_price: number | null;
  quantity: number;
  total: number;
  category?: string;
}

export type MandateResult =
  | { result: 'pass' }
  | { result: 'blocked'; reason: string }
  | { result: 'adjusted'; adjustedQuantity: number; reason: string };

export function checkMandate(
  move: BuyerMoveInput,
  mandate: MandatePolicy
): MandateResult {
  if (new Date(mandate.expires_at) < new Date()) {
    return { result: 'blocked', reason: 'Mandate has expired' };
  }

  if (move.category && !mandate.category_allowlist.includes(move.category)) {
    return { result: 'blocked', reason: `Category "${move.category}" not in allow-list` };
  }

  if (move.unit_price !== null && move.unit_price > mandate.max_unit_price) {
    return { result: 'blocked', reason: `Unit price ${move.unit_price} exceeds mandate cap ${mandate.max_unit_price}` };
  }

  const remainingSpend = mandate.max_total_spend - mandate.spend_used;
  if (move.total > remainingSpend) {
    if (move.unit_price && move.unit_price > 0) {
      const maxAffordableQty = Math.floor(remainingSpend / move.unit_price);
      if (maxAffordableQty > 0) {
        return {
          result: 'adjusted',
          adjustedQuantity: maxAffordableQty,
          reason: `Total ${move.total} exceeds remaining mandate ${remainingSpend} — reduced quantity to ${maxAffordableQty}`,
        };
      }
    }
    return { result: 'blocked', reason: `Deal total ${move.total} exceeds remaining mandate ${remainingSpend}, and quantity cannot be reduced further` };
  }

  return { result: 'pass' };
}