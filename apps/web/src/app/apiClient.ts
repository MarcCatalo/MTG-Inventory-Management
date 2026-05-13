import type { CreateInventoryLotInput, InventoryLot } from "@mtg-inventory/shared";

export interface CardPrint {
  id: string;
  oracleId: string | null;
  tcgplayerId: number | null;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  rarity: string;
  colorIdentity: string[];
  imageUris: Record<string, string> | null;
  prices: {
    usd: string | null;
    usd_foil: string | null;
    usd_etched: string | null;
  };
  finishes: string[];
  releasedAt: string | null;
}

export async function searchCardNames(query: string): Promise<string[]> {
  const response = await fetch(`/api/cards/search?q=${encodeURIComponent(query)}`);
  assertOk(response);
  const body = (await response.json()) as { names: string[] };
  return body.names;
}

export async function fetchCardPrints(name: string): Promise<CardPrint[]> {
  const response = await fetch(`/api/cards/prints?name=${encodeURIComponent(name)}`);
  assertOk(response);
  const body = (await response.json()) as { cards: CardPrint[] };
  return body.cards;
}

export async function fetchInventoryLots(): Promise<InventoryLot[]> {
  const response = await fetch("/api/inventory");
  assertOk(response);
  const body = (await response.json()) as { lots: InventoryLot[] };
  return body.lots;
}

export async function createInventoryLot(
  input: CreateInventoryLotInput,
): Promise<InventoryLot> {
  const response = await fetch("/api/inventory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  assertOk(response);
  const body = (await response.json()) as { lot: InventoryLot };
  return body.lot;
}

function assertOk(response: Response): void {
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
}
