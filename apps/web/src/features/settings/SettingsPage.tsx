import type { Settings } from "@mtg-inventory/shared";
import { Moon } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { fetchSettings, updateSettings } from "../../app/apiClient";

interface SettingsPageProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void | Promise<void>;
  onSettingsSaved: (settings: Settings) => void;
}

export function SettingsPage({
  isDarkMode,
  setIsDarkMode,
  onSettingsSaved,
}: SettingsPageProps) {
  const [defaultMultiplier, setDefaultMultiplier] = useState("50");
  const [priceRefreshHours, setPriceRefreshHours] = useState("24");
  const [defaultCondition, setDefaultCondition] = useState("NM");
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings()
      .then((settings) => {
        setDefaultMultiplier(settings.default_multiplier);
        setPriceRefreshHours(settings.price_refresh_hours);
        setDefaultCondition(settings.default_condition);
        setDefaultLanguage(settings.default_language);
      })
      .catch(() => setStatus("Could not load saved settings."));
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const settings = await updateSettings({
      default_multiplier: defaultMultiplier,
      price_refresh_hours: priceRefreshHours,
      default_condition: defaultCondition,
      default_language: defaultLanguage,
      theme: isDarkMode ? "dark" : "light",
    });
    onSettingsSaved(settings);
    setStatus("Settings saved.");
  }

  return (
    <form className="settings-grid" onSubmit={handleSave}>
      <div className="panel settings-panel">
        <h2>Defaults</h2>
        <label>
          Default multiplier
          <input
            inputMode="decimal"
            onChange={(event) => setDefaultMultiplier(event.target.value)}
            value={defaultMultiplier}
          />
        </label>
        <label>
          Price refresh interval
          <select
            onChange={(event) => setPriceRefreshHours(event.target.value)}
            value={priceRefreshHours}
          >
            <option value="24">24 hours</option>
            <option value="48">48 hours</option>
            <option value="manual">Manual only</option>
          </select>
        </label>
        <label>
          Default condition
          <select
            onChange={(event) => setDefaultCondition(event.target.value)}
            value={defaultCondition}
          >
            <option>NM</option>
            <option>LP</option>
            <option>MP</option>
            <option>HP</option>
            <option>DMG</option>
          </select>
        </label>
        <label>
          Default language
          <select
            onChange={(event) => setDefaultLanguage(event.target.value)}
            value={defaultLanguage}
          >
            <option value="en">EN</option>
            <option value="ja">JP</option>
            <option value="de">DE</option>
            <option value="fr">FR</option>
            <option value="it">IT</option>
            <option value="es">ES</option>
            <option value="pt">PT</option>
            <option value="ru">RU</option>
            <option value="ko">KO</option>
            <option value="zhs">ZHS</option>
            <option value="zht">ZHT</option>
          </select>
        </label>
      </div>

      <div className="panel settings-panel">
        <h2>Appearance and data</h2>
        <label className="setting-switch">
          <Moon size={16} />
          Dark mode
          <input
            aria-label="Dark mode"
            checked={isDarkMode}
            onChange={(event) => setIsDarkMode(event.target.checked)}
            role="switch"
            type="checkbox"
          />
        </label>
        <p className="muted">
          Active price source: Scryfall / TCGPlayer listed median. Direct
          TCGPlayer credentials can be added in a future update.
        </p>
        {status ? <p className="muted">{status}</p> : null}
        <button className="button button-primary" type="submit">
          Save Settings
        </button>
      </div>
    </form>
  );
}
