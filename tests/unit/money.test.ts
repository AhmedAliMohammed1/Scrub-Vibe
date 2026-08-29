import { describe, expect, it } from "vitest";
import { discountPercent, formatMoney } from "../../src/lib/money";
describe("money", () => {
  it("stores and formats minor units", () => {
    expect(formatMoney(129900, "en")).toContain("1,299");
  });
  it("calculates a safe sale percentage", () => {
    expect(discountPercent(7500, 10000)).toBe(25);
    expect(discountPercent(10000, 7500)).toBe(0);
    expect(discountPercent(10000, 0)).toBe(0);
  });
});
