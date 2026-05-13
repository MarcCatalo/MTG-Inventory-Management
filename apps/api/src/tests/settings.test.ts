import { describe, expect, it } from "vitest";
import { createTestDatabase } from "../db/connection";
import { runMigrations } from "../db/migrations";
import { SettingsRepository } from "../repositories/settingsRepository";
import { SettingsService } from "../services/settingsService";

describe("settings service", () => {
  it("seeds and returns default settings", () => {
    const db = createTestDatabase();
    runMigrations(db);
    const service = new SettingsService(new SettingsRepository(db));

    expect(service.getSettings()).toMatchObject({
      default_multiplier: "57",
      price_refresh_hours: "24",
      default_language: "en",
      default_condition: "NM",
      theme: "system",
      price_provider: "scryfall",
      future_tcgplayer_enabled: "false",
    });
  });

  it("persists settings updates", () => {
    const db = createTestDatabase();
    runMigrations(db);
    const service = new SettingsService(new SettingsRepository(db));

    service.updateSettings({
      default_multiplier: "60",
      theme: "dark",
      price_refresh_hours: "48",
    });

    expect(service.getSettings()).toMatchObject({
      default_multiplier: "60",
      theme: "dark",
      price_refresh_hours: "48",
    });
  });
});
