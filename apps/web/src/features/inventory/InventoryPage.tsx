import type { InventoryLot } from "@mtg-inventory/shared";
import { Pencil, RefreshCw, Search, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createSale,
  deleteInventoryLot,
  fetchSales,
  fetchInventoryLots,
  refreshInventoryPrices,
  updateInventoryLot,
  type SaleRecord,
} from "../../app/apiClient";

const columns = [
  "Card Name",
  "Set",
  "Condition",
  "Foil",
  "Qty",
  "Bought Price",
  "Listed Median USD",
  "Selling Price",
  "P&L",
  "Actions",
];

const previewSize = {
  width: 240,
  height: 336,
  gap: 4,
  margin: 16,
};

interface InventoryPageProps {
  refreshKey: number;
}

export function InventoryPage({ refreshKey }: InventoryPageProps) {
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [salesRealizedPnl, setSalesRealizedPnl] = useState(0);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [includeSoldOut, setIncludeSoldOut] = useState(false);
  const [activeLot, setActiveLot] = useState<InventoryLot | null>(null);
  const [editingLot, setEditingLot] = useState<InventoryLot | null>(null);
  const [saleLot, setSaleLot] = useState<InventoryLot | null>(null);
  const [bulkSaleLots, setBulkSaleLots] = useState<InventoryLot[] | null>(null);
  const [pendingDeleteLot, setPendingDeleteLot] = useState<InventoryLot | null>(null);
  const [pendingBulkDeleteLots, setPendingBulkDeleteLots] = useState<InventoryLot[] | null>(null);
  const [cardPreview, setCardPreview] = useState<{
    alt: string;
    left: number;
    src: string;
    top: number;
  } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function loadLots() {
    try {
      setLots(await fetchInventoryLots({ includeSoldOut }));
    } catch {
      setLots([]);
    }
  }

  async function loadSalesMetrics() {
    try {
      const sales = await fetchSales();
      setSales(sales);
      setSalesRealizedPnl(sales.reduce((sum, sale) => sum + sale.realizedPnlPhp, 0));
    } catch {
      setSales([]);
      setSalesRealizedPnl(0);
    }
  }

  useEffect(() => {
    void loadLots();
    void loadSalesMetrics();
  }, [includeSoldOut, refreshKey]);

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
      realized: salesRealizedPnl,
    };
  }, [lots, salesRealizedPnl]);

  const allVisibleSelected =
    filteredLots.length > 0 && filteredLots.every((lot) => selectedIds.includes(lot.id));
  const selectedLots = useMemo(
    () => lots.filter((lot) => selectedIds.includes(lot.id)),
    [lots, selectedIds],
  );
  const realizedPnlByLot = useMemo(() => {
    const totals = new Map<number, number>();
    for (const sale of sales) {
      for (const item of sale.items) {
        totals.set(
          item.inventoryLotId,
          (totals.get(item.inventoryLotId) ?? 0) + item.realizedPnlPhp,
        );
      }
    }
    return totals;
  }, [sales]);

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
    await deleteInventoryLot(lot.id);
    setPendingDeleteLot(null);
    setSelectedIds((current) => current.filter((selectedId) => selectedId !== lot.id));
    await loadLots();
  }

  async function handleBulkDelete(lotsToDelete: InventoryLot[]) {
    await Promise.all(lotsToDelete.map((lot) => deleteInventoryLot(lot.id)));
    setPendingBulkDeleteLots(null);
    setSelectedIds([]);
    await loadLots();
  }

  function showCardPreview(anchor: HTMLElement, lot: InventoryLot) {
    if (!lot.imageUris?.normal) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const rightSide = rect.right + previewSize.gap;
    const leftSide = rect.left - previewSize.width - previewSize.gap;
    const fitsRight = rightSide + previewSize.width <= viewportWidth - previewSize.margin;
    const preferredLeft = fitsRight ? rightSide : leftSide;
    const left = Math.max(
      previewSize.margin,
      Math.min(preferredLeft, viewportWidth - previewSize.width - previewSize.margin),
    );
    const centeredTop = rect.top + rect.height / 2 - previewSize.height / 2;
    const top = Math.max(
      previewSize.margin,
      Math.min(centeredTop, viewportHeight - previewSize.height - previewSize.margin),
    );

    setCardPreview({
      alt: lot.cardName,
      left,
      src: lot.imageUris.normal,
      top,
    });
  }

  return (
    <div className="content-stack page-motion">
      <section className="summary-grid" aria-label="Inventory summary">
        <Metric label="Active Lots" value={String(metrics.activeLots)} />
        <Metric label="Total Copies" value={String(metrics.totalCopies)} />
        <Metric label="Bought Cost" value={formatPhp(metrics.buyCost)} />
        <Metric label="Portfolio Value" value={formatPhp(metrics.portfolio)} />
        <Metric label="Unrealized P&L" value={formatSignedPhp(metrics.unrealized)} />
        <Metric label="Realized P&L" value={formatSignedPhp(metrics.realized)} tone="neutral" />
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

      {selectedLots.length > 0 ? (
        <section className="panel bulk-action-bar" aria-label="Selected inventory actions">
          <strong>{selectedLots.length} selected</strong>
          <div className="bulk-actions">
            <button
              className="button button-primary"
              disabled={selectedLots.every((lot) => lot.qty <= 0)}
              onClick={() => setBulkSaleLots(selectedLots.filter((lot) => lot.qty > 0))}
              type="button"
            >
              Log Selected Sale
            </button>
            <button
              className="button button-danger"
              onClick={() => setPendingBulkDeleteLots(selectedLots)}
              type="button"
            >
              Delete Selected
            </button>
          </div>
        </section>
      ) : null}

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
                    <span className="name-preview-wrap">
                      <button
                        className="link-button"
                        onBlur={() => setCardPreview(null)}
                        onFocus={(event) => showCardPreview(event.currentTarget, lot)}
                        onMouseEnter={(event) => showCardPreview(event.currentTarget, lot)}
                        onMouseLeave={() => setCardPreview(null)}
                        onClick={() => setActiveLot(lot)}
                        type="button"
                      >
                        {lot.cardName}
                      </button>
                    </span>
                  </td>
                  <td>{lot.setCode.toUpperCase()} #{lot.collectorNumber}</td>
                  <td>{lot.condition}</td>
                  <td>{lot.foilType}</td>
                  <td>{lot.qty}</td>
                  <td>{formatPhp(lot.buyPricePhpPerCopy)}</td>
                  <td>{lot.marketPriceUsd === null ? "-" : `$${lot.marketPriceUsd.toFixed(2)}`}</td>
                  <td>{lot.suggestedPricePhp === null ? "-" : formatPhp(lot.suggestedPricePhp)}</td>
                  <td className={displayLotPnl(lot, realizedPnlByLot) >= 0 ? "positive" : "negative"}>
                    {formatLotPnl(lot, realizedPnlByLot)}
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
                        onClick={() => setPendingDeleteLot(lot)}
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
            setSelectedIds([]);
            await loadLots();
            await loadSalesMetrics();
          }}
        />
      ) : null}
      {bulkSaleLots ? (
        <BulkSaleModal
          lots={bulkSaleLots}
          onClose={() => setBulkSaleLots(null)}
          onSaved={async () => {
            setBulkSaleLots(null);
            setSelectedIds([]);
            await loadLots();
            await loadSalesMetrics();
          }}
        />
      ) : null}
      {showImport ? <ImportNotice onClose={() => setShowImport(false)} /> : null}
      {pendingDeleteLot ? (
        <ConfirmDialog
          body={`This removes ${pendingDeleteLot.cardName} (${pendingDeleteLot.setCode.toUpperCase()} #${pendingDeleteLot.collectorNumber}) from the local inventory database.`}
          confirmLabel="Delete Lot"
          onCancel={() => setPendingDeleteLot(null)}
          onConfirm={() => handleDelete(pendingDeleteLot)}
          title="Delete Inventory Lot?"
        />
      ) : null}
      {pendingBulkDeleteLots ? (
        <ConfirmDialog
          body={`This removes ${pendingBulkDeleteLots.length} selected inventory lots from the local database.`}
          confirmLabel="Delete Selected"
          onCancel={() => setPendingBulkDeleteLots(null)}
          onConfirm={() => handleBulkDelete(pendingBulkDeleteLots)}
          title="Delete Selected Lots?"
        />
      ) : null}
      {cardPreview ? (
        <div
          className="floating-card-preview"
          style={{ left: cardPreview.left, top: cardPreview.top }}
        >
          <img alt={cardPreview.alt} src={cardPreview.src} />
        </div>
      ) : null}
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
            <dt>Bought price</dt><dd>{formatPhp(lot.buyPricePhpPerCopy)} per copy</dd>
            <dt>Listed median today</dt><dd>{lot.marketPriceUsd === null ? "-" : `$${lot.marketPriceUsd.toFixed(2)}`}</dd>
            <dt>Multiplier</dt><dd>{lot.multiplier}</dd>
            <dt>Selling price</dt><dd>{lot.suggestedPricePhp === null ? "-" : formatPhp(lot.suggestedPricePhp)}</dd>
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
        <label>Bought price PHP<input value={buy} onChange={(event) => setBuy(event.target.value)} type="number" /></label>
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
        <label>Actual selling price PHP per copy<input required value={price} onChange={(event) => setPrice(event.target.value)} type="number" /></label>
        <div className="drawer-actions"><button className="button" onClick={onClose} type="button">Cancel</button><button className="button button-primary" type="submit">Save Sale</button></div>
      </form>
    </div>
  );
}

