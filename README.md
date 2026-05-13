# MTG Inventory Manager

A local browser app for managing Magic: The Gathering singles inventory, Scryfall/TCGPlayer reference pricing, PHP catalog prices, sales, and profit/loss.

## Project Shape

- `apps/web`: React + Vite browser UI
- `apps/api`: localhost-only Node API
- `packages/shared`: shared types, schemas, constants, and pricing rules
- `docs/superpowers`: approved design spec and implementation plans

## Development

Use `pnpm.cmd` in PowerShell on this machine because PowerShell script execution blocks the `pnpm.ps1` shim.

```powershell
pnpm.cmd install
pnpm.cmd dev
pnpm.cmd test
pnpm.cmd build
```
