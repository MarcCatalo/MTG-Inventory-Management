export type Printing = "nonfoil" | "foil" | "etched";
export type StockFilter = "in-stock" | "out-of-stock" | "all";
export type SortKey = "price" | "name" | "manaValue" | "dateAdded";
export type SortDirection = "asc" | "desc";
export type SortOption =
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "manaValue-asc"
  | "manaValue-desc"
  | "dateAdded-desc"
  | "dateAdded-asc";

export type CustomerCatalogItem = {
  id: string;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  printing: Printing;
  condition: string;
  rarity: string;
  colors: string[];
  cardType: string;
  manaValue: number;
  pricePhp: number;
  stock: number;
  imageUrl: string;
  dateAdded: string;
};

// Mirrors the future GET /api/customer/catalog query contract.
export type CustomerCatalogQuery = {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  printing?: Printing | "all";
  rarity?: string;
  cardType?: string;
  color?: string;
  condition?: string;
  set?: string;
  stock?: StockFilter;
  sort?: SortKey;
  direction?: SortDirection;
  sortOption?: SortOption;
  page?: number;
  pageSize?: number;
};

export type CustomerCatalogResult = {
  items: CustomerCatalogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function normalizeSearch(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function filterCatalog(
  cards: CustomerCatalogItem[],
  query: CustomerCatalogQuery = {}
): CustomerCatalogResult {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, Math.min(query.pageSize ?? 24, 60));
  const normalizedSearch = normalizeSearch(query.q);
  const stock = query.stock ?? "in-stock";
  const { sort, direction } = parseSortOption(query.sortOption, query.sort, query.direction);

  const filtered = cards.filter((card) => {
    if (normalizedSearch && !searchableText(card).includes(normalizedSearch)) {
      return false;
    }

    if (query.minPrice !== undefined && card.pricePhp < query.minPrice) {
      return false;
    }

    if (query.maxPrice !== undefined && card.pricePhp > query.maxPrice) {
      return false;
    }

    if (query.printing && query.printing !== "all" && card.printing !== query.printing) {
      return false;
    }

    if (query.rarity && !sameText(card.rarity, query.rarity)) {
      return false;
    }

    if (query.cardType && !normalizeSearch(card.cardType).includes(normalizeSearch(query.cardType))) {
      return false;
    }

    if (query.color && !matchesColor(card, query.color)) {
      return false;
    }

    if (query.condition && !sameText(card.condition, query.condition)) {
      return false;
    }

    if (query.set && !matchesSet(card, query.set)) {
      return false;
    }

    if (stock === "in-stock" && card.stock <= 0) {
      return false;
    }

    if (stock === "out-of-stock" && card.stock > 0) {
      return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => compareCards(a, b, sort, direction));
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (Math.min(page, totalPages) - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    total,
    page: Math.min(page, totalPages),
    pageSize,
    totalPages
  };
}

export function parseSortOption(
  sortOption: SortOption | undefined,
  fallbackSort: SortKey = "name",
  fallbackDirection: SortDirection = "asc"
): { sort: SortKey; direction: SortDirection } {
  if (!sortOption) {
    return { sort: fallbackSort, direction: fallbackDirection };
  }

  const [sort, direction] = sortOption.split("-") as [SortKey, SortDirection];
  return { sort, direction };
}

export function getCatalogSuggestions(
  cards: CustomerCatalogItem[],
  input: string,
  limit = 6
): string[] {
  const query = normalizeSearch(input);

  if (!query) {
    return [];
  }

  const names = cards
    .filter((card) => normalizeSearch(card.name).includes(query))
    .map((card) => card.name);

  return [...new Set(names)].slice(0, limit);
}

function searchableText(card: CustomerCatalogItem): string {
  return normalizeSearch(
    [
      card.name,
      card.setCode,
      card.setName,
      card.collectorNumber,
      card.printing,
      card.condition,
      card.rarity,
      card.cardType,
      card.colors.join(" ")
    ].join(" ")
  );
}

function sameText(left: string, right: string): boolean {
  return normalizeSearch(left) === normalizeSearch(right);
}

function matchesSet(card: CustomerCatalogItem, set: string): boolean {
  const query = normalizeSearch(set);
  return normalizeSearch(card.setCode) === query || normalizeSearch(card.setName).includes(query);
}

function matchesColor(card: CustomerCatalogItem, color: string): boolean {
  const normalized = normalizeSearch(color);

  if (normalized === "colorless") {
    return card.colors.length === 0;
  }

  if (normalized === "multicolor") {
    return card.colors.length > 1;
  }

  return card.colors.map((cardColor) => normalizeSearch(cardColor)).includes(normalized);
}

function compareCards(
  a: CustomerCatalogItem,
  b: CustomerCatalogItem,
  sort: SortKey,
  direction: SortDirection
): number {
  const multiplier = direction === "asc" ? 1 : -1;

  if (sort === "price") {
    return (a.pricePhp - b.pricePhp) * multiplier;
  }

  if (sort === "manaValue") {
    return (a.manaValue - b.manaValue) * multiplier;
  }

  if (sort === "dateAdded") {
    return (new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()) * multiplier;
  }

  return a.name.localeCompare(b.name) * multiplier;
}
