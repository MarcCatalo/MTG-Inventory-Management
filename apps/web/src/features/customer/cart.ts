export type CartItem = {
  id: string;
  name: string;
  setLabel: string;
  printing: string;
  condition: string;
  pricePhp: number;
  stock: number;
  imageUrl: string;
  quantity: number;
};

export function addCartItem(
  cart: CartItem[],
  item: Omit<CartItem, "quantity">,
  quantity = 1
): CartItem[] {
  const nextQuantity = clampQuantity(quantity, item.stock);
  const existing = cart.find((cartItem) => cartItem.id === item.id);

  if (!existing) {
    return [...cart, { ...item, quantity: nextQuantity }];
  }

  return cart.map((cartItem) =>
    cartItem.id === item.id
      ? { ...cartItem, quantity: clampQuantity(cartItem.quantity + nextQuantity, cartItem.stock) }
      : cartItem
  );
}

export function updateCartQuantity(cart: CartItem[], itemId: string, quantity: number): CartItem[] {
  return cart.map((item) =>
    item.id === itemId ? { ...item, quantity: clampQuantity(quantity, item.stock) } : item
  );
}

export function removeCartItem(cart: CartItem[], itemId: string): CartItem[] {
  return cart.filter((item) => item.id !== itemId);
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.pricePhp * item.quantity, 0);
}

function clampQuantity(quantity: number, stock: number): number {
  return Math.max(1, Math.min(Math.floor(quantity), stock));
}
