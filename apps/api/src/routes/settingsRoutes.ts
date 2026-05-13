import { Router } from "express";
import type { SettingsService } from "../services/settingsService";

export function settingsRoutes(settingsService: SettingsService): Router {
  const router = Router();

  router.get("/settings", (_request, response) => {
    response.json(settingsService.getSettings());
  });

  router.patch("/settings", (request, response) => {
    response.json(settingsService.updateSettings(request.body));
  });

  return router;
}
