import { Moon, Plus, RefreshCw, Settings, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AddCardPanel } from "../features/inventory/AddCardPanel";
import { InventoryPage } from "../features/inventory/InventoryPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { fetchSettings, updateSettings } from "./apiClient";

type Page = "Inventory" | "Sales Log" | "Import Review" | "Settings";

const pages: Page[] = ["Inventory", "Sales Log", "Import Review", "Settings"];

export function App() {
  const [page, setPage] = useState<Page>("Inventory");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);
  const [defaultMultiplier, setDefaultMultiplier] = useState("50");

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
    if (page !== "Inventory") {
      return null;
    }

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
  }, [page]);

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
              onClick={() => setPage(item)}
              type="button"
            >
              {item === "Settings" ? <Settings size={16} /> : null}
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
            onChange={(event) => setIsDarkMode(event.target.checked)}
            role="switch"
            type="checkbox"
          />
        </label>
      </aside>

      <main className="workspace">
        <header className="page-header">
          <div>
            <p className="eyebrow">Local browser app</p>
            <h1>{page}</h1>
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
          <PlaceholderPage
            title="Sales batches will appear here"
            text="This view will audit single-lot and bulk sales with suggested totals, actual totals, and realized PHP P&L."
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
