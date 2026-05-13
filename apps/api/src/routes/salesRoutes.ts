import { createSaleSchema } from "@mtg-inventory/shared";
import { Router } from "express";
import type { SalesService } from "../services/salesService";

export function salesRoutes(salesService: SalesService): Router {
  const router = Router();

  router.post("/sales", (request, response) => {
    response.status(201).json({
      sale: salesService.createSale(createSaleSchema.parse(request.body)),
    });
  });

  return router;
}
