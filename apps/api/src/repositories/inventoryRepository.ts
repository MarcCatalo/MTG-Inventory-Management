import type {
  CreateInventoryLotInput,
  InventoryLot,
} from "@mtg-inventory/shared";
import type { SqliteDatabase } from "../db/connection";

interface InventoryLotRow {
  id: number;
  scryfall_id: string;
  oracle_id: string | null;
  tcgplayer_id: number | null;
  card_name: string;
  set_code: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  color_identity: string;
  image_uris: string | null;
  condition: InventoryLot["condition"];
  foil_type: InventoryLot["foilType"];
  language: InventoryLot["language"];
  qty: number;
  buy_price_php_per_copy: number;
  purchase_date: string;
  multiplier: number;
  market_price_usd: number | null;
  suggested_price_php: number | null;
  price_last_updated: string | null;
  notes: string | null;
  is_sold_out: number;
  created_at: string;
  updated_at: string;
}

export interface ListLotsOptions {
  includeSoldOut?: boolean;
}

export class InventoryRepository {
  constructor(private readonly db: SqliteDatabase) {}

  create(input: CreateInventoryLotInput): InventoryLot {
    const result = this.db
      .prepare(
        `
          INSERT INTO inventory_lots (
            scryfall_id,
            oracle_id,
            tcgplayer_id,
            card_name,
            set_code,
            set_name,
            collector_number,
            rarity,
            color_identity,
            image_uris,
            condition,
            foil_type,
            language,
            qty,
            buy_price_php_per_copy,
            purchase_date,
            multiplier,
            notes
          ) VALUES (
            @scryfallId,
            @oracleId,
            @tcgplayerId,
            @cardName,
            @setCode,
            @setName,
            @collectorNumber,
            @rarity,
            @colorIdentity,
            @imageUris,
            @condition,
            @foilType,
            @language,
            @qty,
            @buyPricePhpPerCopy,
            @purchaseDate,
            @multiplier,
            @notes
          )
        `,
      )
      .run({
        ...input,
        colorIdentity: JSON.stringify(input.colorIdentity),
        imageUris: input.imageUris ? JSON.stringify(input.imageUris) : null,
        notes: input.notes ?? null,
      });

    return this.getById(Number(result.lastInsertRowid));
  }

  list(options: ListLotsOptions = {}): InventoryLot[] {
    const rows = this.db
      .prepare(
        `
          SELECT * FROM inventory_lots
          WHERE (@includeSoldOut = 1 OR is_sold_out = 0)
          ORDER BY created_at DESC, id DESC
        `,
      )
      .all({ includeSoldOut: options.includeSoldOut ? 1 : 0 }) as InventoryLotRow[];

    return rows.map(mapInventoryLotRow);
  }

  getById(id: number): InventoryLot {
    const row = this.db
      .prepare("SELECT * FROM inventory_lots WHERE id = ?")
      .get(id) as InventoryLotRow | undefined;

    if (!row) {
      throw new Error(`Inventory lot ${id} was not found`);
    }

    return mapInventoryLotRow(row);
  }

  update(
    id: number,
    input: Partial<
      Pick<
        InventoryLot,
        | "condition"
        | "foilType"
        | "language"
        | "qty"
        | "buyPricePhpPerCopy"
        | "purchaseDate"
        | "multiplier"
        | "notes"
      >
    >,
  ): InventoryLot {
    const current = this.getById(id);
    const next = { ...current, ...input };

    this.db
      .prepare(
        `
          UPDATE inventory_lots
          SET
            condition = @condition,
            foil_type = @foilType,
            language = @language,
            qty = @qty,
            buy_price_php_per_copy = @buyPricePhpPerCopy,
            purchase_date = @purchaseDate,
            multiplier = @multiplier,
            notes = @notes,
            is_sold_out = @isSoldOut,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = @id
        `,
      )
      .run({
        id,
        condition: next.condition,
        foilType: next.foilType,
        language: next.language,
        qty: next.qty,
        buyPricePhpPerCopy: next.buyPricePhpPerCopy,
        purchaseDate: next.purchaseDate,
        multiplier: next.multiplier,
        notes: next.notes,
        isSoldOut: next.qty <= 0 ? 1 : 0,
      });

    return this.getById(id);
  }

  delete(id: number): void {
    this.db.prepare("DELETE FROM inventory_lots WHERE id = ?").run(id);
  }

  updatePricing(input: {
    id: number;
    marketPriceUsd: number | null;
    suggestedPricePhp: number | null;
    priceLastUpdated: string;
  }): InventoryLot {
    this.db
      .prepare(
        `
          UPDATE inventory_lots
          SET
            market_price_usd = @marketPriceUsd,
            suggested_price_php = @suggestedPricePhp,
            price_last_updated = @priceLastUpdated,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = @id
        `,
      )
      .run(input);

    return this.getById(input.id);
  }
}

function mapInventoryLotRow(row: InventoryLotRow): InventoryLot {
  return {
    id: row.id,
    scryfallId: row.scryfall_id,
    oracleId: row.oracle_id,
    tcgplayerId: row.tcgplayer_id,
    cardName: row.card_name,
    setCode: row.set_code,
    setName: row.set_name,
    collectorNumber: row.collector_number,
    rarity: row.rarity,
    colorIdentity: JSON.parse(row.color_identity) as string[],
    imageUris: row.image_uris
      ? (JSON.parse(row.image_uris) as Record<string, string>)
      : null,
    condition: row.condition,
    foilType: row.foil_type,
    language: row.language,
    qty: row.qty,
    buyPricePhpPerCopy: row.buy_price_php_per_copy,
    purchaseDate: row.purchase_date,
    multiplier: row.multiplier,
    marketPriceUsd: row.market_price_usd,
    suggestedPricePhp: row.suggested_price_php,
    priceLastUpdated: row.price_last_updated,
    notes: row.notes,
    isSoldOut: row.is_sold_out === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
