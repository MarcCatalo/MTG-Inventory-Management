import cors from "cors";
import express from "express";
import type { SqliteDatabase } from "./db/connection";
import { healthRoutes } from "./routes/healthRoutes";
import { settingsRoutes } from "./routes/settingsRoutes";
import { SettingsRepository } from "./repositories/settingsRepository";
import { SettingsService } from "./services/settingsService";

export function createApp(db: SqliteDatabase) {
  const app = express();
  const settingsService = new SettingsService(new SettingsRepository(db));

  app.use(
    cors({
      origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
    }),
  );
  app.use(express.json());
  app.use("/api", healthRoutes());
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
