# MTG Customer Catalog Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working customer-side catalog dashboard and simple cart inside the same app shell intended for the admin/reseller inventory manager.

**Architecture:** Start with a React/Vite web app that has separated customer routes and an admin-style shell. Customer catalog behavior is implemented through focused domain helpers and local sample data so the UI can work before the full API/database foundation exists. The helper interfaces mirror the future customer API query shape from the spec.

**Tech Stack:** TypeScript, React, Vite, Vitest, Testing Library, React Router, Lucide React.

---

## File Structure

```text
package.json
pnpm-workspace.yaml
tsconfig.base.json
apps/
  web/
    package.json
    index.html
    tsconfig.json
    vite.config.ts
    vitest.config.ts
    src/
      main.tsx
      app/
        App.tsx
        App.test.tsx
      components/
        Shell.tsx
      styles/
        global.css
      features/
        admin/
          AdminDashboardPlaceholder.tsx
        customer/
          catalog.ts
          catalog.test.ts
          cart.ts
          cart.test.ts
          sampleCatalog.ts
          CustomerCatalogPage.tsx
          CustomerCardDetailPage.tsx
          CustomerCartPage.tsx
```

## Task 1: Scaffold Web Workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `apps/web/package.json`
- Create: `apps/web/index.html`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/vitest.config.ts`
- Modify: `.gitignore`

- [x] Create a pnpm monorepo with one React/Vite web app.
- [x] Add scripts for `dev`, `build`, `test`, and `typecheck`.
- [x] Install dependencies.
- [x] Run `pnpm install`.

## Task 2: Customer Catalog Domain

**Files:**
- Create: `apps/web/src/features/customer/catalog.test.ts`
- Create: `apps/web/src/features/customer/catalog.ts`
- Create: `apps/web/src/features/customer/sampleCatalog.ts`

- [x] Write failing tests for search normalization, combined filters, sorting, pagination, and suggestions.
- [x] Run `pnpm --filter @mtg-inventory/web test -- --run catalog`.
- [x] Implement customer catalog filtering against local sample data.
- [x] Run the catalog tests until they pass.

## Task 3: Customer Cart Domain

**Files:**
- Create: `apps/web/src/features/customer/cart.test.ts`
- Create: `apps/web/src/features/customer/cart.ts`

- [x] Write failing tests for adding items, merging duplicate items, quantity clamping, removing items, and totals.
- [x] Run `pnpm --filter @mtg-inventory/web test -- --run cart`.
- [x] Implement cart helpers.
- [x] Run the cart tests until they pass.

## Task 4: Admin-Consistent Customer UI

**Files:**
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/app/App.tsx`
- Create: `apps/web/src/app/App.test.tsx`
- Create: `apps/web/src/components/Shell.tsx`
- Create: `apps/web/src/features/admin/AdminDashboardPlaceholder.tsx`
- Create: `apps/web/src/features/customer/CustomerCatalogPage.tsx`
- Create: `apps/web/src/features/customer/CustomerCardDetailPage.tsx`
- Create: `apps/web/src/features/customer/CustomerCartPage.tsx`
- Create: `apps/web/src/styles/global.css`

- [x] Write a failing app test that verifies customer catalog, filters, grid/table toggle, detail navigation, and cart route render.
- [x] Implement the app shell using the same dense Operator Console visual direction as the admin/reseller spec.
- [x] Keep admin-facing files under `apps/web/src/features/admin`, customer-facing files under `apps/web/src/features/customer`, and shared layout under `apps/web/src/components` or `apps/web/src/app`.
- [x] Implement customer catalog, card detail, and cart pages.
- [x] Run component tests until they pass.

## Task 5: Verification

- [x] Run `pnpm --filter @mtg-inventory/web test -- --run`.
- [x] Run `pnpm --filter @mtg-inventory/web build`.
- [x] Start the dev server and verify the customer pages respond locally.
- [x] Commit the implementation.

## Scope Notes

This first slice intentionally does not build the backend catalog API, checkout, payments, account verification, or real stock reservation. It creates the working customer dashboard flow and domain behavior that the later API/database work can plug into.
