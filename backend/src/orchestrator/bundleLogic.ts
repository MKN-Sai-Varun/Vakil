export interface BundleTerms {
  unit_price: number;
  quantity: number;
}

/**
 * Deterministically computes a volume-discount bundle offer.
 * Given the buyer's requested quantity, offers 20-50% more units at a
 * discounted rate (5-15% below list price, never below floor).
 */
export function computeBundleOffer(
  requestedQuantity: number,
  basePrice: number,
  floorPrice: number
): BundleTerms {
  const bundleQuantity = Math.ceil(requestedQuantity * 1.3); // 30% more units
  const discountPct = 0.10; // 10% off list price
  let unitPrice = Math.round(basePrice * (1 - discountPct));
  unitPrice = Math.max(unitPrice, floorPrice); // never below floor

  return {
    unit_price: unitPrice,
    quantity: bundleQuantity,
  };
}