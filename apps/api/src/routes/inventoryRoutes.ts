import { createInventoryLotSchema } from "@mtg-inventory/shared";
import { Router } from "express";
import type { InventoryService } from "../services/inventoryService";

export function inventoryRoutes(inventoryService: InventoryService): Router {
  const router = Router();

  router.get("/inventory", (request, response) => {
    response.json({
      lots: inventoryService.listLots({
        includeSoldOut: request.query.includeSoldOut === "true",
      }),
    });
  });

  router.post("/inventory", async (request, response, next) => {
    try {
      const input = createInventoryLotSchema.parse(request.body);
      const lot = inventoryService.createLot(input);
      response.status(201).json({
        lot: await inventoryService.refreshLotPrice(lot.id),
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/inventory/:id", (request, response) => {
    response.json({ lot: inventoryService.getLot(Number(request.params.id)) });
  });

  router.patch("/inventory/:id", (request, response) => {
    response.json({
      lot: inventoryService.updateLot(Number(request.params.id), request.body),
    });
  });

  router.delete("/inventory/:id", (request, response) => {
    inventoryService.deleteLot(Number(request.params.id));
    response.status(204).send();
  });

  router.post("/inventory/:id/refresh-price", async (request, response, next) => {
    try {
      response.json({
        lot: await inventoryService.refreshLotPrice(Number(request.params.id)),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
