import type {
  CreateInventoryLotInput,
  InventoryLot,
} from "@mtg-inventory/shared";
import type {
  InventoryRepository,
  ListLotsOptions,
} from "../repositories/inventoryRepository";
import type { PricingService } from "./pricingService";

export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly pricingService: PricingService,
  ) {}

  createLot(input: CreateInventoryLotInput): InventoryLot {
    return this.inventoryRepository.create(input);
  }

  listLots(options: ListLotsOptions = {}): InventoryLot[] {
    return this.inventoryRepository.list(options);
  }

  getLot(id: number): InventoryLot {
    return this.inventoryRepository.getById(id);
  }

  updateLot(id: number, input: Parameters<InventoryRepository["update"]>[1]): InventoryLot {
    return this.inventoryRepository.update(id, input);
  }

  deleteLot(id: number): void {
    this.inventoryRepository.delete(id);
  }

  async refreshLotPrice(id: number): Promise<InventoryLot> {
    return this.pricingService.refreshLotPrice(this.getLot(id));
  }
}
