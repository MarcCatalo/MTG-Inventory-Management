import { useEffect, useMemo, useState } from "react";
import { fetchSales, type SaleRecord } from "../../app/apiClient";

export function SalesLogPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSales()
      .then(setSales)
      .catch(() => setSales([]))
      .finally(() => setIsLoading(false));
  }, []);

  const totals = useMemo(
    () => ({
      batches: sales.length,
      items: sales.reduce(
        (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.qtySold, 0),
        0,
      ),
      revenue: sales.reduce((sum, sale) => sum + sale.actualTotalPhp, 0),
      pnl: sales.reduce((sum, sale) => sum + sale.realizedPnlPhp, 0),
    }),
    [sales],
  );

  return (
    <div className="content-stack page-motion">
      <section className="summary-grid" aria-label="Sales summary">
        <Metric label="Sale Batches" value={String(totals.batches)} />
        <Metric label="Cards Sold" value={String(totals.items)} />
        <Metric label="Revenue" value={formatPhp(totals.revenue)} />
        <Metric label="Realized P&L" value={formatSignedPhp(totals.pnl)} />
      </section>

      <section className="panel table-panel sales-log-panel" aria-label="Sales log">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Card</th>
                <th>Set</th>
                <th>Qty</th>
                <th>Actual PHP</th>
                <th>Selling Price</th>
                <th>P&L</th>
                <th>Channel</th>
              </tr>
            </thead>
            <tbody>
              {sales.flatMap((sale) =>
                sale.items.map((item) => (
                  <tr className="inventory-row" key={`${sale.id}-${item.id}`}>
                    <td>{sale.sellDate}</td>
                    <td>{item.cardName}</td>
                    <td>{item.setCode.toUpperCase()}</td>
                    <td>{item.qtySold}</td>
                    <td>{formatPhp(item.actualSellPricePhpPerCopy * item.qtySold)}</td>
                    <td>
                      {item.suggestedPricePhpPerCopy === null
                        ? "-"
                        : formatPhp(item.suggestedPricePhpPerCopy * item.qtySold)}
                    </td>
                    <td className={item.realizedPnlPhp >= 0 ? "positive" : "negative"}>
                      {formatSignedPhp(item.realizedPnlPhp)}
                    </td>
                    <td>{sale.buyerOrChannel ?? "-"}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
          {sales.length === 0 ? (
            <p className="empty-table">
              {isLoading ? "Loading sales..." : "No sales have been logged yet."}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
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
