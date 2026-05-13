import type { SqliteDatabase } from "../db/connection";

export class SettingsRepository {
  constructor(private readonly db: SqliteDatabase) {}

  getAll(): Record<string, string> {
    const rows = this.db
      .prepare("SELECT key, value FROM settings ORDER BY key")
      .all() as Array<{ key: string; value: string }>;

    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }

  update(values: Record<string, string>): void {
    const statement = this.db.prepare(
      "INSERT INTO settings (key, value) VALUES (@key, @value) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    );

    const updateMany = this.db.transaction(() => {
      for (const [key, value] of Object.entries(values)) {
        statement.run({ key, value });
      }
    });

    updateMany();
  }
}
