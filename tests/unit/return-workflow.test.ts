import { describe, expect, it } from "vitest";
import {
  allowedReturnStatuses,
  formatReturnErrorMessage,
  parseEgpToMinor,
  returnRefundMethodLabel,
  returnResolutionLabel,
  returnStatusLabel,
} from "@/features/commercial/return-workflow";

describe("return workflow helpers", () => {
  it("parses exact EGP values without floating-point rounding", () => {
    expect(parseEgpToMinor("425.50")).toBe(42550);
    expect(parseEgpToMinor("425.5")).toBe(42550);
    expect(parseEgpToMinor("425")).toBe(42500);
    expect(parseEgpToMinor("425.555")).toBeNull();
    expect(parseEgpToMinor("-1")).toBeNull();
  });

  it("only exposes valid next states", () => {
    expect(allowedReturnStatuses("approved")).toEqual([
      "approved",
      "received",
      "cancelled",
    ]);
    expect(allowedReturnStatuses("received")).toEqual([
      "received",
      "completed",
    ]);
    expect(allowedReturnStatuses("completed")).toEqual(["completed"]);
  });

  it("localizes statuses, resolutions, and refund methods", () => {
    expect(returnStatusLabel("received", "en")).toBe("Items received");
    expect(returnStatusLabel("received", "ar")).toBe("تم استلام المنتجات");
    expect(returnResolutionLabel("store_credit", "en")).toBe("Store credit");
    expect(returnRefundMethodLabel("instapay", "en")).toBe("InstaPay");
  });

  it("turns database workflow codes into actionable errors", () => {
    expect(
      formatReturnErrorMessage("REFUND_REFERENCE_REQUIRED", "en"),
    ).toContain("transaction");
    expect(
      formatReturnErrorMessage("RETURN_COMPLETION_FORBIDDEN", "ar"),
    ).toContain("تسوية");
  });
});
