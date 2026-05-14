import { describe, expect, it } from "vitest";
import {
  addCartItem,
  getCartTotal,
  removeCartItem,
  updateCartQuantity,
  type CartItem
} from "./cart";

const bolt: Omit<CartItem, "quantity"> = {
  id: "bolt-2xm-nm-nonfoil",
  name: "Lightning Bolt",
  setLabel: "2XM #129",
  printing: "nonfoil",
  condition: "NM",
  pricePhp: 120,
  stock: 4,
  imageUrl: "https://cards.scryfall.io/normal/front/bolt.jpg"
};

describe("cart helpers", () => {
  it("adds a new item with requested quantity", () => {
    const cart = addCartItem([], bolt, 2);

    expect(cart).toEqual([{ ...bolt, quantity: 2 }]);
  });

  it("merges duplicate additions and clamps quantity to available stock", () => {
    const firstCart = addCartItem([], bolt, 3);
    const cart = addCartItem(firstCart, bolt, 3);

    expect(cart).toEqual([{ ...bolt, quantity: 4 }]);
  });

  it("updates quantity within stock limits", () => {
    const cart = updateCartQuantity([{ ...bolt, quantity: 1 }], bolt.id, 9);

    expect(cart[0]?.quantity).toBe(4);
  });

  it("removes items and totals line prices", () => {
    const cart = addCartItem([{ ...bolt, quantity: 2 }], {
      id: "atraxa-one-mp-nonfoil",
      name: "Atraxa, Grand Unifier",
      setLabel: "ONE #196",
      printing: "nonfoil",
      condition: "MP",
      pricePhp: 910,
      stock: 2,
      imageUrl: "https://cards.scryfall.io/normal/front/atraxa.jpg"
    });

    expect(getCartTotal(cart)).toBe(1150);
    expect(removeCartItem(cart, bolt.id)).toHaveLength(1);
  });
});
