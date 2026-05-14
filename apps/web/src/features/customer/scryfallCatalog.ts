import type { CustomerCatalogItem, SortOption } from "./catalog";

const SCRYFALL_SEARCH_URL = "https://api.scryfall.com/cards/search";
const PHP_MULTIPLIER = 57;
const PAGE_SIZE = 20;

type ScryfallCard = {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  finishes?: string[];
  rarity: string;
  colors?: string[];
  color_identity?: string[];
  type_line: string;
  cmc: number;
  prices: {
    usd?: string | null;
    usd_foil?: string | null;
    usd_etched?: string | null;
  };
  image_uris?: {
    normal?: string;
  };
  card_faces?: Array<{
    image_uris?: {
      normal?: string;
    };
  }>;
  released_at?: string;
};

type ScryfallSearchResponse = {
  total_cards?: number;
  has_more?: boolean;
  data: ScryfallCard[];
};

type FetchCatalogOptions = {
  page: number;
  q?: string;
  sortOption?: SortOption;
  signal?: AbortSignal;
  fetcher?: typeof fetch;
};

type ScryfallCatalogPage = {
  items: CustomerCatalogItem[];
  total: number;
  hasMore: boolean;
};

export async function fetchScryfallCatalogPage({
  page,
  q,
  sortOption = "dateAdded-desc",
  signal,
  fetcher = fetch
}: FetchCatalogOptions): Promise<ScryfallCatalogPage> {
  const response = await fetcher(buildSearchUrl(page, q, sortOption), {
    headers: {
      Accept: "application/json;q=0.9,*/*;q=0.8"
    },
    signal
  });

  if (!response.ok) {
    throw new Error("Scryfall catalog request failed");
  }

  const payload = (await response.json()) as ScryfallSearchResponse;

  return {
    items: payload.data.slice(0, PAGE_SIZE).map(toCustomerCatalogItem),
    total: payload.total_cards ?? payload.data.length,
    hasMore: Boolean(payload.has_more)
  };
}

function buildSearchUrl(page: number, q: string | undefined, sortOption: SortOption): string {
  const url = new URL(SCRYFALL_SEARCH_URL);
  const searchText = q?.trim() ? `${q.trim()} game:paper unique:prints` : "game:paper unique:prints";

  url.searchParams.set("q", searchText);
  url.searchParams.set("order", toScryfallOrder(sortOption));
  url.searchParams.set("page", String(Math.max(1, page)));
  url.searchParams.set("unique", "prints");

  return url.toString();
}

function toScryfallOrder(sortOption: SortOption): string {
  if (sortOption.startsWith("name")) {
    return "name";
  }

  if (sortOption.startsWith("price")) {
    return "usd";
  }

  if (sortOption.startsWith("manaValue")) {
    return "cmc";
  }

  return "released";
}

function toCustomerCatalogItem(card: ScryfallCard, index: number): CustomerCatalogItem {
  const printing = card.finishes?.includes("nonfoil") ? "nonfoil" : card.finishes?.includes("foil") ? "foil" : "nonfoil";
  const usd = Number(card.prices.usd ?? card.prices.usd_foil ?? card.prices.usd_etched ?? 0);

  return {
    id: `${card.id}-${printing}-nm`,
    name: card.name,
    setCode: card.set.toUpperCase(),
    setName: card.set_name,
    collectorNumber: card.collector_number,
    printing,
    condition: "NM",
    rarity: card.rarity,
    colors: card.colors ?? card.color_identity ?? [],
    cardType: card.type_line,
    manaValue: card.cmc,
    pricePhp: Math.round(usd * PHP_MULTIPLIER),
    // Scryfall has card data, not store inventory. Replace this when the inventory API is wired.
    stock: index % 4 === 0 ? 0 : (index % 6) + 1,
    imageUrl: card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? "",
    dateAdded: card.released_at ?? new Date().toISOString().slice(0, 10)
  };
}
