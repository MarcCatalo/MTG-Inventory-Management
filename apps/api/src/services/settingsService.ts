import { settingsSchema, type Settings } from "@mtg-inventory/shared";
import type { SettingsRepository } from "../repositories/settingsRepository";

export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  getSettings(): Settings {
    return settingsSchema.parse(this.settingsRepository.getAll());
  }

  updateSettings(values: Partial<Settings>): Settings {
    const current = this.getSettings();
    const next = settingsSchema.parse({ ...current, ...values });
    this.settingsRepository.update(next);
    return this.getSettings();
  }
}
