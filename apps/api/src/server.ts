import { createApp } from "./app";
import { createDatabase } from "./db/connection";
import { runMigrations } from "./db/migrations";

const port = Number(process.env.PORT ?? 4000);
const db = createDatabase(process.env.DATABASE_PATH);

runMigrations(db);

createApp(db).listen(port, "127.0.0.1", () => {
  console.log(`MTG Inventory API listening on http://localhost:${port}`);
});
