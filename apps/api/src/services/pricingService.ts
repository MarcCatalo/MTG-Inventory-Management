import {
  calculateSuggestedPricePhp,
  type FoilType,
  type InventoryLot,
  type PriceProvider,
} from "@mtg-inventory/shared";
import type { InventoryRepository } from "../repositories/inventoryRepository";
import type { PriceHistoryRepository } from "../repositories/priceHistoryRepository";

export interface MarketPriceResult {
  marketPriceUsd: number | null;
  errorMessage?: string;
}

export interface CardPriceProvider {
  readonly provider: PriceProvider;
  readonly providerLabel: string;
  readonly priceMetric: string;
  getMarketPriceUsd(input: {
    scryfallId: string;
    foilType: FoilType;
  }): Promise<MarketPriceResult>;
}

export class PricingService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly priceHistoryRepository: PriceHistoryRepository,
    private readonly priceProvider: CardPriceProvider,
  ) {}

  async refreshLotPrice(lot: InventoryLot): Promise<InventoryLot> {
    const fetchedAt = new Date().toISOString();

    try {
      const result = await this.priceProvider.getMarketPriceUsd({
        scryfallId: lot.scryfallId,
        foilType: lot.foilType,
      });

      if (result.marketPriceUsd === null) {
        this.priceHistoryRepository.create({
          inventoryLotId: lot.id,
          provider: this.priceProvider.provider,
          providerLabel: this.priceProvider.providerLabel,
          priceMetric: this.priceProvider.priceMetric,
          marketPriceUsd: null,
          multiplierUsed: lot.multiplier,
          suggestedPricePhpRaw: null,
          suggestedPricePhpRounded: null,
          foilType: lot.foilType,
          fetchedAt,
          status: "missing_price",
          errorMessage: result.errorMessage ?? "No price available",
        });

        return this.inventoryRepository.updatePricing({
          id: lot.id,
          marketPriceUsd: null,
          suggestedPricePhp: null,
          priceLastUpdated: fetchedAt,
        });
      }

      const suggested = calculateSuggestedPricePhp(
        result.marketPriceUsd,
        lot.multiplier,
      );

      this.priceHistoryRepository.create({
        inventoryLotId: lot.id,
        provider: this.priceProvider.provider,
        providerLabel: this.priceProvider.providerLabel,
        priceMetric: this.priceProvider.priceMetric,
        marketPriceUsd: result.marketPriceUsd,
        multiplierUsed: lot.multiplier,
        suggestedPricePhpRaw: suggested.raw,
        suggestedPricePhpRounded: suggested.rounded,
        foilType: lot.foilType,
        fetchedAt,
        status: "success",
        errorMessage: null,
      });

      return this.inventoryRepository.updatePricing({
        id: lot.id,
        marketPriceUsd: result.marketPriceUsd,
        suggestedPricePhp: suggested.rounded,
        priceLastUpdated: fetchedAt,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown pricing provider error";

      this.priceHistoryRepository.create({
        inventoryLotId: lot.id,
        provider: this.priceProvider.provider,
        providerLabel: this.priceProvider.providerLabel,
        priceMetric: this.priceProvider.priceMetric,
        marketPriceUsd: null,
        multiplierUsed: lot.multiplier,
        suggestedPricePhpRaw: null,
        suggestedPricePhpRounded: null,
        foilType: lot.foilType,
        fetchedAt,
        status: "failed",
        errorMessage: message,
      });

      return this.inventoryRepository.updatePricing({
        id: lot.id,
        marketPriceUsd: null,
        suggestedPricePhp: null,
        priceLastUpdated: fetchedAt,
      });
    }
  }
}
