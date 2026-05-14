# MTG Customer Catalog Dashboard Design Spec

Date: 2026-05-14
Status: Draft for review
Related admin/reseller spec: `docs/superpowers/specs/2026-05-13-mtg-inventory-manager-design.md`

## 1. Product Goal

Add a customer-facing catalog dashboard inside the same local browser app as the MTG Inventory Manager. The customer side lets buyers browse available Magic: The Gathering singles, inspect card details, add cards to a simple cart, and review cart contents.

This is a development-only customer surface for now. It does not include deployment, customer accounts, checkout, payment, order submission, shipping, or stock reservation.

## 2. Relationship To Admin/Reseller Inventory

The existing admin/reseller side remains the source of truth for inventory, acquisition lots, buy prices, pricing refreshes, sales logging, CSV import, backup/restore, and profit/loss.

The customer-side catalog is a buyer-facing projection of admin inventory. It must not expose reseller-only fields such as:

- Buy price.
- Acquisition lot details.
- Purchase source or internal notes.
- Profit/loss.
- Sales history.
- Import metadata.
- Price history internals.

The customer side should reuse existing card metadata, images, set data, condition, printing, price, and stock fields where possible. Future account verification and role distinction can later gate admin/reseller routes separately from customer routes.

## 3. Customer Catalog Listing Rules

Customer listings are merged by customer-visible sellable identity, not by acquisition lot.

A customer-facing listing should group active inventory by:

- Exact card identity or Scryfall printing identity.
- Card name.
- Set code and set name.
- Collector number.
- Printing or finish, such as nonfoil, foil, or etched.
- Language.
- Condition.
- Customer sell price rule.

The customer listing should include:

- Listing id.
- Card name.
- Card image.
- Set code and set name.
- Collector number.
- Rarity.
- Card type.
- Color identity.
- Mana value.
- Printing or finish.
- Condition.
- Customer price in PHP.
- Available quantity.
- Date added, derived from underlying active inventory.

The customer listing should not group or split by buy price, purchase date per lot, internal notes, source lot, or accounting fields.

If multiple underlying lots merge into one customer listing, the customer sees one available quantity and one customer sell price. For this phase, avoid per-lot customer price overrides because they complicate merged listings. If manual customer price overrides are added later, the product must define whether they split customer listings or resolve into one displayed price.

## 4. Customer Routes

Add customer-facing routes inside the existing web app:

```text
/customer
/customer/cards/:listingId
/customer/cart
```

The customer routes should be visually and navigationally distinct from the admin/reseller dashboard, even though they are in the same app for now.

## 5. Customer Dashboard Page

The `/customer` page is the primary browse screen.

Required capabilities:

- Dynamic search field.
- Search suggestions while typing.
- Combined filter controls.
- Price range filter.
- Printing filter.
- Rarity filter.
- Card type filter.
- Color filter.
- Condition filter.
- Set choice filter.
- Stock status filter.
- Grid/table view toggle.
- Sort controls.
- Reset filters.
- Previous/next pagination.
- Clickable cards or rows that open the card detail page.
- Add to cart action from listing results.

All filters must work together from one shared query state. For example, a customer should be able to search for a card name while also filtering by color, rarity, condition, price range, set, stock status, and sort order.

## 6. Search, Filters, Sorting, And Pagination

Search behavior:

- Trim whitespace.
- Collapse repeated spaces.
- Normalize capitalization for case-insensitive matching.
- Suggest similar card names automatically while the user types.
- Do not require pressing Enter for suggestions.
- Validate and sanitize search on the backend before querying.

Filters:

- Price range: minimum and maximum PHP price.
- Printing: nonfoil, foil, etched.
- Rarity: common, uncommon, rare, mythic, and other provider-supported rarity labels where needed.
- Card type: creature, instant, sorcery, artifact, enchantment, planeswalker, land, battle, and other card types where needed.
- Color: white, blue, black, red, green, colorless, multicolor.
- Condition: NM, LP, MP, HP, damaged.
- Set choice: set code or set name.
- Stock: in stock, out of stock, all.

Sort modes:

- Price high to low.
- Price low to high.
- Name A to Z.
- Name Z to A.
- Mana cost high to low.
- Mana cost low to high.
- Date added latest.
- Date added oldest.

Default state:

- Empty search.
- In-stock only.
- Grid view.
- Name A to Z.
- Page 1.
- No filters selected.

Reset filters should clear search and filters, return to page 1, and reset sort to the default. The grid/table view may remain unchanged because it is a viewing preference rather than a catalog filter.

Pagination should start with previous and next buttons plus page count text, such as:

```text
Previous | Page 2 of 8 | Next
```

## 7. Grid View

Grid view is the visual shopping mode.

Each card tile should show:

- Card image.
- Card name.
- Set or printing label.
- Condition.
- Rarity.
- Price.
- Available stock.
- Add to cart button.

The whole card tile should be clickable and open the detail page. The add to cart button should add the card without navigating away.

## 8. Table View

Table view is the compact scanning mode.

Recommended columns:

- Name.
- Set.
- Printing.
- Condition.
- Rarity.
- Color.
- Type.
- Price.
- Stock.
- Add to cart action.

Hovering over a card name or row should show a card image preview. On touch or narrow screens, hover preview is not required; tapping the row should open the detail page.

## 9. Card Detail Page

The `/customer/cards/:listingId` page lets customers inspect a selected listing and nearby available options.

Required content:

- Larger card image.
- Card name.
- Set, collector number, rarity, color, type, and mana metadata.
- Current selected condition and printing.
- Available condition, printing, and set options where in stock.
- Price for selected option.
- Available stock for selected option.
- Quantity selector.
- Add to cart button.

The detail page is the main place to show what conditions, printings, and set choices are available for a card.

## 10. Simple Cart

The cart is intentionally lightweight in this phase.

Required behavior:

- Add a listing from grid view.
- Add a listing from card detail.
- Adding the same listing again increases quantity instead of creating duplicate cart rows.
- Quantity cannot exceed available stock in the UI.
- Customer can view cart contents.
- Customer can change quantity.
- Customer can remove an item.

Cart page content:

- Card thumbnail.
- Card name.
- Set, printing, and condition.
- Unit price.
- Quantity.
- Line total.
- Cart total.

The cart can be stored in frontend state for the first pass. Persisting to `localStorage` is acceptable so the cart survives page refresh, but no backend cart table is required in this phase.

## 11. Customer API Requirements

Add customer-safe catalog endpoints:

```text
GET /api/customer/catalog
GET /api/customer/catalog/suggestions?q=
GET /api/customer/catalog/:listingId
```

`GET /api/customer/catalog` should support:

- `q`
- `minPrice`
- `maxPrice`
- `printing`
- `rarity`
- `cardType`
- `color`
- `condition`
- `set`
- `stock`
- `sort`
- `direction`
- `page`
- `pageSize`

The API should:

- Validate all query parameters.
- Clamp page and page size.
- Use parameterized database queries.
- Return customer-safe fields only.
- Apply filtering, sorting, merging, and pagination consistently.
- Return stable result counts for pagination.

`GET /api/customer/catalog/suggestions?q=` should return similar card names or matching customer-visible listings for the search box.

`GET /api/customer/catalog/:listingId` should return detail data for one merged listing plus related in-stock options for the same card where available.

## 12. Testing Plan

Backend tests:

- Merges matching active inventory lots into one customer listing.
- Does not expose buy price, P&L, internal notes, or lot accounting fields.
- Applies search case-insensitively.
- Sanitizes and validates query parameters.
- Combines multiple filters correctly.
- Sorts by price, name, mana value, and date added.
- Returns stable pagination metadata.
- Returns detail options for available conditions, printings, and sets.

Frontend tests:

- Customer dashboard renders search, filters, grid/table toggle, sort, and pagination.
- Search suggestions appear while typing.
- Filters can be combined.
- Reset filters returns to default query state.
- Grid card add to cart works.
- Table row hover preview can render an image preview on pointer-capable devices.
- Clicking a card or row opens detail.
- Detail page can add selected quantity to cart.
- Cart merges duplicate additions, updates quantities, removes items, and totals prices.

Manual QA:

- Browse catalog in grid view.
- Browse catalog in table view.
- Use multiple filters at the same time.
- Search with inconsistent capitalization and extra spaces.
- Open card detail and switch available options.
- Add cards from grid and detail.
- Confirm cart contents and totals.
- Confirm customer pages do not show admin-only data.
- Check responsive layouts for desktop, tablet, and narrow screens.

## 13. Acceptance Criteria

- Customer catalog exists as a separate route area inside the same app.
- Customer listings are merged by customer-visible sellable identity.
- Admin/reseller acquisition lots remain the source of truth.
- Customer responses do not expose admin-only fields.
- Search suggestions work automatically while typing.
- Search is case-insensitive and sanitized.
- Price, printing, rarity, card type, color, condition, set, and stock filters can be used simultaneously.
- Grid view shows image, name, price, stock, and add to cart.
- Table view shows compact customer-safe listing data and hover image preview.
- Cards and rows open a detail page.
- Detail page shows available condition, printing, and set options.
- Customer can add cards to a simple cart.
- Cart shows item rows, quantities, line totals, and cart total.
- Checkout, payment, order submission, account login, and deployment remain out of scope.

## 14. Out Of Scope For This Phase

- Checkout.
- Payments.
- Order submission.
- Customer accounts.
- Account verification.
- Role-based access control implementation.
- Shipping.
- Discounts.
- Tax logic.
- Stock reservation.
- Public deployment.
- Email or messaging notifications.

## 15. Future Enhancements

- Customer account registration and verification.
- Role-based routing between customer and admin/reseller views.
- Backend-persisted cart.
- Order submission workflow.
- Admin order review and fulfillment.
- Stock reservation during checkout.
- Payment integration.
- Shipping and pickup options.
- Customer wishlist.
- Saved searches.
- Public hosted storefront.
