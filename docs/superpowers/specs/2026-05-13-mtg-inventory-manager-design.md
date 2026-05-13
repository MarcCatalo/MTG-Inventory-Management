# MTG Inventory Manager Design Spec

Date: 2026-05-13
Status: Approved for implementation planning
Source PRD: `D:/Downloads/PRD_MTG_Inventory_Manager.md`

## 1. Product Goal

Build a browser-run, locally hosted web app for managing Magic: The Gathering singles inventory, market reference prices, PHP catalog pricing, sales, and profit/loss. The app is for a solo seller in the Philippines and should support the full PRD v1.0 scope rather than an intentionally reduced MVP.

The app should feel like an Operator Console with Collector Ledger detail: dense, fast, table-first, and reliable for daily inventory work, while still showing enough card imagery and metadata to verify exact printings.

## 2. Core Decisions

- App type: local browser web app, not Electron.
- Architecture: monorepo full-stack TypeScript.
- Frontend: React + Vite + TypeScript.
- Backend: local Node API bound to `localhost`.
- Database: SQLite for v1, accessed through repositories so a later database service can replace it.
- Active card and price provider: Scryfall.
- Future pricing provider: direct TCGPlayer API if credentials become available.
- Authentication: none for v1; keep backend localhost-only.
- Theme: light and dark mode, persisted in settings.
- Layout: desktop-first but responsive across common browser sizes.

## 3. Monorepo Shape

Recommended structure:

```text
apps/
  web/              React/Vite UI
  api/              Local backend API
packages/
  shared/           Shared TypeScript types, validation schemas, constants
data/               Local SQLite database location, ignored by git
docs/
  superpowers/
    specs/
```

The frontend must not access SQLite directly. It calls local API routes. The backend owns persistence, Scryfall access, price refresh logic, import/export, backups, and business calculations.

## 4. Backend Domain Modules

- `InventoryService`: acquisition lots, edits, deletes, sold-out handling, summaries.
- `CardCatalogService`: Scryfall search, fuzzy match, exact printing selection, card metadata normalization.
- `PricingService`: price provider selection, Scryfall pricing, stale detection, refresh scopes, price snapshots.
- `SalesService`: single-lot and bulk sale logging, quantity deduction, P&L snapshots.
- `ImportService`: CSV upload, column mapping, preview, validation, review queue, row import.
- `SettingsService`: defaults, theme, refresh interval, provider config.
- `BackupService`: CSV exports, SQLite backup, restore.

Routes validate input, services hold business rules, repositories handle database access, and provider clients isolate external APIs.

## 5. Data Model

### 5.1 `inventory_lots`

Inventory rows represent acquisition lots, not unique card variants. The same card/set/condition/foil/language can appear multiple times when bought at different prices or dates.

Key fields:

- `id`
- `scryfall_id`
- `oracle_id`
- `tcgplayer_id`
- `card_name`
- `set_code`
- `set_name`
- `collector_number`
- `rarity`
- `color_identity`
- `image_uris`
- `condition`
- `foil_type`: `nonfoil`, `foil`, `etched`
- `language`
- `qty`
- `buy_price_php_per_copy`
- `purchase_date`
- `multiplier`
- `market_price_usd`
- `suggested_price_php`
- `price_last_updated`
- `notes`
- `is_sold_out`
- `created_at`
- `updated_at`

### 5.2 `price_history`

Stores every price fetch attempt or snapshot.

Key fields:

- `id`
- `inventory_lot_id`
- `provider`: `scryfall` for v1
- `provider_label`
- `price_metric`
- `market_price_usd`
- `multiplier_used`
- `suggested_price_php_raw`
- `suggested_price_php_rounded`
- `foil_type`
- `fetched_at`
- `status`: `success`, `missing_price`, `failed`
- `error_message`

### 5.3 `sales`

Sale batch/header for single-lot or multi-lot sales.

Key fields:

- `id`
- `sell_date`
- `buyer_or_channel`
- `notes`
- `actual_total_php`
- `suggested_total_php`
- `realized_pnl_php`
- `created_at`

### 5.4 `sale_items`

Line items under a sale batch.

Key fields:

- `id`
- `sale_id`
- `inventory_lot_id`
- `card_name`
- `set_code`
- `condition`
- `foil_type`
- `qty_sold`
- `buy_price_php_per_copy`
- `market_price_usd_at_sale`
- `multiplier_used`
- `suggested_price_php_per_copy`
- `actual_sell_price_php_per_copy`
- `realized_pnl_php`
- `notes`

### 5.5 `settings`

Key-value or structured settings table.

Required settings:

- `default_multiplier`
- `price_refresh_hours`
- `default_language`
- `default_condition`
- `theme`: `light`, `dark`, or `system`
- `price_provider`: active value `scryfall`
- `future_tcgplayer_enabled`: false unless credentials exist

