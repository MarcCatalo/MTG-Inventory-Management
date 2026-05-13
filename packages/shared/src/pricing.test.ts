import { describe, expect, it } from "vitest";
import {
  calculateRealizedPnlPhp,
  calculateSuggestedPricePhp,
  roundPhpToNearestTen,
} from "./pricing";

describe("PHP pricing rules", () => {
  it("rounds PHP prices to the nearest ten with 5 and up rounded upward", () => {
    expect(roundPhpToNearestTen(354)).toBe(350);
    expect(roundPhpToNearestTen(355)).toBe(360);
    expect(roundPhpToNearestTen(356)).toBe(360);
    expect(roundPhpToNearestTen(360)).toBe(360);
    expect(roundPhpToNearestTen(364)).toBe(360);
    expect(roundPhpToNearestTen(365)).toBe(370);
  });

  it("calculates raw and rounded suggested PHP sell prices", () => {
    expect(calculateSuggestedPricePhp(6.25, 57)).toEqual({
      raw: 356.25,
      rounded: 360,
    });
  });

  it("calculates realized PHP profit or loss by quantity sold", () => {
    expect(calculateRealizedPnlPhp(500, 350, 2)).toBe(300);
    expect(calculateRealizedPnlPhp(250, 300, 3)).toBe(-150);
  });
}
);
