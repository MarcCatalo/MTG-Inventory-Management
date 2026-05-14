import { ArrowLeft, Moon, Plus, RefreshCw, Settings, ShoppingCart, Store, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { addCartItem, removeCartItem, updateCartQuantity, type CartItem } from "../features/customer/cart";
import { CustomerCardDetailPage } from "../features/customer/CustomerCardDetailPage";
import { CustomerCartPage } from "../features/customer/CustomerCartPage";
import { CustomerCatalogPage } from "../features/customer/CustomerCatalogPage";
import { type CustomerCatalogItem } from "../features/customer/catalog";
import { sampleCatalog } from "../features/customer/sampleCatalog";
import { AddCardPanel } from "../features/inventory/AddCardPanel";
import { InventoryPage } from "../features/inventory/InventoryPage";
import { SalesLogPage } from "../features/sales/SalesLogPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { fetchSettings, updateSettings } from "./apiClient";

type Page = "Inventory" | "Sales Log" | "Import Review" | "Customer Catalog" | "Customer Cart" | "Settings";

const pages: Page[] = ["Inventory", "Sales Log", "Import Review", "Customer Catalog", "Customer Cart", "Settings"];

export function App() {
  const [page, setPage] = useState<Page>("Inventory");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);
  const [defaultMultiplier, setDefaultMultiplier] = useState("50");
  const [customerCards, setCustomerCards] = useState<CustomerCatalogItem[]>(sampleCatalog);
  const [selectedCustomerListingId, setSelectedCustomerListingId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? "dark" : "light";
  }, [isDarkMode]);

  useEffect(() => {
    fetchSettings()
      .then((settings) => {
        setDefaultMultiplier(settings.default_multiplier);
        setIsDarkMode(settings.theme === "dark");
      })
      .catch(() => undefined);
  }, []);

  async function handleThemeChange(nextDarkMode: boolean) {
    setIsDarkMode(nextDarkMode);
    try {
      await updateSettings({ theme: nextDarkMode ? "dark" : "light" });
    } catch {
      // The Settings page save button remains the source of truth if the local API is unavailable.
    }
  }

  const actions = useMemo(() => {
    if (page === "Inventory") {
      return (
        <div className="top-actions" aria-label="Inventory actions">
          <button
            className="button button-primary"
            onClick={() => setIsAddCardOpen(true)}
            type="button"
          >
            <Plus size={16} />
            Add Card
          </button>
          <button
            className="button"
            onClick={() => window.dispatchEvent(new Event("inventory:import"))}
            type="button"
          >
            <Upload size={16} />
            Import CSV
          </button>
          <button
            className="button"
            onClick={() => window.dispatchEvent(new Event("inventory:refresh"))}
            type="button"
          >
            <RefreshCw size={16} />
            Refresh Prices
          </button>
        </div>
      );
    }

    if (page === "Customer Catalog") {
      return (
        <div className="top-actions" aria-label="Customer catalog actions">
          <button className="button" onClick={() => setPage("Customer Cart")} type="button">
            <ShoppingCart size={16} />
            View cart
          </button>
        </div>
      );
    }

    if (page === "Customer Cart") {
      return (
        <div className="top-actions" aria-label="Customer cart actions">
          <button
            className="button"
            onClick={() => {
              setSelectedCustomerListingId(null);
              setPage("Customer Catalog");
            }}
            type="button"
          >
            <ArrowLeft size={16} />
            Continue browsing
          </button>
        </div>
      );
    }

    return null;
  }, [page]);

  function openCustomerDetails(listingId: string) {
    setSelectedCustomerListingId(listingId);
    setPage("Customer Catalog");
  }

  function addCustomerCartItem(item: Omit<CartItem, "quantity">) {
    setCart((currentCart) => addCartItem(currentCart, item));
  }

  const pageTitle = selectedCustomerListingId && page === "Customer Catalog" ? "Card Details" : page;

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <strong>MTG Inventory</strong>
            <span>Scryfall / TCGPlayer reference</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Sections">
          {pages.map((item) => (
            <button
              className={item === page ? "nav-item active" : "nav-item"}
              key={item}
              onClick={() => {
                setSelectedCustomerListingId(null);
                setPage(item);
              }}
              type="button"
            >
              {item === "Settings" ? <Settings size={16} /> : null}
              {item === "Customer Catalog" ? <Store size={16} /> : null}
              {item === "Customer Cart" ? <ShoppingCart size={16} /> : null}
              {item}
            </button>
          ))}
        </nav>

        <label className="theme-toggle">
          <Moon size={16} />
          <span>Dark mode</span>
          <input
            aria-label="Quick dark mode"
            checked={isDarkMode}
            onChange={(event) => void handleThemeChange(event.target.checked)}
            role="switch"
            type="checkbox"
          />
        </label>
      </aside>

      <main className="workspace">
        <header className="page-header">
          <div>
            <p className="eyebrow">Local browser app</p>
            <h1>{pageTitle}</h1>
          </div>
          {actions}
        </header>

        {page === "Inventory" ? (
          <InventoryPage refreshKey={inventoryRefreshKey} />
        ) : null}
        {page === "Settings" ? (
          <SettingsPage
            isDarkMode={isDarkMode}
            setIsDarkMode={handleThemeChange}
            onSettingsSaved={(settings) => {
              setDefaultMultiplier(settings.default_multiplier);
              setIsDarkMode(settings.theme === "dark");
            }}
          />
        ) : null}
        {page === "Sales Log" ? (
          <SalesLogPage />
        ) : null}
        {page === "Customer Catalog" && !selectedCustomerListingId ? (
          <CustomerCatalogPage
            cards={customerCards}
            onCatalogLoaded={setCustomerCards}
            onAddToCart={addCustomerCartItem}
            onViewDetails={openCustomerDetails}
          />
        ) : null}
        {page === "Customer Catalog" && selectedCustomerListingId ? (
          <CustomerCardDetailPage
            cards={customerCards}
            listingId={selectedCustomerListingId}
            onAddToCart={addCustomerCartItem}
            onBackToCatalog={() => setSelectedCustomerListingId(null)}
            onViewDetails={openCustomerDetails}
          />
        ) : null}
        {page === "Customer Cart" ? (
          <CustomerCartPage
            cart={cart}
            onQuantityChange={(itemId, quantity) =>
              setCart((currentCart) => updateCartQuantity(currentCart, itemId, quantity))
            }
            onRemove={(itemId) => setCart((currentCart) => removeCartItem(currentCart, itemId))}
          />
        ) : null}
        {page === "Import Review" ? (
          <PlaceholderPage
            title="CSV review queue"
            text="Ambiguous or unresolved import rows will land here so valid rows can still import immediately."
          />
        ) : null}
      </main>
      {isAddCardOpen ? (
        <AddCardPanel
          defaultMultiplier={defaultMultiplier}
          onClose={() => setIsAddCardOpen(false)}
          onSaved={() => {
            setIsAddCardOpen(false);
            setInventoryRefreshKey((value) => value + 1);
          }}
        />
      ) : null}
    </div>
  );
}

function PlaceholderPage({ title, text }: { title: string; text: string }) {
  return (
    <section className="panel empty-state">
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}