### 5.6 Import Tables

`import_batches` tracks each CSV import. `import_rows` stores row-level parsed data, validation status, selected Scryfall printing, and review state.

Import row statuses include:

- `ready`
- `imported`
- `needs_printing`
- `missing_required_field`
- `invalid_quantity`
- `price_unavailable`
- `failed`

## 6. Business Rules

### 6.1 Buy Price

Buy price is manually entered in PHP per copy. It is the real cost basis for P&L calculations.

### 6.2 Market Price

Scryfall is the active v1 provider. The app uses Scryfall price fields as a TCGPlayer USD reference:

- Non-foil: `prices.usd`
- Foil: `prices.usd_foil`
- Etched: `prices.usd_etched`

The UI should label this honestly as Scryfall/TCGPlayer USD reference pricing. Direct TCGPlayer API support is a future provider slot because credentials are not available.

### 6.3 Suggested Sell Price

Suggested PHP sell price:

```text
raw = market_price_usd * multiplier
suggested = round raw to nearest 10 PHP
```

Rounding rule:

- Ones digit `0-4` rounds down.
- Ones digit `5-9` rounds up.

Examples:

- `354 -> 350`
- `355 -> 360`
- `356 -> 360`
- `360 -> 360`
- `364 -> 360`
- `365 -> 370`

Store both raw and rounded values in price snapshots.

### 6.4 P&L

Unrealized P&L per active copy:

```text
suggested_price_php - buy_price_php_per_copy
```

Realized P&L per sold copy:

```text
actual_sell_price_php_per_copy - buy_price_php_per_copy
```

Line total:

```text
per_copy_pnl * qty_sold
```

Sale batch total:

```text
sum(sale_item.realized_pnl_php)
```

### 6.5 Sales

Sales are logged against specific inventory lots. The app supports:

- Single-lot sale from one row.
- Bulk sale from selected rows.
- Manual lot selection.
- Shared sale date and optional buyer/channel note.
- Per-line quantity and actual sell price.
- Defaults from rounded suggested price.
- Override of actual sell price when needed.

Selling reduces lot quantity. If quantity reaches `0`, mark the lot sold out and preserve it for history.

### 6.6 Price Refresh

Prices older than the configured refresh interval are marked stale. The app does not automatically refresh all stale prices on startup.

Refresh scopes:

- Primary button refreshes current filtered view.
- Selected rows can be refreshed.
- Menu action refreshes all active inventory.
- Card detail can refresh one lot.

Refresh progress should show queued, updated, missing price, and failed counts.

### 6.7 CSV Import

CSV import flow:

1. Upload.
2. Map columns.
3. Preview.
4. Confirm.
5. Import valid rows.
6. Send unresolved or ambiguous rows to Import Review.

One bad row must not block a valid batch.

Accepted columns should include flexible mappings for:

- `card_name`
- `set_code`
- `collector_number`
- `condition`
- `foil`
- `language`
- `qty`
- `buy_price_php`
- `purchase_date`
- `multiplier`
- `notes`

## 7. User Experience

### 7.1 Navigation

Top-level areas:

- Inventory
- Sales Log
- Import Review
- Settings

Task flows:

- Add Card: slide-out panel or modal.
- Log Sale: modal.
- Bulk Log Sale: modal or short wizard.
- CSV Import: wizard.
- Card Detail: detail page or side panel.

### 7.2 Inventory

The Inventory view is the primary screen.

Required capabilities:

- Summary bar with total active lots/cards, total copies, buy cost PHP, portfolio value PHP, unrealized P&L, realized P&L.
- Dense sortable/filterable/searchable table.
- Pagination or virtualization for large catalogs.
- Sold-out rows hidden by default.
- Include Sold Out toggle.
- Muted visual style for sold-out rows when shown.
- Row selection for bulk actions.
- Hover image preview on card name.
- Click to open detail.
- Inline editing for safe fields: condition, qty, purchase date, multiplier, buy price PHP, notes.
- Actions: Add Card, Import CSV, Refresh Prices, Log Sale, Bulk Log Sale, Edit, Delete.

### 7.3 Add Card

Manual add flow:

1. User types card name.
2. App uses Scryfall fuzzy/quick match.
3. App shows exact printings.
4. User confirms or changes exact printing.
5. Printing fills metadata and image.
6. User enters condition, foil, language, quantity, PHP buy price per copy, purchase date, multiplier, and notes.
7. Save creates an acquisition lot and initial price snapshot.

Printing selector should show set, collector number, rarity, foil availability, and image thumbnail.

### 7.4 Card Detail

Card detail includes:

- Full card image.
- Full metadata.
- Lot/accounting fields.
- Price history table or chart-ready data.
- Sale history for that lot.
- Manual refresh for that lot.

### 7.5 Sales Log

Sales Log includes:

