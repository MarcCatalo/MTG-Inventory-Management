import { Trash2 } from "lucide-react";
import { getCartTotal, type CartItem } from "./cart";
import { formatPhp } from "./CustomerCatalogPage";

type CustomerCartPageProps = {
  cart: CartItem[];
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
};

export function CustomerCartPage({
  cart,
  onQuantityChange,
  onRemove
}: CustomerCartPageProps) {
  return (
    <section className="page-stack page-motion">
      {cart.length === 0 ? (
        <div className="empty-panel empty-state">
          <strong>Your cart is empty.</strong>
          <span>Use the customer catalog to add cards for review.</span>
        </div>
      ) : (
        <div className="cart-list">
          {cart.map((item) => (
            <article className="cart-row" key={item.id}>
              <img src={item.imageUrl} alt={`${item.name} card art`} />
              <div>
                <h2>{item.name}</h2>
                <p>{item.setLabel} - {item.condition} - {item.printing}</p>
              </div>
              <strong>{formatPhp(item.pricePhp)}</strong>
              <label className="field compact-field">
                <span>Qty</span>
                <input
                  type="number"
                  min="1"
                  max={item.stock}
                  value={item.quantity}
                  onChange={(event) => onQuantityChange(item.id, Number(event.target.value))}
                />
              </label>
              <strong>{formatPhp(item.pricePhp * item.quantity)}</strong>
              <button className="button ghost icon-button" aria-label={`Remove ${item.name}`} onClick={() => onRemove(item.id)} type="button">
                <Trash2 size={16} />
              </button>
            </article>
          ))}
          <div className="cart-total">
            <span>Total</span>
            <strong>{formatPhp(getCartTotal(cart))}</strong>
          </div>
        </div>
      )}
    </section>
  );
}
