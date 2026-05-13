export interface SuggestedPricePhp {
  raw: number;
  rounded: number;
}

export function roundPhpToNearestTen(value: number): number {
  return Math.round(value / 10) * 10;
}

export function calculateSuggestedPricePhp(
  marketPriceUsd: number,
  multiplier: number,
): SuggestedPricePhp {
  const raw = Number((marketPriceUsd * multiplier).toFixed(2));
  return {
    raw,
    rounded: roundPhpToNearestTen(raw),
  };
}

export function calculateRealizedPnlPhp(
  actualSellPricePhpPerCopy: number,
  buyPricePhpPerCopy: number,
  qtySold: number,
): number {
  return Number(
    ((actualSellPricePhpPerCopy - buyPricePhpPerCopy) * qtySold).toFixed(2),
  );
}

export function calculateUnrealizedPnlPhp(
  suggestedPricePhpPerCopy: number,
  buyPricePhpPerCopy: number,
  qtyOwned: number,
): number {
  return Number(
    ((suggestedPricePhpPerCopy - buyPricePhpPerCopy) * qtyOwned).toFixed(2),
  );
}

export function isPriceStale(
  priceLastUpdatedIso: string | null | undefined,
  refreshHours: number,
  now: Date = new Date(),
): boolean {
  if (!priceLastUpdatedIso) {
    return true;
  }

  const updatedAt = new Date(priceLastUpdatedIso);
  if (Number.isNaN(updatedAt.getTime())) {
    return true;
  }

  const ageMs = now.getTime() - updatedAt.getTime();
  return ageMs >= refreshHours * 60 * 60 * 1000;
}