- Sale batches.
- Expandable line items.
- Suggested total vs actual total.
- P&L per line.
- P&L per batch.
- Filters by date, card, profit/loss, channel.

### 7.6 Import Review

Import Review includes unresolved rows from CSV imports. User can fix fields, search/select exact printing, and import rows individually or in groups.

### 7.7 Settings

Settings includes:

- Default multiplier.
- Price refresh interval.
- Default language.
- Default condition.
- Theme/dark mode toggle.
- Active price provider display.
- Future TCGPlayer credential fields, disabled or clearly marked until credentials exist.
- Export inventory CSV.
- Export sales CSV.
- Export price history CSV.
- Full database backup.
- Full database restore with confirmation.

## 8. Responsive Design Requirements

The app is desktop-first but must adapt to browser size.

- Desktop: full table, summary bar, filters, side panels.
- Tablet: condensed columns, stacked filters, safe horizontal table scroll where needed.
- Narrow/mobile: usable fallback layouts, such as card/list rows for inventory instead of unreadable tables.
- Modals and panels resize safely.
- Text and controls must not overlap.
- Light and dark themes must both be polished.

## 9. API Design

Representative endpoints:

```text
GET    /api/inventory
POST   /api/inventory
PATCH  /api/inventory/:id
DELETE /api/inventory/:id
POST   /api/inventory/:id/refresh-price
POST   /api/prices/refresh

GET    /api/cards/search?q=...
GET    /api/cards/prints?name=...
GET    /api/cards/:scryfallId

POST   /api/sales
GET    /api/sales
GET    /api/sales/:id

POST   /api/imports/csv
GET    /api/imports/:id
PATCH  /api/import-rows/:id
POST   /api/import-rows/:id/import

GET    /api/settings
PATCH  /api/settings

GET    /api/exports/inventory.csv
GET    /api/exports/sales.csv
GET    /api/exports/price-history.csv
POST   /api/backups
POST   /api/restore
```

API responses should use shared typed schemas where practical.

## 10. External API Behavior

Scryfall client requirements:

- Use clear User-Agent.
- Respect rate limits.
- Add delays for bulk CSV lookups.
- Normalize card data into internal card DTOs.
- Return row-level failures for import.
- Treat null prices as missing, not as zero.

Missing price display:

- Show unavailable marker.
- Tooltip or detail message: no Scryfall/TCGPlayer USD reference price available.
- Store missing-price snapshot status when relevant.

## 11. Export, Backup, Restore

CSV exports:

- Inventory
- Sales Log
- Price History

Full backup:

- Export/copy SQLite database file.
- Preserve inventory, sales, settings, price history, import batches, import rows, provider metadata.

Restore:

- Requires explicit confirmation.
- Warns that current local data will be replaced.
- Should validate backup shape before replacing current database where feasible.

## 12. Testing Plan

### 12.1 Unit Tests

- PHP rounding rule.
- Suggested sell price calculation.
- Unrealized P&L.
- Realized P&L.
- Stale price detection.
- Quantity deduction.
- Sold-out marking.
- CSV row validation.
- Import row status assignment.

### 12.2 Backend Tests

- Inventory CRUD.
- Manual add lot creation.
- Price refresh snapshot creation.
- Sale batch with multiple sale items.
- Prevent selling more than available quantity.
- Settings persistence.
- CSV exports.
- Backup/restore safeguards.

### 12.3 Frontend Tests

- Inventory filtering, sorting, and search.
- Add card flow.
- Exact printing selection.
- Single sale modal.
- Bulk sale modal.
- Import preview/review flow.
- Dark mode toggle.
- Responsive desktop/tablet/mobile layouts.

### 12.4 Manual QA

- Add a card from Scryfall.
- Add same card/set/condition twice with different buy prices.
- Refresh price and confirm snapshot.
- Log a partial sale.
- Log a bulk sale.
- Verify sold-out rows hide/show correctly.
- Import CSV with valid and unresolved rows.
- Export CSVs.
- Backup and restore database.

## 13. Acceptance Criteria

- Full PRD v1 feature coverage is represented.
- Buy price is PHP per copy.
- Identical variants can exist as separate acquisition lots.
- Suggested prices use Scryfall USD reference price, multiplier, and nearest-10 PHP rounding.
- Price snapshots store raw and rounded values plus provider metadata.
- P&L math matches manual calculation.
- Scryfall failures and missing prices do not corrupt data.
- Valid CSV rows can import while invalid rows go to review.
- Sold-out rows remain auditable and hidden by default.
- App remains usable with 500+ inventory rows.
- UI is responsive and avoids overlap at common viewport sizes.
- Dark mode is supported.

## 14. Future Enhancements

- Direct TCGPlayer provider with credentials.
- Optional authentication/password.
- Cloud sync or hosted database.
- Multi-user access.
- Marketplace listing exports.
- Wishlist/want list.
- Broader TCG support.
- Richer price history charts.
