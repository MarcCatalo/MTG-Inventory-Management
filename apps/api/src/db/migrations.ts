import { DEFAULT_SETTINGS } from "@mtg-inventory/shared";
import type { SqliteDatabase } from "./connection";

export function runMigrations(db: SqliteDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_lots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scryfall_id TEXT NOT NULL,
      oracle_id TEXT,
      tcgplayer_id INTEGER,
      card_name TEXT NOT NULL,
      set_code TEXT NOT NULL,
      set_name TEXT NOT NULL,
      collector_number TEXT NOT NULL,
      rarity TEXT NOT NULL,
      color_identity TEXT NOT NULL DEFAULT '[]',
      image_uris TEXT,
      condition TEXT NOT NULL DEFAULT 'NM',
      foil_type TEXT NOT NULL DEFAULT 'nonfoil',
      language TEXT NOT NULL DEFAULT 'en',
      qty INTEGER NOT NULL DEFAULT 1,
      buy_price_php_per_copy REAL NOT NULL,
      purchase_date TEXT NOT NULL,
      multiplier REAL NOT NULL,
      market_price_usd REAL,
      suggested_price_php REAL,
      price_last_updated TEXT,
      notes TEXT,
      is_sold_out INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_lot_id INTEGER NOT NULL REFERENCES inventory_lots(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      provider_label TEXT NOT NULL,
      price_metric TEXT NOT NULL,
      market_price_usd REAL,
      multiplier_used REAL NOT NULL,
      suggested_price_php_raw REAL,
      suggested_price_php_rounded REAL,
      foil_type TEXT NOT NULL,
      fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL,
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sell_date TEXT NOT NULL,
      buyer_or_channel TEXT,
      notes TEXT,
      actual_total_php REAL NOT NULL DEFAULT 0,
      suggested_total_php REAL NOT NULL DEFAULT 0,
      realized_pnl_php REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      inventory_lot_id INTEGER NOT NULL REFERENCES inventory_lots(id),
      card_name TEXT NOT NULL,
      set_code TEXT NOT NULL,
      condition TEXT NOT NULL,
      foil_type TEXT NOT NULL,
      qty_sold INTEGER NOT NULL,
      buy_price_php_per_copy REAL NOT NULL,
      market_price_usd_at_sale REAL,
      multiplier_used REAL NOT NULL,
      suggested_price_php_per_copy REAL,
      actual_sell_price_php_per_copy REAL NOT NULL,
      realized_pnl_php REAL NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS import_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS import_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      import_batch_id INTEGER NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
      row_number INTEGER NOT NULL,
      raw_data TEXT NOT NULL,
      normalized_data TEXT,
      status TEXT NOT NULL,
      selected_scryfall_id TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const insert = db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (@key, @value)",
  );

  const insertMany = db.transaction(() => {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      insert.run({ key, value });
    }
  });

  insertMany();
}
