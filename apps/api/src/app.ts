import cors from "cors";
import express from "express";
import type { SqliteDatabase } from "./db/connection";
import { ScryfallClient } from "./providers/scryfallClient";
import { InventoryRepository } from "./repositories/inventoryRepository";
import { PriceHistoryRepository } from "./repositories/priceHistoryRepository";
import { SalesRepository } from "./repositories/salesRepository";
import { healthRoutes } from "./routes/healthRoutes";
import { cardRoutes } from "./routes/cardRoutes";
import { inventoryRoutes } from "./routes/inventoryRoutes";
import { priceRoutes } from "./routes/priceRoutes";
import { salesRoutes } from "./routes/salesRoutes";
import { settingsRoutes } from "./routes/settingsRoutes";
import { SettingsRepository } from "./repositories/settingsRepository";
import { InventoryService } from "./services/inventoryService";
import { PricingService } from "./services/pricingService";
import { SalesService } from "./services/salesService";
import { SettingsService } from "./services/settingsService";

export function createApp(db: SqliteDatabase) {
  const app = express();
  const settingsService = new SettingsService(new SettingsRepository(db));
  const inventoryRepository = new InventoryRepository(db);
  const priceHistoryRepository = new PriceHistoryRepository(db);
  const salesRepository = new SalesRepository(db);
  const scryfallClient = new ScryfallClient();
  const pricingService = new PricingService(
    inventoryRepository,
    priceHistoryRepository,
    scryfallClient,
  );
  const inventoryService = new InventoryService(
    inventoryRepository,
    pricingService,
  );
  const salesService = new SalesService(inventoryRepository, salesRepository);

  app.use(
    cors({
      origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
    }),
  );
  app.use(express.json());
  app.use("/api", healthRoutes());
  app.use("/api", cardRoutes(scryfallClient));
  app.use("/api", inventoryRoutes(inventoryService));
  app.use("/api", priceRoutes(inventoryService));
  app.use("/api", salesRoutes(salesService));
  app.use("/api", settingsRoutes(settingsService));

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction,
    ) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      response.status(500).json({ error: message });
    },
  );

  return app;
}
