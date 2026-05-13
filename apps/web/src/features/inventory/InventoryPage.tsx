import type { InventoryLot } from "@mtg-inventory/shared";
import { Image, Pencil, RefreshCw, Search, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createSale,
  deleteInventoryLot,
  fetchInventoryLots,
  refreshInventoryPrices,
  updateInventoryLot,
} from "../../app/apiClient";

const columns = [
  "Card Name",
  "Set",
  "Condition",
  "Foil",
  "Qty",
  "Buy PHP",
  "Market USD",
  "Suggested PHP",
  "P&L",
  "Actions",
];

interface InventoryPageProps {
  refreshKey: number;
}

export function InventoryPage({ refreshKey }: InventoryPageProps) {
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [includeSoldOut, setIncludeSoldOut] = useState(false);
  const [activeLot, setActiveLot] = useState<InventoryLot | null>(null);
  const [editingLot, setEditingLot] = useState<InventoryLot | null>(null);
  const [saleLot, setSaleLot] = useState<InventoryLot | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function loadLots() {
    try {
      setLots(await fetchInventoryLots());
    } catch {
      setLots([]);
    }
  }

  useEffect(() => {
    void loadLots();
  }, [refreshKey]);

  const filteredLots = useMemo(() => {
    const sanitized = sanitizeSearch(query);
    return lots.filter((lot) => {
      if (!includeSoldOut && lot.isSoldOut) {
        return false;
      }
      if (!sanitized) {
        return true;
      }
      return sanitizeSearch(
        `${lot.cardName} ${lot.setName} ${lot.setCode} ${lot.collectorNumber}`,
      ).includes(sanitized);
    });
  }, [includeSoldOut, lots, query]);

  const suggestions = useMemo(() => {
    const sanitized = sanitizeSearch(query);
    if (!sanitized) {
      return [];
    }
    return Array.from(
      new Set(
        lots
          .filter((lot) => sanitizeSearch(lot.cardName).includes(sanitized))
          .map((lot) => lot.cardName),
      ),
    ).slice(0, 6);
  }, [lots, query]);

  const metrics = useMemo(() => {
    const active = lots.filter((lot) => !lot.isSoldOut);
    const totalCopies = active.reduce((sum, lot) => sum + lot.qty, 0);
    const buyCost = active.reduce(
      (sum, lot) => sum + lot.buyPricePhpPerCopy * lot.qty,
      0,
    );
    const portfolio = active.reduce(
      (sum, lot) => sum + (lot.suggestedPricePhp ?? 0) * lot.qty,
      0,
    );
    return {
      activeLots: active.length,
      totalCopies,
      buyCost,
      portfolio,
      unrealized: portfolio - buyCost,
      realized: 0,
    };
  }, [lots]);

  const allVisibleSelected =
    filteredLots.length > 0 && filteredLots.every((lot) => selectedIds.includes(lot.id));

  useEffect(() => {
    const refresh = () => {
      void handleRefresh(selectedIds.length ? selectedIds : filteredLots.map((lot) => lot.id));
    };
    const openImport = () => setShowImport(true);
    window.addEventListener("inventory:refresh", refresh);
    window.addEventListener("inventory:import", openImport);
    return () => {
      window.removeEventListener("inventory:refresh", refresh);
      window.removeEventListener("inventory:import", openImport);
    };
  }, [filteredLots, selectedIds]);

  function toggleAllVisible() {
    setSelectedIds(allVisibleSelected ? [] : filteredLots.map((lot) => lot.id));
  }

  function toggleSelected(id: number) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  async function handleRefresh(ids?: number[]) {
    setStatus("Refreshing prices...");
    await refreshInventoryPrices(ids);
    await loadLots();
    setStatus("Prices refreshed.");
  }

  async function handleDelete(lot: InventoryLot) {
    if (!confirm(`Delete ${lot.cardName} (${lot.setCode.toUpperCase()} #${lot.collectorNumber})?`)) {
      return;
    }
    await deleteInventoryLot(lot.id);
    await loadLots();
  }

  return (
    <div className="content-stack page-motion">
      <section className="summary-grid" aria-label="Inventory summary">
        <Metric label="Active Lots" value={String(metrics.activeLots)} />
        <Metric label="Total Copies" value={String(metrics.totalCopies)} />
        <Metric label="Buy Cost" value={formatPhp(metrics.buyCost)} />
        <Metric label="Portfolio Value" value={formatPhp(metrics.portfolio)} />
        <Metric label="Unrealized P&L" value={formatSignedPhp(metrics.unrealized)} />
        <Metric label="Realized P&L" value={formatPhp(metrics.realized)} tone="neutral" />
      </section>

      <section className="panel toolbar-panel" aria-label="Inventory filters">
        <label className="search-box search-with-suggestions">
          <Search size={16} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search card, set, or collector number"
            type="search"
            value={query}
          />
          {suggestions.length > 0 ? (
            <div className="suggestion-menu">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
        </label>
        <button
          className="button"
          onClick={() => setShowImport(true)}
          type="button"
        >
          Import CSV
        </button>
        <button
          className="button"
          onClick={() => handleRefresh(selectedIds.length ? selectedIds : filteredLots.map((lot) => lot.id))}
          type="button"
        >
          <RefreshCw size={16} />
          Refresh View
        </button>
        <label className="check-row">
          <input
            checked={includeSoldOut}
            onChange={(event) => setIncludeSoldOut(event.target.checked)}
            type="checkbox"
          />
          Include Sold Out
        </label>
      </section>

      {status ? <p className="muted">{status}</p> : null}

      <section className="panel table-panel" aria-label="Inventory table">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    aria-label="Select all inventory rows"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    type="checkbox"
                  />
                </th>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLots.map((lot) => (
                <tr
                  className={lot.isSoldOut ? "inventory-row sold-out" : "inventory-row"}
                  key={lot.id}
                  onDoubleClick={() => setActiveLot(lot)}
                >
                  <td>
                    <input
                      aria-label={`Select ${lot.cardName}`}
                      checked={selectedIds.includes(lot.id)}
                      onChange={() => toggleSelected(lot.id)}
                      type="checkbox"
                    />
                  </td>
                  <td className="name-cell">
                    <button
                      className="link-button"
                      onClick={() => setActiveLot(lot)}
                      type="button"
                    >
                      {lot.cardName}
                    </button>
                    {lot.imageUris?.normal ? (
                      <span className="hover-preview">
                        <Image size={14} />
                        <img alt="" src={lot.imageUris.normal} />
                      </span>
                    ) : null}
                  </td>
                  <td>{lot.setCode.toUpperCase()} #{lot.collectorNumber}</td>
                  <td>{lot.condition}</td>
                  <td>{lot.foilType}</td>
                  <td>{lot.qty}</td>
                  <td>{formatPhp(lot.buyPricePhpPerCopy)}</td>
                  <td>{lot.marketPriceUsd === null ? "-" : `$${lot.marketPriceUsd.toFixed(2)}`}</td>
                  <td>{lot.suggestedPricePhp === null ? "-" : formatPhp(lot.suggestedPricePhp)}</td>
                  <td className={lotPnl(lot) >= 0 ? "positive" : "negative"}>
                    {lot.suggestedPricePhp === null ? "-" : formatSignedPhp(lotPnl(lot))}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="button button-small"
                        onClick={() => setSaleLot(lot)}
                        type="button"
                      >
                        Log Sale
                      </button>
                      <button
                        aria-label={`Edit ${lot.cardName}`}
                        className="icon-button compact"
                        onClick={() => setEditingLot(lot)}
                        type="button"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        aria-label={`Delete ${lot.cardName}`}
                        className="icon-button compact"
                        onClick={() => handleDelete(lot)}
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLots.length === 0 ? (
            <p className="empty-table">No cataloged lots match the current search.</p>
          ) : null}
        </div>
      </section>

      {activeLot ? <LotDetail lot={activeLot} onClose={() => setActiveLot(null)} /> : null}
      {editingLot ? (
        <EditLotModal
          lot={editingLot}
          onClose={() => setEditingLot(null)}
          onSaved={async () => {
            setEditingLot(null);
            await loadLots();
          }}
        />
      ) : null}
      {saleLot ? (
        <SaleModal
          lot={saleLot}
          onClose={() => setSaleLot(null)}
          onSaved={async () => {
            setSaleLot(null);
            await loadLots();
          }}
        />
      ) : null}
      {showImport ? <ImportNotice onClose={() => setShowImport(false)} /> : null}
    </div>
  );
}

function LotDetail({ lot, onClose }: { lot: InventoryLot; onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="modal lot-detail page-motion">
        <header className="drawer-header">
          <div>
            <p className="eyebrow">{lot.setName}</p>
            <h2>{lot.cardName}</h2>
          </div>
          <button className="button" onClick={onClose} type="button">Close</button>
        </header>
        <div className="detail-grid">
          {lot.imageUris?.normal ? <img alt="" src={lot.imageUris.normal} /> : null}
          <dl>
            <dt>Printing</dt><dd>{lot.setCode.toUpperCase()} #{lot.collectorNumber}</dd>
            <dt>Condition / foil</dt><dd>{lot.condition} / {lot.foilType}</dd>
            <dt>Quantity</dt><dd>{lot.qty}</dd>
            <dt>Buy price</dt><dd>{formatPhp(lot.buyPricePhpPerCopy)} per copy</dd>
            <dt>Market price today</dt><dd>{lot.marketPriceUsd === null ? "-" : `$${lot.marketPriceUsd.toFixed(2)}`}</dd>
            <dt>Multiplier</dt><dd>{lot.multiplier}</dd>
            <dt>Suggested PHP</dt><dd>{lot.suggestedPricePhp === null ? "-" : formatPhp(lot.suggestedPricePhp)}</dd>
            <dt>Notes</dt><dd>{lot.notes || "-"}</dd>
          </dl>
        </div>
      </section>
    </div>
  );
}

function EditLotModal({
  lot,
  onClose,
  onSaved,
}: {
  lot: InventoryLot;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [qty, setQty] = useState(String(lot.qty));
  const [buy, setBuy] = useState(String(lot.buyPricePhpPerCopy));
  const [multiplier, setMultiplier] = useState(String(lot.multiplier));
  const [condition, setCondition] = useState(lot.condition);
  const [notes, setNotes] = useState(lot.notes ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateInventoryLot(lot.id, {
      qty: Number(qty),
      buyPricePhpPerCopy: Number(buy),
      multiplier: Number(multiplier),
      condition,
      notes,
    });
    await onSaved();
  }

  return (
    <div className="modal-backdrop">
      <form className="modal lot-form page-motion" onSubmit={handleSubmit}>
        <h2>Edit {lot.cardName}</h2>
        <label>Qty<input value={qty} onChange={(event) => setQty(event.target.value)} type="number" /></label>
        <label>Buy price PHP<input value={buy} onChange={(event) => setBuy(event.target.value)} type="number" /></label>
        <label>Multiplier<input value={multiplier} onChange={(event) => setMultiplier(event.target.value)} type="number" /></label>
        <label>Condition<select value={condition} onChange={(event) => setCondition(event.target.value as typeof condition)}><option>NM</option><option>LP</option><option>MP</option><option>HP</option><option>DMG</option></select></label>
        <label className="full-width">Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
        <div className="drawer-actions"><button className="button" onClick={onClose} type="button">Cancel</button><button className="button button-primary" type="submit">Save Item</button></div>
      </form>
    </div>
  );
}

function SaleModal({
  lot,
  onClose,
  onSaved,
}: {
  lot: InventoryLot;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState(String(lot.suggestedPricePhp ?? ""));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createSale({
      sellDate: new Date().toISOString().slice(0, 10),
      items: [
        {
          inventoryLotId: lot.id,
          qtySold: Number(qty),
          actualSellPricePhpPerCopy: Number(price),
        },
      ],
    });
    await onSaved();
  }

  return (
    <div className="modal-backdrop">
      <form className="modal lot-form page-motion" onSubmit={handleSubmit}>
        <h2>Log Sale</h2>
        <p>{lot.cardName} - {lot.setCode.toUpperCase()} #{lot.collectorNumber}</p>
        <label>Qty sold<input max={lot.qty} min="1" value={qty} onChange={(event) => setQty(event.target.value)} type="number" /></label>
        <label>Actual sell price PHP per copy<input value={price} onChange={(event) => setPrice(event.target.value)} type="number" /></label>
        <div className="drawer-actions"><button className="button" onClick={onClose} type="button">Cancel</button><button className="button button-primary" type="submit">Save Sale</button></div>
      </form>
    </div>
  );
}

function ImportNotice({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="modal page-motion">
        <h2>Import CSV</h2>
        <p className="muted">The import wizard is queued for the next build slice. Valid rows, mapping, preview, and review queue will be implemented there.</p>
        <button className="button button-primary" onClick={onClose} type="button">Got it</button>
      </section>
    </div>
  );
}

function sanitizeSearch(value: string): string {
  return value.replace(/[^\p{L}\p{N}\s,'#/-]/gu, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function lotPnl(lot: InventoryLot): number {
  return ((lot.suggestedPricePhp ?? 0) - lot.buyPricePhpPerCopy) * lot.qty;
}

function formatSignedPhp(value: number): string {
  return `${value >= 0 ? "+" : "-"}${formatPhp(Math.abs(value))}`;
}

function formatPhp(value: number): string {
  return `PHP ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "neutral";
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={tone === "neutral" ? "neutral" : undefined}>{value}</strong>
    </div>
  );
}
