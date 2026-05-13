import { calculateRealizedPnlPhp, type CreateSaleInput } from "@mtg-inventory/shared";
import type { InventoryRepository } from "../repositories/inventoryRepository";
import type { SalesRepository } from "../repositories/salesRepository";

export class SalesService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly salesRepository: SalesRepository,
  ) {}

  createSale(input: CreateSaleInput) {
    const items = input.items.map((item) => {
      const lot = this.inventoryRepository.getById(item.inventoryLotId);
      if (item.qtySold > lot.qty) {
        throw new Error(`Cannot sell ${item.qtySold}; only ${lot.qty} available`);
      }

      const realizedPnlPhp = calculateRealizedPnlPhp(
        item.actualSellPricePhpPerCopy,
        lot.buyPricePhpPerCopy,
        item.qtySold,
      );

      return {
        inventoryLotId: lot.id,
        cardName: lot.cardName,
        setCode: lot.setCode,
        condition: lot.condition,
        foilType: lot.foilType,
        qtySold: item.qtySold,
        buyPricePhpPerCopy: lot.buyPricePhpPerCopy,
        marketPriceUsdAtSale: lot.marketPriceUsd,
        multiplierUsed: lot.multiplier,
        suggestedPricePhpPerCopy: lot.suggestedPricePhp,
        actualSellPricePhpPerCopy: item.actualSellPricePhpPerCopy,
        realizedPnlPhp,
        notes: item.notes ?? null,
      };
    });

    const sale = this.salesRepository.create({
      sellDate: input.sellDate,
      buyerOrChannel: input.buyerOrChannel ?? null,
      notes: input.notes ?? null,
      actualTotalPhp: items.reduce(
        (sum, item) => sum + item.actualSellPricePhpPerCopy * item.qtySold,
        0,
      ),
      suggestedTotalPhp: items.reduce(
        (sum, item) => sum + (item.suggestedPricePhpPerCopy ?? 0) * item.qtySold,
        0,
      ),
      realizedPnlPhp: items.reduce((sum, item) => sum + item.realizedPnlPhp, 0),
      items,
    });

    for (const item of items) {
      const lot = this.inventoryRepository.getById(item.inventoryLotId);
      this.inventoryRepository.update(lot.id, { qty: lot.qty - item.qtySold });
    }

    return sale;
  }
}
