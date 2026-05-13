import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { InventoryLot } from "@mtg-inventory/shared";
import { fetchInventoryLots } from "../../app/apiClient";

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

const sampleRows: InventoryRow[] = [
  {
    name: "Lightning Bolt",
    set: "M20 #154",
    condition: "NM",
    foil: "Non-foil",
    qty: 4,
    buy: "PHP 120.00",
    market: "$3.50",
    suggested: "PHP 200",
    pnl: "+PHP 320",
  },
  {
    name: "Ragavan, Nimble Pilferer",
    set: "MH2 #138",
    condition: "LP",
    foil: "Foil",
    qty: 1,
    buy: "PHP 2,100.00",
    market: "$45.00",
    suggested: "PHP 2,570",
    pnl: "+PHP 470",
  },
];

interface InventoryPageProps {
  refreshKey: number;
}

interface InventoryRow {
  name: string;
  set: string;
  condition: string;
  foil: string;
  qty: number;
  buy: string;
  market: string;
  suggested: string;
  pnl: string;
}

export function InventoryPage({ refreshKey }: InventoryPageProps) {
  const [lots, setLots] = useState<InventoryLot[]>([]);

  useEffect(() => {
    let isCurrent = true;

    fetchInventoryLots()
      .then((nextLots) => {
        if (isCurrent) {
          setLots(nextLots);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setLots([]);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  const rows = useMemo(() => {
    if (lots.length === 0) {
      return sampleRows;
    }

    return lots.map(mapLotToRow);
  }, [lots]);

  return (
    <div className="content-stack">
      <section className="summary-grid" aria-label="Inventory summary">
        <Metric label="Active Lots" value="0" />
        <Metric label="Total Copies" value="0" />
        <Metric label="Buy Cost" value="PHP 0" />
        <Metric label="Portfolio Value" value="PHP 0" />
        <Metric label="Unrealized P&L" value="PHP 0" tone="neutral" />
        <Metric label="Realized P&L" value="PHP 0" tone="neutral" />
      </section>

      <section className="panel toolbar-panel" aria-label="Inventory filters">
        <label className="search-box">
          <Search size={16} />
          <input placeholder="Search card name" type="search" />
        </label>
        <select aria-label="Set filter">
          <option>All sets</option>
        </select>
        <select aria-label="Condition filter">
          <option>All conditions</option>
        </select>
        <select aria-label="Color filter">
          <option>All colors</option>
        </select>
        <label className="check-row">
          <input type="checkbox" />
          Include Sold Out
        </label>
      </section>

      <section className="panel table-panel" aria-label="Inventory table">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>
                  <input aria-label="Select all inventory rows" type="checkbox" />
                </th>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <td>
                    <input aria-label={`Select ${row.name}`} type="checkbox" />
                  </td>
                  <td>
                    <button className="link-button" type="button">
                      {row.name}
                    </button>
                  </td>
                  <td>{row.set}</td>
                  <td>{row.condition}</td>
                  <td>{row.foil}</td>
                  <td>{row.qty}</td>
                  <td>{row.buy}</td>
                  <td>{row.market}</td>
                  <td>{row.suggested}</td>
                  <td className="positive">{row.pnl}</td>
                  <td>
                    <button className="button button-small" type="button">
                      Log Sale
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function mapLotToRow(lot: InventoryLot): InventoryRow {
  const suggested = lot.suggestedPricePhp ?? 0;
  const pnl = (suggested - lot.buyPricePhpPerCopy) * lot.qty;

  return {
    name: lot.cardName,
    set: `${lot.setCode.toUpperCase()} #${lot.collectorNumber}`,
    condition: lot.condition,
    foil: lot.foilType,
    qty: lot.qty,
    buy: formatPhp(lot.buyPricePhpPerCopy),
    market: lot.marketPriceUsd === null ? "-" : `$${lot.marketPriceUsd.toFixed(2)}`,
    suggested: lot.suggestedPricePhp === null ? "-" : formatPhp(lot.suggestedPricePhp),
    pnl: lot.suggestedPricePhp === null ? "-" : `${pnl >= 0 ? "+" : ""}${formatPhp(pnl)}`,
  };
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