function BulkSaleModal({
  lots,
  onClose,
  onSaved,
}: {
  lots: InventoryLot[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rows, setRows] = useState(() =>
    lots.map((lot) => ({
      id: lot.id,
      qty: String(lot.qty),
      price: String(lot.suggestedPricePhp ?? ""),
    })),
  );

  function updateRow(id: number, field: "qty" | "price", value: string) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createSale({
      sellDate: new Date().toISOString().slice(0, 10),
      items: rows
        .map((row) => ({
          inventoryLotId: row.id,
          qtySold: Number(row.qty),
          actualSellPricePhpPerCopy: Number(row.price),
        }))
        .filter((row) => row.qtySold > 0),
    });
    await onSaved();
  }

  return (
    <div className="modal-backdrop">
      <form className="modal bulk-sale-modal page-motion" onSubmit={handleSubmit}>
        <h2>Log Selected Sale</h2>
        <p className="muted">
          Defaults mark every selected lot as sold using its current selling price.
        </p>
        <div className="bulk-sale-grid">
          {lots.map((lot) => {
            const row = rows.find((item) => item.id === lot.id);
            return (
              <div className="bulk-sale-row" key={lot.id}>
                <div>
                  <strong>{lot.cardName}</strong>
                  <span>{lot.setCode.toUpperCase()} #{lot.collectorNumber}</span>
                </div>
                <label>
                  Qty
                  <input
                    max={lot.qty}
                    min="1"
                    onChange={(event) => updateRow(lot.id, "qty", event.target.value)}
                    required
                    type="number"
                    value={row?.qty ?? "1"}
                  />
                </label>
                <label>
                  Selling price per copy
                  <input
                    min="0"
                    onChange={(event) => updateRow(lot.id, "price", event.target.value)}
                    required
                    type="number"
                    value={row?.price ?? ""}
                  />
                </label>
              </div>
            );
          })}
        </div>
        <div className="drawer-actions">
          <button className="button" onClick={onClose} type="button">Cancel</button>
          <button className="button button-primary" type="submit">Save Sale</button>
        </div>
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

function ConfirmDialog({
  body,
  confirmLabel,
  onCancel,
  onConfirm,
  title,
}: {
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}) {
  return (
    <div className="modal-backdrop">
      <section
        aria-labelledby="confirm-title"
        aria-modal="true"
        className="modal confirm-dialog page-motion"
        role="dialog"
      >
        <h2 id="confirm-title">{title}</h2>
        <p className="muted">{body}</p>
        <div className="drawer-actions">
          <button className="button" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="button button-danger" onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
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

function displayLotPnl(lot: InventoryLot, realizedPnlByLot: Map<number, number>): number {
  return realizedPnlByLot.get(lot.id) ?? lotPnl(lot);
}

function formatLotPnl(lot: InventoryLot, realizedPnlByLot: Map<number, number>): string {
  const realized = realizedPnlByLot.get(lot.id);
  if (realized !== undefined) {
    return formatSignedPhp(realized);
  }
  return lot.suggestedPricePhp === null ? "-" : formatSignedPhp(lotPnl(lot));
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
