import type {
  CreateInventoryLotInput,
  CreateSaleInput,
  InventoryLot,
  Settings,
} from "@mtg-inventory/shared";

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

export async function updateInventoryLot(
  id: number,
  input: Partial<InventoryLot>,
): Promise<InventoryLot> {
  const response = await fetch(`/api/inventory/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  assertOk(response);
  const body = (await response.json()) as { lot: InventoryLot };
  return body.lot;
}

export async function deleteInventoryLot(id: number): Promise<void> {
  const response = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
  assertOk(response);
}

export async function refreshInventoryPrices(ids?: number[]): Promise<InventoryLot[]> {
  const response = await fetch("/api/prices/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ids ? { inventoryLotIds: ids } : {}),
  });
  assertOk(response);
  const body = (await response.json()) as { lots: InventoryLot[] };
  return body.lots;
}

export async function createSale(input: CreateSaleInput): Promise<void> {
  const response = await fetch("/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  assertOk(response);
}

export async function fetchSettings(): Promise<Settings> {
  const response = await fetch("/api/settings");
  assertOk(response);
  return (await response.json()) as Settings;
}

export async function updateSettings(input: Partial<Settings>): Promise<Settings> {
  const response = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  assertOk(response);
  return (await response.json()) as Settings;
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
