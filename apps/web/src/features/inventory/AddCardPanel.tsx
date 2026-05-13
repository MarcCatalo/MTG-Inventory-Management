import type { CreateInventoryLotInput } from "@mtg-inventory/shared";
import { X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  createInventoryLot,
  fetchCardPrints,
  searchCardNames,
  type CardPrint,
} from "../../app/apiClient";

interface AddCardPanelProps {
  defaultMultiplier: string;
  onClose: () => void;
  onSaved: () => void;
}

export function AddCardPanel({ defaultMultiplier, onClose, onSaved }: AddCardPanelProps) {
  const [query, setQuery] = useState("");
  const [names, setNames] = useState<string[]>([]);
  const [prints, setPrints] = useState<CardPrint[]>([]);
  const [selectedPrint, setSelectedPrint] = useState<CardPrint | null>(null);
  const [condition, setCondition] = useState<CreateInventoryLotInput["condition"]>("NM");
  const [foilType, setFoilType] = useState<CreateInventoryLotInput["foilType"]>("nonfoil");
  const [language, setLanguage] = useState<CreateInventoryLotInput["language"]>("en");
  const [qty, setQty] = useState("1");
  const [buyPricePhpPerCopy, setBuyPricePhpPerCopy] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [multiplier, setMultiplier] = useState(defaultMultiplier);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const availableFoils = useMemo(() => {
    if (!selectedPrint) {
      return ["nonfoil", "foil", "etched"] as const;
    }
    return selectedPrint.finishes.length > 0
      ? selectedPrint.finishes.filter((finish) =>
          ["nonfoil", "foil", "etched"].includes(finish),
        )
      : ["nonfoil"];
  }, [selectedPrint]);

  async function handleSearch() {
    setStatus("Searching Scryfall...");
    setNames(await searchCardNames(sanitizeCardSearch(query)));
    setPrints([]);
    setSelectedPrint(null);
    setStatus(null);
  }

  async function handleNameSelect(name: string) {
    setQuery(name);
    setStatus("Loading printings...");
    setPrints(await fetchCardPrints(name));
    setStatus(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPrint) {
      setStatus("Choose an exact printing before saving.");
      return;
    }

    setStatus("Saving inventory lot...");
    const input: CreateInventoryLotInput = {
      scryfallId: selectedPrint.id,
      oracleId: selectedPrint.oracleId,
      tcgplayerId: selectedPrint.tcgplayerId,
      cardName: selectedPrint.name,
      setCode: selectedPrint.setCode,
      setName: selectedPrint.setName,
      collectorNumber: selectedPrint.collectorNumber,
      rarity: selectedPrint.rarity,
      colorIdentity: selectedPrint.colorIdentity,
      imageUris: selectedPrint.imageUris,
      condition,
      foilType,
      language,
      qty: Number(qty),
      buyPricePhpPerCopy: Number(buyPricePhpPerCopy),
      purchaseDate,
      multiplier: Number(multiplier),
      notes: notes.trim() || null,
    };

    await createInventoryLot(input);
    setStatus(null);
    onSaved();
  }

  return (
    <div className="drawer-backdrop" role="presentation">
      <aside aria-label="Add card panel" className="drawer">
        <header className="drawer-header">
          <div>
            <p className="eyebrow">New acquisition lot</p>
            <h2>Add Card</h2>
          </div>
          <button aria-label="Close" className="icon-button" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </header>

        <div className="lookup-grid">
          <label>
            Card name
            <input
              aria-label="Card name"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Lightning Bolt"
              value={query}
            />
          </label>
          <button className="button button-primary" onClick={handleSearch} type="button">
            Search
          </button>
        </div>

        {names.length > 0 ? (
          <div className="choice-list" aria-label="Name suggestions">
            {names.map((name) => (
              <button key={name} onClick={() => handleNameSelect(name)} type="button">
                {name}
              </button>
            ))}
          </div>
        ) : null}

        {prints.length > 0 ? (
          <div className="print-grid" aria-label="Exact printings">
            {prints.map((card) => (
              <button
                className={
                  selectedPrint?.id === card.id ? "print-card selected" : "print-card"
                }
                key={card.id}
                onClick={() => setSelectedPrint(card)}
                type="button"
              >
                {card.imageUris?.small ? (
                  <img alt="" src={card.imageUris.small} />
                ) : (
                  <span className="image-placeholder">No image</span>
                )}
                <span>
                  <strong>{card.name}</strong>
                  <small>
                    {card.setName} - {card.setCode.toUpperCase()} #{card.collectorNumber}
                  </small>
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <form className="lot-form" onSubmit={handleSubmit}>
          <label>
            Condition
            <select value={condition} onChange={(event) => setCondition(event.target.value as typeof condition)}>
              <option>NM</option>
              <option>LP</option>
              <option>MP</option>
              <option>HP</option>
              <option>DMG</option>
            </select>
          </label>

          <label>
            Foil
            <select value={foilType} onChange={(event) => setFoilType(event.target.value as typeof foilType)}>
              {availableFoils.map((finish) => (
                <option key={finish} value={finish}>
                  {finish}
                </option>
              ))}
            </select>
          </label>

          <label>
            Language
            <select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)}>
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

          <label>
            Qty
            <input
              aria-label="Qty"
              min="1"
              onChange={(event) => setQty(event.target.value)}
              type="number"
              value={qty}
            />
          </label>

          <label>
            Buy price PHP per copy
            <input
              aria-label="Buy price PHP per copy"
              min="0"
              onChange={(event) => setBuyPricePhpPerCopy(event.target.value)}
              step="0.01"
              type="number"
              value={buyPricePhpPerCopy}
            />
          </label>

          <label>
            Purchase date
            <input
              onChange={(event) => setPurchaseDate(event.target.value)}
              type="date"
              value={purchaseDate}
            />
          </label>

          <label>
            Multiplier
            <input
              min="0"
              onChange={(event) => setMultiplier(event.target.value)}
              step="0.01"
              type="number"
              value={multiplier}
            />
          </label>

          <label className="full-width">
            Notes
            <textarea onChange={(event) => setNotes(event.target.value)} value={notes} />
          </label>

          {status ? <p className="muted">{status}</p> : null}

          <div className="drawer-actions">
            <button className="button" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="button button-primary" type="submit">
              Save Lot
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function sanitizeCardSearch(value: string): string {
  return value.replace(/[^\p{L}\p{N}\s,'/-]/gu, " ").replace(/\s+/g, " ").trim();
}
