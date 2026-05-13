import { Router } from "express";
import type { ScryfallClient } from "../providers/scryfallClient";

export function cardRoutes(scryfallClient: ScryfallClient): Router {
  const router = Router();

  router.get("/cards/search", async (request, response, next) => {
    try {
      const query = String(request.query.q ?? "");
      response.json({ names: await scryfallClient.searchNames(query) });
    } catch (error) {
      next(error);
    }
  });

  router.get("/cards/prints", async (request, response, next) => {
    try {
      const name = String(request.query.name ?? "");
      response.json({ cards: await scryfallClient.searchPrints(name) });
    } catch (error) {
      next(error);
    }
  });

  router.get("/cards/:scryfallId", async (request, response, next) => {
    try {
      response.json({ card: await scryfallClient.getCardById(request.params.scryfallId) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
