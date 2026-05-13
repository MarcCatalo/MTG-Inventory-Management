import type { PriceProvider } from "@mtg-inventory/shared";
import type { SqliteDatabase } from "../db/connection";

export interface PriceHistoryEntry {
  id: number;
  inventoryLotId: number;
  provider: PriceProvider;
  providerLabel: string;
  priceMetric: string;
  marketPriceUsd: number | null;
  multiplierUsed: number;
  suggestedPricePhpRaw: number | null;
  suggestedPricePhpRounded: number | null;
  foilType: string;
  fetchedAt: string;
  status: "success" | "missing_price" | "failed";
  errorMessage: string | null;
}

interface PriceHistoryRow {
  id: number;
  inventory_lot_id: number;
  provider: PriceProvider;
  provider_label: string;
  price_metric: string;
  market_price_usd: number | null;
  multiplier_used: number;
  suggested_price_php_raw: number | null;
  suggested_price_php_rounded: number | null;
  foil_type: string;
  fetched_at: string;
  status: "success" | "missing_price" | "failed";
  error_message: string | null;
}

export class PriceHistoryRepository {
  constructor(private readonly db: SqliteDatabase) {}

  create(input: Omit<PriceHistoryEntry, "id" | "fetchedAt"> & { fetchedAt?: string }) {
    const result = this.db
      .prepare(
        `
          INSERT INTO price_history (
            inventory_lot_id,
            provider,
            provider_label,
            price_metric,
            market_price_usd,
            multiplier_used,
            suggested_price_php_raw,
            suggested_price_php_rounded,
            foil_type,
            fetched_at,
            status,
            error_message
          ) VALUES (
            @inventoryLotId,
            @provider,
            @providerLabel,
            @priceMetric,
            @marketPriceUsd,
            @multiplierUsed,
            @suggestedPricePhpRaw,
            @suggestedPricePhpRounded,
            @foilType,
            COALESCE(@fetchedAt, CURRENT_TIMESTAMP),
            @status,
            @errorMessage
          )
        `,
      )
      .run({
        ...input,
        errorMessage: input.errorMessage ?? null,
        fetchedAt: input.fetchedAt ?? null,
      });

    return this.getById(Number(result.lastInsertRowid));
  }

  listForLot(inventoryLotId: number): PriceHistoryEntry[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM price_history WHERE inventory_lot_id = ? ORDER BY fetched_at DESC, id DESC",
      )
      .all(inventoryLotId) as PriceHistoryRow[];

    return rows.map(mapPriceHistoryRow);
  }

  private getById(id: number): PriceHistoryEntry {
    const row = this.db
      .prepare("SELECT * FROM price_history WHERE id = ?")
      .get(id) as PriceHistoryRow | undefined;

    if (!row) {
      throw new Error(`Price history entry ${id} was not found`);
    }

    return mapPriceHistoryRow(row);
  }
}

function mapPriceHistoryRow(row: PriceHistoryRow): PriceHistoryEntry {
  return {
    id: row.id,
    inventoryLotId: row.inventory_lot_id,
    provider: row.provider,
    providerLabel: row.provider_label,
    priceMetric: row.price_metric,
    marketPriceUsd: row.market_price_usd,
    multiplierUsed: row.multiplier_used,
    suggestedPricePhpRaw: row.suggested_price_php_raw,
    suggestedPricePhpRounded: row.suggested_price_php_rounded,
    foilType: row.foil_type,
    fetchedAt: row.fetched_at,
    status: row.status,
    errorMessage: row.error_message,
  };
}
