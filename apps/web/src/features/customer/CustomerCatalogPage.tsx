import { Grid2X2, List, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  filterCatalog,
  getCatalogSuggestions,
  type CustomerCatalogItem,
  type CustomerCatalogQuery,
  type Printing,
  type SortOption
} from "./catalog";
import type { CartItem } from "./cart";
import { fetchScryfallCatalogPage } from "./scryfallCatalog";

type CustomerCatalogPageProps = {
  cards: CustomerCatalogItem[];
  onCatalogLoaded: (cards: CustomerCatalogItem[]) => void;
  onAddToCart: (item: Omit<CartItem, "quantity">) => void;
  onViewDetails: (listingId: string) => void;
};

const defaultQuery: CustomerCatalogQuery = {
  stock: "all",
  sortOption: "dateAdded-desc",
  page: 1,
  pageSize: 20
};

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "dateAdded-desc", label: "Latest stocked" },
  { value: "dateAdded-asc", label: "Oldest stocked" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "manaValue-desc", label: "Mana cost: high to low" },
  { value: "manaValue-asc", label: "Mana cost: low to high" }
];

export function CustomerCatalogPage({
  cards,
  onCatalogLoaded,
  onAddToCart,
  onViewDetails
}: CustomerCatalogPageProps) {
  const [query, setQuery] = useState<CustomerCatalogQuery>(defaultQuery);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [remoteTotal, setRemoteTotal] = useState(cards.length);
  const suggestions = getCatalogSuggestions(cards, query.q ?? "");
  const result = useMemo(() => filterCatalog(cards, { ...query, page: 1, pageSize: 20 }), [cards, query]);
  const availableCount = result.items.filter((card) => card.stock > 0).length;
  const outOfStockCount = result.items.length - availableCount;

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);

    fetchScryfallCatalogPage({
      page: query.page ?? 1,
      q: query.q,
      sortOption: query.sortOption,
      signal: controller.signal
    })
      .then((response) => {
        onCatalogLoaded(response.items);
        setRemoteTotal(response.total);
      })
      .catch((error: unknown) => {
        if ((error as Error).name !== "AbortError") {
          setLoadError("Scryfall cards could not be loaded. Showing the last available catalog data.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [onCatalogLoaded, query.page, query.q, query.sortOption]);

  function updateQuery(next: CustomerCatalogQuery) {
    setQuery((current) => ({ ...current, ...next, page: next.page ?? 1 }));
  }

  function resetFilters() {
    setQuery(defaultQuery);
  }

  return (
    <section className="page-stack page-motion">
      <section className="summary-strip" aria-label="Catalog summary">
        <div className="summary-cell">
          <span>Visible cards</span>
          <strong>{result.total}</strong>
        </div>
        <div className="summary-cell">
          <span>Available</span>
          <strong>{availableCount}</strong>
        </div>
        <div className="summary-cell">
          <span>Out of stock</span>
          <strong>{outOfStockCount}</strong>
        </div>
        <div className="summary-cell">
          <span>Scryfall matches</span>
          <strong>{remoteTotal.toLocaleString("en-US")}</strong>
        </div>
      </section>

      <section className="toolbar" aria-label="Catalog filters">
        <label className="field search-field">
          <span>Search cards</span>
          <div className="input-with-icon">
            <Search size={16} />
            <input
              value={query.q ?? ""}
              onChange={(event) => updateQuery({ q: event.target.value })}
              placeholder="Lightning Bolt"
              list="card-suggestions"
            />
          </div>
          <datalist id="card-suggestions">
            {suggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion}>
                {suggestion}
              </option>
            ))}
          </datalist>
          {suggestions.map((suggestion) => (
            <div role="option" className="suggestion" key={suggestion}>
              {suggestion}
            </div>
          ))}
        </label>

        <label className="field">
          <span>Min price</span>
          <input
            type="number"
            min="0"
            value={query.minPrice ?? ""}
            onChange={(event) => updateQuery({ minPrice: numberOrUndefined(event.target.value) })}
          />
        </label>
        <label className="field">
          <span>Max price</span>
          <input
            type="number"
            min="0"
            value={query.maxPrice ?? ""}
            onChange={(event) => updateQuery({ maxPrice: numberOrUndefined(event.target.value) })}
          />
        </label>
        <Select label="Printing" value={query.printing ?? "all"} onChange={(printing) => updateQuery({ printing: printing as Printing | "all" })} options={["all", "nonfoil", "foil", "etched"]} />
        <Select label="Rarity" value={query.rarity ?? ""} onChange={(rarity) => updateQuery({ rarity })} options={["", "common", "uncommon", "rare", "mythic"]} />
        <Select label="Card type" value={query.cardType ?? ""} onChange={(cardType) => updateQuery({ cardType })} options={["", "creature", "instant", "sorcery", "artifact", "enchantment", "planeswalker", "land"]} />
        <Select label="Color" value={query.color ?? ""} onChange={(color) => updateQuery({ color })} options={["", "W", "U", "B", "R", "G", "colorless", "multicolor"]} />
        <Select label="Condition" value={query.condition ?? ""} onChange={(condition) => updateQuery({ condition })} options={["", "NM", "LP", "MP", "HP", "damaged"]} />
        <Select label="Set" value={query.set ?? ""} onChange={(set) => updateQuery({ set })} options={["", "2XM", "CLU", "LTC", "ONE"]} />
        <Select label="Stock" value={query.stock ?? "all"} onChange={(stock) => updateQuery({ stock: stock as CustomerCatalogQuery["stock"] })} options={["all", "in-stock", "out-of-stock"]} />
        <SortSelect
          value={query.sortOption ?? "dateAdded-desc"}
          onChange={(sortOption) => updateQuery({ sortOption })}
        />

        <div className="segmented" aria-label="View mode">
          <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} type="button">
            <Grid2X2 size={16} />
            Grid view
          </button>
          <button className={view === "table" ? "active" : ""} onClick={() => setView("table")} type="button">
            <List size={16} />
            Table view
          </button>
        </div>
        <button className="button ghost" onClick={resetFilters} type="button">
          <RotateCcw size={15} />
          Reset filters
        </button>
      </section>

      <div className="result-bar console-band">
        <strong>
          <SlidersHorizontal size={16} />
          {isLoading ? "Loading Scryfall cards..." : `${result.total} shown from ${remoteTotal.toLocaleString("en-US")} Scryfall results`}
        </strong>
        <span>Page {query.page ?? 1}</span>
      </div>
      {loadError ? <div className="inline-alert">{loadError}</div> : null}

      {view === "grid" ? (
        <div className="card-grid">
          {result.items.map((card) => (
            <article className="catalog-card" key={card.id}>
              <button
                className="card-image-link"
                onClick={() => onViewDetails(card.id)}
                aria-label={`View ${card.name} details`}
                type="button"
              >
                <img loading="lazy" src={card.imageUrl} alt={`${card.name} card art`} />
                <span className={card.stock > 0 ? "stock-chip in-stock" : "stock-chip out-stock"}>
                  {card.stock > 0 ? `${card.stock} available` : "Out"}
                </span>
              </button>
              <button
                className="card-title-link"
                onClick={() => onViewDetails(card.id)}
                aria-label={`View ${card.name} details`}
                type="button"
              >
                <h2>{card.name}</h2>
              </button>
              <div className="tag-row">
                <span>{card.setCode} #{card.collectorNumber}</span>
                <span>{card.condition}</span>
                <span>{card.printing}</span>
              </div>
              <div className="price-row">
                <strong>{formatPhp(card.pricePhp)}</strong>
                <span>{card.rarity}</span>
              </div>
              <button className="button full" disabled={card.stock <= 0} onClick={() => onAddToCart(toCartItem(card))} type="button">
                Add to cart
              </button>
            </article>
          ))}
        </div>
      ) : (
        <section className="customer-table-panel panel" aria-label="Customer catalog table">
          <div className="table-panel-header">
            <div>
              <strong>Customer Card List</strong>
              <span>Hover a card name to preview the printing.</span>
            </div>
            <span>{result.items.length} rows</span>
          </div>
          <table className="data-table" aria-label="Customer card list">
            <thead>
              <tr>
                <th>Name</th>
                <th>Set</th>
                <th>Printing</th>
                <th>Condition</th>
                <th>Rarity</th>
                <th>Type</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((card) => (
                <tr key={card.id}>
                  <td>
                    <span className="preview-cell">
                      <button
                        className="link-button"
                        onClick={() => onViewDetails(card.id)}
                        aria-label={`View ${card.name} details`}
                        type="button"
                      >
                        {card.name}
                      </button>
                      <img src={card.imageUrl} alt="" />
                    </span>
                  </td>
                  <td>{card.setCode}</td>
                  <td>{card.printing}</td>
                  <td><span className="mini-chip">{card.condition}</span></td>
                  <td><span className="mini-chip muted-chip">{card.rarity}</span></td>
                  <td>{card.cardType}</td>
                  <td>{formatPhp(card.pricePhp)}</td>
                  <td><span className={card.stock > 0 ? "stock-text ok" : "stock-text none"}>{card.stock > 0 ? card.stock : "Out"}</span></td>
                  <td>
                    <button className="button compact" disabled={card.stock <= 0} onClick={() => onAddToCart(toCartItem(card))} type="button">
                      Add
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="pagination">
        <button className="button secondary" disabled={(query.page ?? 1) <= 1 || isLoading} onClick={() => updateQuery({ page: (query.page ?? 1) - 1 })} type="button">
          Previous
        </button>
        <span>20 cards per page</span>
        <button className="button secondary" disabled={isLoading} onClick={() => updateQuery({ page: (query.page ?? 1) + 1 })} type="button">
          Next
        </button>
      </div>
    </section>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option value={option} key={option}>
            {option || "all"}
          </option>
        ))}
      </select>
    </label>
  );
}

function SortSelect({ value, onChange }: { value: SortOption; onChange: (value: SortOption) => void }) {
  return (
    <label className="field">
      <span>Sort</span>
      <select value={value} onChange={(event) => onChange(event.target.value as SortOption)}>
        {sortOptions.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function numberOrUndefined(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

export function formatPhp(value: number): string {
  return `PHP ${value.toLocaleString("en-US")}`;
}

export function toCartItem(card: CustomerCatalogItem): Omit<CartItem, "quantity"> {
  return {
    id: card.id,
    name: card.name,
    setLabel: `${card.setCode} #${card.collectorNumber}`,
    printing: card.printing,
    condition: card.condition,
    pricePhp: card.pricePhp,
    stock: card.stock,
    imageUrl: card.imageUrl
  };
}
