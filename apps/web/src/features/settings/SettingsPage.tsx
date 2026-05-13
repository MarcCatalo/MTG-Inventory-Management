import { Moon } from "lucide-react";

interface SettingsPageProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

export function SettingsPage({ isDarkMode, setIsDarkMode }: SettingsPageProps) {
  return (
    <section className="settings-grid">
      <div className="panel settings-panel">
        <h2>Defaults</h2>
        <label>
          Default multiplier
          <input inputMode="decimal" defaultValue="57" />
        </label>
        <label>
          Price refresh interval
          <select defaultValue="24">
            <option value="24">24 hours</option>
            <option value="48">48 hours</option>
            <option value="manual">Manual only</option>
          </select>
        </label>
        <label>
          Default condition
          <select defaultValue="NM">
            <option>NM</option>
            <option>LP</option>
            <option>MP</option>
            <option>HP</option>
            <option>DMG</option>
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
          Active price source: Scryfall / TCGPlayer USD reference. Direct
          TCGPlayer credentials can be added in a future update.
        </p>
      </div>
    </section>
  );
}
