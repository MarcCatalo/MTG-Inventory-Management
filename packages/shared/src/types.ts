import type { z } from "zod";
import type {
  conditionSchema,
  createInventoryLotSchema,
  createSaleSchema,
  foilTypeSchema,
  importRowStatusSchema,
  inventoryLotSchema,
  languageSchema,
  priceProviderSchema,
  settingsSchema,
  themeSchema,
} from "./schemas";

export type Condition = z.infer<typeof conditionSchema>;
export type FoilType = z.infer<typeof foilTypeSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type PriceProvider = z.infer<typeof priceProviderSchema>;
export type ImportRowStatus = z.infer<typeof importRowStatusSchema>;
export type InventoryLot = z.infer<typeof inventoryLotSchema>;
export type CreateInventoryLotInput = z.infer<typeof createInventoryLotSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}
