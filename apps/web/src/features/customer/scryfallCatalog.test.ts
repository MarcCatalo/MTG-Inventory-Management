import { describe, expect, it, vi } from "vitest";
import { fetchScryfallCatalogPage } from "./scryfallCatalog";

describe("fetchScryfallCatalogPage", () => {
  it("maps the first 20 Scryfall cards into customer catalog items with API images", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        total_cards: 40,
        has_more: true,
        data: Array.from({ length: 25 }, (_, index) => ({
          id: `card-${index}`,
          name: `Card ${index}`,
          set: "one",
          set_name: "Phyrexia: All Will Be One",
          collector_number: `${index}`,
          finishes: index % 2 === 0 ? ["nonfoil", "foil"] : ["nonfoil"],
          rarity: index % 3 === 0 ? "rare" : "common",
          colors: index % 2 === 0 ? ["R"] : [],
          type_line: "Creature",
          cmc: index,
          prices: { usd: "1.50", usd_foil: "2.00", usd_etched: null },
          image_uris: { normal: `https://img.example/card-${index}.jpg` },
          released_at: "2026-05-01"
        }))
      })
    });

    const result = await fetchScryfallCatalogPage({ page: 2, fetcher: fetchMock });

    expect(result.items).toHaveLength(20);
    expect(result.total).toBe(40);
    expect(result.items[0]).toMatchObject({
      id: "card-0-nonfoil-nm",
      imageUrl: "https://img.example/card-0.jpg",
      pricePhp: 86,
      stock: 0
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("page=2"), expect.any(Object));
  });
});
