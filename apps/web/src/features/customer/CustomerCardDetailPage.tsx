import { ArrowLeft, ShoppingCart } from "lucide-react";
import type { CustomerCatalogItem } from "./catalog";
import type { CartItem } from "./cart";
import { formatPhp, toCartItem } from "./CustomerCatalogPage";

type CustomerCardDetailPageProps = {
  cards: CustomerCatalogItem[];
  listingId: string | null;
  onAddToCart: (item: Omit<CartItem, "quantity">) => void;
  onBackToCatalog: () => void;
  onViewDetails: (listingId: string) => void;
};

export function CustomerCardDetailPage({
  cards,
  listingId,
  onAddToCart,
  onBackToCatalog,
  onViewDetails
}: CustomerCardDetailPageProps) {
  const card = cards.find((item) => item.id === listingId);

  if (!card) {
    return (
      <section className="panel empty-state page-motion">
        <h2>Card not found</h2>
        <p className="muted">Return to the catalog and choose another printing.</p>
        <button className="button button-primary" onClick={onBackToCatalog} type="button">
          Back to catalog
        </button>
      </section>
    );
  }

  const related = cards.filter((item) => item.name === card.name && item.stock > 0);

  return (
    <section className="detail-layout page-motion">
      <div className="detail-image-rail">
        <img className="detail-image" src={card.imageUrl} alt={`${card.name} card art`} />
        <div className={card.stock > 0 ? "stock-chip detail-stock in-stock" : "stock-chip detail-stock out-stock"}>
          {card.stock > 0 ? `${card.stock} in stock` : "Out of stock"}
        </div>
      </div>
      <div className="detail-panel">
        <button className="text-link back-link" onClick={onBackToCatalog} type="button">
          <ArrowLeft size={16} />
          Back to catalog
        </button>
        <p className="eyebrow">{card.setName} - {card.rarity}</p>
        <h1>{card.name}</h1>
        <div className="detail-price-line">
          <strong>{formatPhp(card.pricePhp)}</strong>
          <span>{card.setCode} #{card.collectorNumber}</span>
        </div>
        <dl className="meta-grid">
          <div><dt>Condition</dt><dd>{card.condition}</dd></div>
          <div><dt>Printing</dt><dd>{card.printing}</dd></div>
          <div><dt>Type</dt><dd>{card.cardType}</dd></div>
          <div><dt>Mana value</dt><dd>{card.manaValue}</dd></div>
          <div><dt>Stock</dt><dd>{card.stock}</dd></div>
          <div><dt>Price</dt><dd>{formatPhp(card.pricePhp)}</dd></div>
        </dl>
        <h2>Available options</h2>
        <div className="option-list">
          {related.map((option) => (
            <button
              className={option.id === card.id ? "option active" : "option"}
              onClick={() => onViewDetails(option.id)}
              type="button"
              key={option.id}
            >
              {option.setCode} - {option.condition} - {option.printing} - {formatPhp(option.pricePhp)}
            </button>
          ))}
        </div>
        <button className="button detail-action" disabled={card.stock <= 0} onClick={() => onAddToCart(toCartItem(card))} type="button">
          <ShoppingCart size={16} />
          Add to cart
        </button>
      </div>
    </section>
  );
}
