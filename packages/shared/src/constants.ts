export const CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"] as const;
export const FOIL_TYPES = ["nonfoil", "foil", "etched"] as const;
export const THEMES = ["light", "dark", "system"] as const;
export const PRICE_PROVIDERS = ["scryfall", "tcgplayer"] as const;
export const IMPORT_ROW_STATUSES = [
  "ready",
  "imported",
  "needs_printing",
  "missing_required_field",
  "invalid_quantity",
  "price_unavailable",
  "failed",
] as const;

export const LANGUAGES = [
  "en",
  "ja",
  "de",
  "fr",
  "it",
  "es",
  "pt",
  "ru",
  "ko",
  "zhs",
  "zht",
] as const;

export const DEFAULT_SETTINGS = {
  default_multiplier: "50",
  price_refresh_hours: "24",
  default_language: "en",
  default_condition: "NM",
  theme: "system",
  price_provider: "scryfall",
  future_tcgplayer_enabled: "false",
} as const;
