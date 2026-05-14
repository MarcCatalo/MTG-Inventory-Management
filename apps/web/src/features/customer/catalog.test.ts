import { describe, expect, it } from "vitest";
import {
  filterCatalog,
  getCatalogSuggestions,
  type CustomerCatalogItem
} from "./catalog";

const cards: CustomerCatalogItem[] = [
  {
    id: "bolt-2xm-nm-nonfoil",
    name: "Lightning Bolt",
    setCode: "2XM",
    setName: "Double Masters",
    collectorNumber: "129",
    printing: "nonfoil",
    condition: "NM",
    rarity: "uncommon",
    colors: ["R"],
    cardType: "Instant",
    manaValue: 1,
    pricePhp: 120,
    stock: 4,
    imageUrl: "https://cards.scryfall.io/normal/front/bolt.jpg",
    dateAdded: "2026-05-10"
  },
  {
    id: "bolt-clu-lp-foil",
    name: "Lightning Bolt",
    setCode: "CLU",
    setName: "Ravnica Clue Edition",
    collectorNumber: "141",
    printing: "foil",
    condition: "LP",
    rarity: "rare",
    colors: ["R"],
    cardType: "Instant",
    manaValue: 1,
    pricePhp: 260,
    stock: 1,
    imageUrl: "https://cards.scryfall.io/normal/front/bolt-foil.jpg",
    dateAdded: "2026-05-12"
  },
  {
    id: "sol-ring-ltc-nm-nonfoil",
    name: "Sol Ring",
    setCode: "LTC",
    setName: "The Lord of the Rings Commander",
    collectorNumber: "284",
    printing: "nonfoil",
    condition: "NM",
    rarity: "uncommon",
    colors: [],
    cardType: "Artifact",
    manaValue: 1,
    pricePhp: 80,
    stock: 0,
    imageUrl: "https://cards.scryfall.io/normal/front/sol-ring.jpg",
    dateAdded: "2026-05-08"
  },
  {
    id: "atraxa-one-mp-nonfoil",
    name: "Atraxa, Grand Unifier",
    setCode: "ONE",
    setName: "Phyrexia: All Will Be One",
    collectorNumber: "196",
    printing: "nonfoil",
    condition: "MP",
    rarity: "mythic",
    colors: ["W", "U", "B", "G"],
    cardType: "Legendary Creature",
    manaValue: 7,
    pricePhp: 910,
    stock: 2,
    imageUrl: "https://cards.scryfall.io/normal/front/atraxa.jpg",
    dateAdded: "2026-05-14"
  }
];

describe("filterCatalog", () => {
  it("normalizes capitalization and extra spaces in search", () => {
    const result = filterCatalog(cards, { q: "  LIGHTNING    bolt  " });

    expect(result.items.map((card) => card.id)).toEqual([
      "bolt-2xm-nm-nonfoil",
      "bolt-clu-lp-foil"
    ]);
  });

  it("combines price, printing, rarity, type, color, condition, set, and stock filters", () => {
    const result = filterCatalog(cards, {
      q: "bolt",
      minPrice: 100,
      maxPrice: 200,
      printing: "nonfoil",
      rarity: "uncommon",
      cardType: "instant",
      color: "R",
      condition: "NM",
      set: "2XM",
      stock: "in-stock"
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("bolt-2xm-nm-nonfoil");
  });

  it("sorts by price descending and paginates stable results", () => {
    const result = filterCatalog(cards, {
      sortOption: "price-desc",
      stock: "all",
      page: 1,
      pageSize: 2
    });

    expect(result.items.map((card) => card.id)).toEqual([
      "atraxa-one-mp-nonfoil",
      "bolt-clu-lp-foil"
    ]);
    expect(result.total).toBe(4);
    expect(result.totalPages).toBe(2);
  });
});

describe("getCatalogSuggestions", () => {
  it("returns unique matching card names while typing", () => {
    expect(getCatalogSuggestions(cards, "light")).toEqual(["Lightning Bolt"]);
  });
});
