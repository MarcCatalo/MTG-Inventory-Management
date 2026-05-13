# MTG Inventory Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full-stack monorepo foundation for the MTG Inventory Manager and then implement the approved PRD features in traceable vertical slices.

**Architecture:** A React/Vite browser app calls a localhost-only Node API. The API owns SQLite persistence, Scryfall integration, business calculations, import/export, backup/restore, and provider boundaries. Shared TypeScript schemas keep frontend and backend aligned.

**Tech Stack:** TypeScript, pnpm workspaces, React, Vite, Express, better-sqlite3, Zod, Vitest, Testing Library, PapaParse, TanStack Table, Lucide React.

---

## File Structure

Create and maintain this structure:

```text
apps/
  api/
    src/
      config/
      db/
      domain/
      providers/
      repositories/
      routes/
      services/
      tests/
      app.ts
      server.ts
  web/
    src/
      app/
      components/
      features/
      lib/
      styles/
      test/
      main.tsx
packages/
  shared/
    src/
      constants.ts
      schemas.ts
      pricing.ts
      types.ts
      index.ts
docs/
  superpowers/
    specs/
    plans/
data/
```

Responsibilities:

- `packages/shared`: domain constants, Zod schemas, DTO types, pricing math.
- `apps/api/src/db`: SQLite connection, migrations, seed/default settings.
- `apps/api/src/repositories`: data access only.
- `apps/api/src/services`: business logic only.
- `apps/api/src/providers`: Scryfall and future pricing provider clients.
- `apps/api/src/routes`: HTTP endpoints and request/response validation.
- `apps/web/src/features`: UI by product area: inventory, sales, imports, settings, card detail.
- `apps/web/src/components`: reusable UI primitives.

## Task 1: Scaffold Monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `README.md`
- Modify: `.gitignore`

- [ ] **Step 1: Create workspace metadata**

Create root package metadata with scripts:

```json
{
  "name": "mtg-inventory-manager",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "pnpm --parallel dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  },
  "devDependencies": {
    "@types/node": "^22.15.18",
    "typescript": "^5.8.3",
    "vitest": "^3.1.3"
  },
  "packageManager": "pnpm@10.11.0"
}
```

- [ ] **Step 2: Create workspace and TypeScript config**

`pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true
  }
}
```

- [ ] **Step 3: Install dependencies**

Run:

```powershell
pnpm install
```

Expected: lockfile is created and dependencies install successfully.

- [ ] **Step 4: Commit**

Run:

```powershell
git add package.json pnpm-workspace.yaml tsconfig.base.json README.md .gitignore pnpm-lock.yaml
git commit -m "chore: scaffold monorepo workspace"
```

## Task 2: Shared Domain Package

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/constants.ts`
- Create: `packages/shared/src/pricing.ts`
- Create: `packages/shared/src/schemas.ts`
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/pricing.test.ts`

- [ ] **Step 1: Write pricing tests**

`pricing.test.ts` must prove:

```ts
expect(roundPhpToNearestTen(354)).toBe(350);
expect(roundPhpToNearestTen(355)).toBe(360);
expect(calculateSuggestedPricePhp(6.25, 57)).toEqual({
  raw: 356.25,
  rounded: 360
});
expect(calculateRealizedPnlPhp(500, 350, 2)).toBe(300);
```

- [ ] **Step 2: Run failing shared tests**

Run:

```powershell
pnpm --filter @mtg-inventory/shared test
```

Expected: fails because pricing functions do not exist yet.

- [ ] **Step 3: Implement constants, schemas, types, and pricing**

Implement enums for conditions, foil types, languages, themes, import statuses, price providers, and route DTO schemas. Implement pricing helpers:

```ts
export function roundPhpToNearestTen(value: number): number {
  return Math.round(value / 10) * 10;
}

export function calculateSuggestedPricePhp(marketPriceUsd: number, multiplier: number) {
  const raw = Number((marketPriceUsd * multiplier).toFixed(2));
  return { raw, rounded: roundPhpToNearestTen(raw) };
}

export function calculateRealizedPnlPhp(
  actualSellPricePhpPerCopy: number,
  buyPricePhpPerCopy: number,
  qtySold: number
): number {
  return Number(((actualSellPricePhpPerCopy - buyPricePhpPerCopy) * qtySold).toFixed(2));
}
```

