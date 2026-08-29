export interface CatalogItemPolicy {
  floor_price: number;
  base_price: number;
  inventory_qty: number;
  daily_discount_budget: number;
  discount_used_today: number;
}

export interface MerchantMoveInput {
  type: 'accept' | 'counter' | 'bundle' | 'reject';
  unit_price: number | null;
  quantity: number;
}

export type PolicyResult =
  | { result: 'pass' }
  | { result: 'blocked'; reason: string }
  | { result: 'adjusted'; adjustedPrice: number; reason: string };

export function checkPolicy(
  move: MerchantMoveInput,
  policy: CatalogItemPolicy
): PolicyResult {
  if (move.quantity > policy.inventory_qty) {
    return { result: 'blocked', reason: `Requested quantity ${move.quantity} exceeds available inventory ${policy.inventory_qty}` };
  }

  if (move.unit_price === null) {
    return { result: 'pass' };
  }

  if (move.unit_price < policy.floor_price) {
    const discountUsed = (policy.base_price - move.unit_price) * move.quantity;
    const remainingBudget = policy.daily_discount_budget - policy.discount_used_today;

    if (discountUsed <= remainingBudget && policy.floor_price <= policy.base_price) {
      // Even within budget, floor is a hard line — never crossed regardless of budget
      return {
        result: 'adjusted',
        adjustedPrice: policy.floor_price,
        reason: `Proposed price ${move.unit_price} below floor ${policy.floor_price} — clamped to floor`,
      };
    }
    return {
      result: 'adjusted',
      adjustedPrice: policy.floor_price,
      reason: `Proposed price ${move.unit_price} below floor ${policy.floor_price} — clamped to floor`,
    };
  }

  const discountUsed = (policy.base_price - move.unit_price) * move.quantity;
  const remainingBudget = policy.daily_discount_budget - policy.discount_used_today;
  if (discountUsed > remainingBudget) {
    const maxAffordablePrice = policy.base_price - (remainingBudget / move.quantity);
    const clampedPrice = Math.max(maxAffordablePrice, policy.floor_price);
    return {
      result: 'adjusted',
      adjustedPrice: clampedPrice,
      reason: `Discount would exceed remaining daily budget (${remainingBudget}) — clamped to ${clampedPrice}`,
    };
  }

  return { result: 'pass' };
}