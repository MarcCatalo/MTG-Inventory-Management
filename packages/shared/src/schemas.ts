import { z } from "zod";
import {
  CONDITIONS,
  FOIL_TYPES,
  IMPORT_ROW_STATUSES,
  LANGUAGES,
  PRICE_PROVIDERS,
  THEMES,
} from "./constants";

export const conditionSchema = z.enum(CONDITIONS);
export const foilTypeSchema = z.enum(FOIL_TYPES);
export const languageSchema = z.enum(LANGUAGES);
export const themeSchema = z.enum(THEMES);
export const priceProviderSchema = z.enum(PRICE_PROVIDERS);
export const importRowStatusSchema = z.enum(IMPORT_ROW_STATUSES);

export const inventoryLotSchema = z.object({
  id: z.number(),
  scryfallId: z.string(),
  oracleId: z.string().nullable(),
  tcgplayerId: z.number().nullable(),
  cardName: z.string(),
  setCode: z.string(),
  setName: z.string(),
  collectorNumber: z.string(),
  rarity: z.string(),
  colorIdentity: z.array(z.string()),
  imageUris: z.record(z.string()).nullable(),
  condition: conditionSchema,
  foilType: foilTypeSchema,
  language: languageSchema,
  qty: z.number().int().min(0),
  buyPricePhpPerCopy: z.number().min(0),
  purchaseDate: z.string(),
  multiplier: z.number().min(0),
  marketPriceUsd: z.number().nullable(),
  suggestedPricePhp: z.number().nullable(),
  priceLastUpdated: z.string().nullable(),
  notes: z.string().nullable(),
  isSoldOut: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createInventoryLotSchema = inventoryLotSchema
  .omit({
    id: true,
    marketPriceUsd: true,
    suggestedPricePhp: true,
    priceLastUpdated: true,
    isSoldOut: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    qty: z.number().int().min(1),
  });

export const settingsSchema = z.object({
  default_multiplier: z.string(),
  price_refresh_hours: z.string(),
  default_language: z.string(),
  default_condition: z.string(),
  theme: themeSchema,
  price_provider: priceProviderSchema,
  future_tcgplayer_enabled: z.string(),
});

export const saleItemInputSchema = z.object({
  inventoryLotId: z.number(),
  qtySold: z.number().int().min(1),
  actualSellPricePhpPerCopy: z.number().min(0),
  notes: z.string().optional(),
});

export const createSaleSchema = z.object({
  sellDate: z.string(),
  buyerOrChannel: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(saleItemInputSchema).min(1),
});
