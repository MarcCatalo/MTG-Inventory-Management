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

interface SaleRow {
  id: number;
  sell_date: string;
  buyer_or_channel: string | null;
  notes: string | null;
  actual_total_php: number;
  suggested_total_php: number;
  realized_pnl_php: number;
  created_at: string;
}

interface SaleItemRow {
  id: number;
  sale_id: number;
  inventory_lot_id: number;
  card_name: string;
  set_code: string;
  condition: string;
  foil_type: string;
  qty_sold: number;
  buy_price_php_per_copy: number;
  market_price_usd_at_sale: number | null;
  multiplier_used: number;
  suggested_price_php_per_copy: number | null;
  actual_sell_price_php_per_copy: number;
  realized_pnl_php: number;
  notes: string | null;
}

export class SalesRepository {
  constructor(private readonly db: SqliteDatabase) {}

  list() {
    const sales = this.db
      .prepare(
        `
          SELECT *
          FROM sales
          ORDER BY sell_date DESC, created_at DESC, id DESC
        `,
      )
      .all() as SaleRow[];

    const items = this.db
      .prepare(
        `
          SELECT *
          FROM sale_items
          ORDER BY id ASC
        `,
      )
      .all() as SaleItemRow[];

    return sales.map((sale) => ({
      id: sale.id,
      sellDate: sale.sell_date,
      buyerOrChannel: sale.buyer_or_channel,
      notes: sale.notes,
      actualTotalPhp: sale.actual_total_php,
      suggestedTotalPhp: sale.suggested_total_php,
      realizedPnlPhp: sale.realized_pnl_php,
      createdAt: sale.created_at,
      items: items
        .filter((item) => item.sale_id === sale.id)
        .map((item) => ({
          id: item.id,
          inventoryLotId: item.inventory_lot_id,
          cardName: item.card_name,
          setCode: item.set_code,
          condition: item.condition,
          foilType: item.foil_type,
          qtySold: item.qty_sold,
          buyPricePhpPerCopy: item.buy_price_php_per_copy,
          marketPriceUsdAtSale: item.market_price_usd_at_sale,
          multiplierUsed: item.multiplier_used,
          suggestedPricePhpPerCopy: item.suggested_price_php_per_copy,
          actualSellPricePhpPerCopy: item.actual_sell_price_php_per_copy,
          realizedPnlPhp: item.realized_pnl_php,
          notes: item.notes,
        })),
    }));
  }

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
