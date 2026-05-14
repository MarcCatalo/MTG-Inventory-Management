import { describe, expect, it } from "vitest";
import type { CreateInventoryLotInput } from "@mtg-inventory/shared";
import { createTestDatabase } from "../db/connection";
import { runMigrations } from "../db/migrations";
import { InventoryRepository } from "../repositories/inventoryRepository";
import { PriceHistoryRepository } from "../repositories/priceHistoryRepository";
import { InventoryService } from "../services/inventoryService";
import { PricingService, type CardPriceProvider } from "../services/pricingService";

const baseLotInput: CreateInventoryLotInput = {
  scryfallId: "scryfall-lightning-bolt-m20-154",
  oracleId: "oracle-lightning-bolt",
  tcgplayerId: 12345,
  cardName: "Lightning Bolt",
  setCode: "m20",
  setName: "Core Set 2020",
  collectorNumber: "154",
  rarity: "common",
  colorIdentity: ["R"],
  imageUris: {
    small: "https://cards.scryfall.io/small/front/example.jpg",
    normal: "https://cards.scryfall.io/normal/front/example.jpg",
  },
  condition: "NM",
  foilType: "nonfoil",
  language: "en",
  qty: 4,
  buyPricePhpPerCopy: 120,
  purchaseDate: "2026-05-13",
  multiplier: 57,
  notes: "first lot",
};

function createServices(provider: CardPriceProvider) {
  const db = createTestDatabase();
  runMigrations(db);
  const inventoryRepository = new InventoryRepository(db);
  const priceHistoryRepository = new PriceHistoryRepository(db);
  const pricingService = new PricingService(
    inventoryRepository,
    priceHistoryRepository,
    provider,
  );
  const inventoryService = new InventoryService(
    inventoryRepository,
    pricingService,
  );

  return {
    inventoryService,
    priceHistoryRepository,
  };
}

describe("inventory lots and price snapshots", () => {
  it("creates separate acquisition lots with PHP buy price per copy", () => {
    const { inventoryService } = createServices(new MissingPriceProvider());

    const first = inventoryService.createLot(baseLotInput);
    const second = inventoryService.createLot({
      ...baseLotInput,
      buyPricePhpPerCopy: 150,
      purchaseDate: "2026-05-20",
      notes: "second lot",
    });

    expect(first.id).not.toBe(second.id);
    expect(first.buyPricePhpPerCopy).toBe(120);
    expect(second.buyPricePhpPerCopy).toBe(150);
    expect(inventoryService.listLots({ includeSoldOut: true })).toHaveLength(2);
  });

  it("stores missing Scryfall price snapshots without treating missing price as zero", async () => {
    const { inventoryService, priceHistoryRepository } = createServices(
      new MissingPriceProvider(),
    );
    const lot = inventoryService.createLot(baseLotInput);

    const refreshed = await inventoryService.refreshLotPrice(lot.id);
    const history = priceHistoryRepository.listForLot(lot.id);

    expect(refreshed.marketPriceUsd).toBeNull();
    expect(refreshed.suggestedPricePhp).toBeNull();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      inventoryLotId: lot.id,
      provider: "scryfall",
      status: "missing_price",
      marketPriceUsd: null,
      suggestedPricePhpRounded: null,
    });
  });

  it("refreshes price history with raw and rounded PHP values", async () => {
    const { inventoryService, priceHistoryRepository } = createServices(
      new FixedPriceProvider(6.25),
    );
    const lot = inventoryService.createLot(baseLotInput);

    const refreshed = await inventoryService.refreshLotPrice(lot.id);
    const history = priceHistoryRepository.listForLot(lot.id);

    expect(refreshed.marketPriceUsd).toBe(6.25);
    expect(refreshed.suggestedPricePhp).toBe(360);
    expect(history[0]).toMatchObject({
      inventoryLotId: lot.id,
      provider: "scryfall",
      status: "success",
      marketPriceUsd: 6.25,
      multiplierUsed: 57,
      suggestedPricePhpRaw: 356.25,
      suggestedPricePhpRounded: 360,
    });
  });
});

class FixedPriceProvider implements CardPriceProvider {
  readonly provider = "scryfall";
  readonly providerLabel = "Scryfall / TCGPlayer listed median";
  readonly priceMetric = "tcgplayer_listed_median";

  constructor(private readonly marketPriceUsd: number) {}

  async getMarketPriceUsd() {
    return { marketPriceUsd: this.marketPriceUsd };
  }
}

class MissingPriceProvider implements CardPriceProvider {
  readonly provider = "scryfall";
  readonly providerLabel = "Scryfall / TCGPlayer listed median";
  readonly priceMetric = "tcgplayer_listed_median";

  async getMarketPriceUsd() {
    return {
      marketPriceUsd: null,
      errorMessage: "No Scryfall price for selected foil type",
    };
  }
}
