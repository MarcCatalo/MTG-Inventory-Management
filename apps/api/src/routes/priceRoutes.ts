import { Router } from "express";
import type { InventoryService } from "../services/inventoryService";

export function priceRoutes(inventoryService: InventoryService): Router {
  const router = Router();

  router.post("/prices/refresh", async (request, response, next) => {
    try {
      const ids = Array.isArray(request.body?.inventoryLotIds)
        ? request.body.inventoryLotIds.map(Number)
        : inventoryService.listLots().map((lot) => lot.id);

      const results = [];
      for (const id of ids) {
        results.push(await inventoryService.refreshLotPrice(id));
      }

      response.json({
        updated: results.length,
        lots: results,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