- [ ] **Step 4: Run passing shared tests**

Run:

```powershell
pnpm --filter @mtg-inventory/shared test
```

Expected: all shared tests pass.

- [ ] **Step 5: Commit**

Run:

```powershell
git add packages/shared
git commit -m "feat: add shared domain model and pricing rules"
```

## Task 3: API Skeleton and SQLite Foundation

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/db/connection.ts`
- Create: `apps/api/src/db/migrations.ts`
- Create: `apps/api/src/db/schema.sql`
- Create: `apps/api/src/routes/healthRoutes.ts`
- Create: `apps/api/src/routes/settingsRoutes.ts`
- Create: `apps/api/src/repositories/settingsRepository.ts`
- Create: `apps/api/src/services/settingsService.ts`
- Create: `apps/api/src/tests/settings.test.ts`

- [ ] **Step 1: Write settings persistence tests**

Tests must assert default settings are inserted and updating `default_multiplier`, `theme`, and `price_refresh_hours` persists.

- [ ] **Step 2: Run failing API tests**

Run:

```powershell
pnpm --filter @mtg-inventory/api test
```

Expected: fails before API files exist.

- [ ] **Step 3: Implement Express app and SQLite schema**

Create tables from the spec:

```sql
inventory_lots, price_history, sales, sale_items, settings, import_batches, import_rows
```

Seed default settings:

```text
default_multiplier=57
price_refresh_hours=24
default_language=en
default_condition=NM
theme=system
price_provider=scryfall
future_tcgplayer_enabled=false
```

- [ ] **Step 4: Implement health and settings routes**

Routes:

```text
GET /api/health
GET /api/settings
PATCH /api/settings
```

- [ ] **Step 5: Run passing API tests**

Run:

```powershell
pnpm --filter @mtg-inventory/api test
```

Expected: settings tests pass.

- [ ] **Step 6: Commit**

Run:

```powershell
git add apps/api data .gitignore
git commit -m "feat: add local api and sqlite settings foundation"
```

## Task 4: Inventory, Pricing, and Scryfall API Slice

**Files:**
- Create: `apps/api/src/providers/scryfallClient.ts`
- Create: `apps/api/src/services/pricingService.ts`
- Create: `apps/api/src/services/inventoryService.ts`
- Create: `apps/api/src/repositories/inventoryRepository.ts`
- Create: `apps/api/src/repositories/priceHistoryRepository.ts`
- Create: `apps/api/src/routes/cardRoutes.ts`
- Create: `apps/api/src/routes/inventoryRoutes.ts`
- Create: `apps/api/src/routes/priceRoutes.ts`
- Create: `apps/api/src/tests/inventory-pricing.test.ts`

- [ ] **Step 1: Write inventory and pricing tests**

Tests must assert:

- Creating a lot stores PHP buy price per copy.
- Identical card variants can exist as separate lots.
- Missing Scryfall prices are stored as `missing_price`, not zero.
- Refresh creates price history with raw and rounded PHP values.

- [ ] **Step 2: Implement Scryfall provider**

Provider methods:

```ts
searchNames(query: string)
searchPrints(name: string)
getCardById(scryfallId: string)
getPriceForFoilType(card, foilType)
```

Use a descriptive User-Agent and treat null price fields as missing.

- [ ] **Step 3: Implement routes**

Routes:

```text
GET /api/cards/search
GET /api/cards/prints
GET /api/cards/:scryfallId
GET /api/inventory
POST /api/inventory
PATCH /api/inventory/:id
DELETE /api/inventory/:id
POST /api/inventory/:id/refresh-price
POST /api/prices/refresh
```

- [ ] **Step 4: Run tests and commit**

Run:

```powershell
pnpm --filter @mtg-inventory/api test
git add apps/api packages/shared
git commit -m "feat: add inventory lots and scryfall price snapshots"
```

## Task 5: Sales Slice

**Files:**
- Create: `apps/api/src/repositories/salesRepository.ts`
- Create: `apps/api/src/services/salesService.ts`
- Create: `apps/api/src/routes/salesRoutes.ts`
- Create: `apps/api/src/tests/sales.test.ts`

- [ ] **Step 1: Write sales tests**

Tests must assert:

- Sale cannot sell more than available quantity.
- Partial sale deducts quantity and keeps lot active.
- Full sale marks lot sold out.
- Bulk sale creates one sale batch with multiple sale items.
- Realized P&L uses actual sell price PHP and buy price PHP per copy.

- [ ] **Step 2: Implement sales service and routes**

Routes:

```text
POST /api/sales
GET /api/sales
GET /api/sales/:id
```

- [ ] **Step 3: Run tests and commit**

Run:

```powershell
pnpm --filter @mtg-inventory/api test
git add apps/api
git commit -m "feat: add sales logging and lot quantity accounting"
```

## Task 6: Web App Shell and Inventory UI

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/app/App.tsx`
- Create: `apps/web/src/app/apiClient.ts`
- Create: `apps/web/src/styles/global.css`
- Create: `apps/web/src/features/inventory/InventoryPage.tsx`
- Create: `apps/web/src/features/inventory/AddCardPanel.tsx`
- Create: `apps/web/src/features/inventory/InventoryTable.tsx`
- Create: `apps/web/src/features/settings/SettingsPage.tsx`

