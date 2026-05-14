import type { FoilType } from "@mtg-inventory/shared";
import type { CardPriceProvider, MarketPriceResult } from "../services/pricingService";

const SCRYFALL_BASE_URL = "https://api.scryfall.com";
const USER_AGENT =
  "MTGInventoryManager/0.1 (local browser app; contact: local-user)";

export interface ScryfallCardSummary {
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

interface ScryfallCardApiResponse {
  id: string;
  oracle_id?: string;
  tcgplayer_id?: number;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  color_identity?: string[];
  image_uris?: Record<string, string>;
  card_faces?: Array<{ image_uris?: Record<string, string> }>;
  prices: {
    usd: string | null;
    usd_foil: string | null;
    usd_etched: string | null;
  };
  finishes?: string[];
  released_at?: string;
}

interface ScryfallListApiResponse<T> {
  data: T[];
}

export class ScryfallClient implements CardPriceProvider {
  readonly provider = "scryfall" as const;
  readonly providerLabel = "Scryfall / TCGPlayer listed median";
  readonly priceMetric = "tcgplayer_listed_median";

  async searchNames(query: string): Promise<string[]> {
    if (query.trim().length < 2) {
      return [];
    }

    const params = new URLSearchParams({ q: query });
    const response = await this.request<{ data: string[] }>(
      `/cards/autocomplete?${params.toString()}`,
    );
    return response.data;
  }

  async searchPrints(name: string): Promise<ScryfallCardSummary[]> {
    const params = new URLSearchParams({
      q: `!"${name}"`,
      unique: "prints",
      order: "released",
    });
    const response = await this.request<
      ScryfallListApiResponse<ScryfallCardApiResponse>
    >(`/cards/search?${params.toString()}`);
    return response.data.map(mapScryfallCard);
  }

  async getCardById(scryfallId: string): Promise<ScryfallCardSummary> {
    return mapScryfallCard(
      await this.request<ScryfallCardApiResponse>(`/cards/${scryfallId}`),
    );
  }

  async getMarketPriceUsd(input: {
    scryfallId: string;
    foilType: FoilType;
  }): Promise<MarketPriceResult> {
    const card = await this.getCardById(input.scryfallId);
    const value = getPriceForFoilType(card, input.foilType);

    if (value === null) {
      return {
        marketPriceUsd: null,
        errorMessage: `No ${input.foilType} listed median USD price available`,
      };
    }

    return { marketPriceUsd: value };
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${SCRYFALL_BASE_URL}${path}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Scryfall request failed with ${response.status}`);
    }

    return (await response.json()) as T;
  }
}

export function getPriceForFoilType(
  card: ScryfallCardSummary,
  foilType: FoilType,
): number | null {
  const price =
    foilType === "foil"
      ? card.prices.usd_foil
      : foilType === "etched"
        ? card.prices.usd_etched
        : card.prices.usd;

  if (price === null) {
    return null;
  }

  const numeric = Number(price);
  return Number.isFinite(numeric) ? numeric : null;
}

function mapScryfallCard(card: ScryfallCardApiResponse): ScryfallCardSummary {
  return {
    id: card.id,
    oracleId: card.oracle_id ?? null,
    tcgplayerId: card.tcgplayer_id ?? null,
    name: card.name,
    setCode: card.set,
    setName: card.set_name,
    collectorNumber: card.collector_number,
    rarity: card.rarity,
    colorIdentity: card.color_identity ?? [],
    imageUris: card.image_uris ?? card.card_faces?.[0]?.image_uris ?? null,
    prices: card.prices,
    finishes: card.finishes ?? [],
    releasedAt: card.released_at ?? null,
  };
}
