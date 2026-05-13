import type { SqliteDatabase } from "../db/connection";

export interface CreateSaleRecordInput {
  sellDate: string;
  buyerOrChannel: string | null;
  notes: string | null;
  actualTotalPhp: number;
  suggestedTotalPhp: number;
  realizedPnlPhp: number;
  items: Array<{
    inventoryLotId: number;
    cardName: string;
    setCode: string;
    condition: string;
    foilType: string;
    qtySold: number;
    buyPricePhpPerCopy: number;
    marketPriceUsdAtSale: number | null;
    multiplierUsed: number;
    suggestedPricePhpPerCopy: number | null;
    actualSellPricePhpPerCopy: number;
    realizedPnlPhp: number;
    notes: string | null;
  }>;
}

export class SalesRepository {
  constructor(private readonly db: SqliteDatabase) {}

  create(input: CreateSaleRecordInput) {
    return this.db.transaction(() => {
      const sale = this.db
        .prepare(
          `
            INSERT INTO sales (
              sell_date, buyer_or_channel, notes, actual_total_php,
              suggested_total_php, realized_pnl_php
            ) VALUES (
              @sellDate, @buyerOrChannel, @notes, @actualTotalPhp,
              @suggestedTotalPhp, @realizedPnlPhp
            )
          `,
        )
        .run(input);

      const saleId = Number(sale.lastInsertRowid);
      const itemStatement = this.db.prepare(
        `
          INSERT INTO sale_items (
            sale_id, inventory_lot_id, card_name, set_code, condition, foil_type,
            qty_sold, buy_price_php_per_copy, market_price_usd_at_sale,
            multiplier_used, suggested_price_php_per_copy,
            actual_sell_price_php_per_copy, realized_pnl_php, notes
          ) VALUES (
            @saleId, @inventoryLotId, @cardName, @setCode, @condition, @foilType,
            @qtySold, @buyPricePhpPerCopy, @marketPriceUsdAtSale,
            @multiplierUsed, @suggestedPricePhpPerCopy,
            @actualSellPricePhpPerCopy, @realizedPnlPhp, @notes
          )
        `,
      );

      for (const item of input.items) {
        itemStatement.run({ ...item, saleId });
      }

      return { id: saleId, ...input };
    })();
  }
}