- [ ] **Step 1: Write component tests for shell**

Tests must assert navigation renders Inventory, Sales Log, Import Review, and Settings; dark mode can be toggled; Inventory summary placeholders render without overlap-prone fixed widths.

- [ ] **Step 2: Implement responsive app shell**

Implement top nav, theme variables, responsive layout, and Inventory page with summary bar, toolbar, filters, and table shell.

- [ ] **Step 3: Implement Add Card panel wired to card search endpoints**

The first iteration should support search, exact printing selection display, and save lot request.

- [ ] **Step 4: Run tests and commit**

Run:

```powershell
pnpm --filter @mtg-inventory/web test
pnpm --filter @mtg-inventory/web build
git add apps/web packages/shared
git commit -m "feat: add responsive inventory web shell"
```

## Task 7: Sales, Import, Export, Backup, and Polish

**Files:**
- Add feature files under `apps/web/src/features/sales`
- Add feature files under `apps/web/src/features/imports`
- Add feature files under `apps/web/src/features/settings`
- Add matching API routes/services/repositories for import/export/backup

- [ ] **Step 1: Implement Sales Log and bulk sale modal**

Cover single-row and selected-row sale flows.

- [ ] **Step 2: Implement CSV import wizard and Import Review**

Use PapaParse, column mapping, preview, row-level validation, and review queue.

- [ ] **Step 3: Implement CSV exports and database backup/restore**

Add inventory, sales, price history exports, full database backup, and guarded restore.

- [ ] **Step 4: Add responsive and manual QA checks**

Check desktop, tablet, and narrow browser layouts. Confirm no text/control overlap in light or dark mode.

- [ ] **Step 5: Run full verification and commit**

Run:

```powershell
pnpm test
pnpm build
git add apps packages docs
git commit -m "feat: complete inventory manager v1 workflows"
```

## Verification Before Completion

Before claiming v1 is complete, run:

```powershell
pnpm test
pnpm build
pnpm typecheck
```

Then manually verify:

- Add card from Scryfall.
- Add same variant twice with different buy prices.
- Refresh price and confirm snapshot.
- Log partial sale.
- Log bulk sale.
- Hide/show sold-out lots.
- Import CSV with valid and unresolved rows.
- Export CSVs.
- Backup and restore a test database.

## Spec Coverage Self-Review

This plan covers:

- Monorepo structure and local browser architecture.
- Shared pricing rules and PHP cost basis.
- SQLite schema and settings.
- Acquisition-lot inventory model.
- Scryfall provider and future provider boundary.
- Price snapshots, stale price behavior, and refresh scopes.
- Single and bulk sales with lot-level accounting.
- Responsive Operator Console UI with dark mode.
- CSV import, review queue, exports, backup, and restore.

No spec gaps are intentionally deferred. Task 7 is broad and should be split into smaller execution plans if the first implementation pass needs tighter checkpoints.
