import { describe, expect, it } from "vitest";
import {
  cmToInches,
  inchesToCm,
  calculateRecommendedSize,
  DEFAULT_SIZE_CHART_ENTRIES,
  mapRowToSizeChartEntry,
} from "../../src/features/catalog/size-guide";
import type { SizeChartRow } from "../../src/features/catalog/size-guide-types";

describe("Size Guide Unit Conversions", () => {
  it("converts cm to inches accurately rounded to 1 decimal", () => {
    expect(cmToInches(2.54)).toBe(1);
    expect(cmToInches(100)).toBe(39.4);
    expect(cmToInches(86)).toBe(33.9);
  });

  it("converts inches to cm accurately rounded to 1 decimal", () => {
    expect(inchesToCm(1)).toBe(2.5);
    expect(inchesToCm(38)).toBe(96.5);
    expect(inchesToCm(30)).toBe(76.2);
  });
});

describe("Size Chart Baseline Data Integrity", () => {
  it("contains valid category entries for women, men, and unisex", () => {
    const women = DEFAULT_SIZE_CHART_ENTRIES.filter((e) => e.category === "women");
    const men = DEFAULT_SIZE_CHART_ENTRIES.filter((e) => e.category === "men");
    const unisex = DEFAULT_SIZE_CHART_ENTRIES.filter((e) => e.category === "unisex");

    expect(women.length).toBeGreaterThanOrEqual(6);
    expect(men.length).toBeGreaterThanOrEqual(6);
    expect(unisex.length).toBeGreaterThanOrEqual(5);
  });

  it("ensures all measurement ranges have min <= max and positive numbers", () => {
    for (const entry of DEFAULT_SIZE_CHART_ENTRIES) {
      expect(entry.chestMinCm).toBeLessThanOrEqual(entry.chestMaxCm);
      expect(entry.waistMinCm).toBeLessThanOrEqual(entry.waistMaxCm);
      expect(entry.hipMinCm).toBeLessThanOrEqual(entry.hipMaxCm);
      expect(entry.chestMinCm).toBeGreaterThan(0);
      expect(entry.waistMinCm).toBeGreaterThan(0);
      expect(entry.hipMinCm).toBeGreaterThan(0);
      if (entry.inseamCm !== null) expect(entry.inseamCm).toBeGreaterThan(0);
      if (entry.garmentLengthCm !== null) expect(entry.garmentLengthCm).toBeGreaterThan(0);
    }
  });

  it("ensures monotonic size progression without inversions", () => {
    const women = DEFAULT_SIZE_CHART_ENTRIES.filter((e) => e.category === "women");
    for (let i = 0; i < women.length - 1; i++) {
      expect(women[i].chestMinCm).toBeLessThan(women[i + 1].chestMinCm);
      expect(women[i].sortOrder).toBeLessThan(women[i + 1].sortOrder);
    }
  });
});

describe("calculateRecommendedSize Engine", () => {
  it("returns null with prompt message when no measurements are provided", () => {
    const res = calculateRecommendedSize({
      category: "women",
      unit: "cm",
      entries: DEFAULT_SIZE_CHART_ENTRIES,
    });
    expect(res.recommendedSize).toBeNull();
    expect(res.confidence).toBe("low");
    expect(res.messageEn).toContain("Please enter at least one measurement");
  });

  it("recommends Women M for exact medium measurements in cm", () => {
    const res = calculateRecommendedSize({
      category: "women",
      unit: "cm",
      chest: 94, // Women M: 91 - 97
      waist: 73, // Women M: 71 - 76
      hip: 99,   // Women M: 97 - 102
      entries: DEFAULT_SIZE_CHART_ENTRIES,
    });
    expect(res.recommendedSize).toBe("M");
    expect(res.confidence).toBe("high");
    expect(res.fitBreakdown.chestFit).toBe("optimal");
    expect(res.fitBreakdown.waistFit).toBe("optimal");
    expect(res.fitBreakdown.hipFit).toBe("optimal");
  });

  it("recommends Men L for standard large measurements in inches", () => {
    // Men L: Chest 104-109 cm (40.9-42.9 in), Waist 89-94 cm (35-37 in)
    const res = calculateRecommendedSize({
      category: "men",
      unit: "in",
      chest: 42, // ~106.7 cm
      waist: 36, // ~91.4 cm
      hip: 42,   // ~106.7 cm
      entries: DEFAULT_SIZE_CHART_ENTRIES,
    });
    expect(res.recommendedSize).toBe("L");
    expect(res.confidence).toBe("high");
  });

  it("detects when a shopper is between two sizes and offers secondary recommendation", () => {
    // Women S max chest is 91, M min chest is 91. Exactly on 91.
    const res = calculateRecommendedSize({
      category: "women",
      unit: "cm",
      chest: 91,
      waist: 71,
      hip: 97,
      entries: DEFAULT_SIZE_CHART_ENTRIES,
    });
    expect(["S", "M"]).toContain(res.recommendedSize);
    expect(res.verdict).toBe("between_sizes");
    expect(res.secondarySize).toBeDefined();
    expect(res.messageEn).toContain("between sizes");
  });

  it("recommends accurately when only one measurement (chest) is provided", () => {
    const res = calculateRecommendedSize({
      category: "men",
      unit: "cm",
      chest: 90, // Men S: 89 - 94
      entries: DEFAULT_SIZE_CHART_ENTRIES,
    });
    expect(res.recommendedSize).toBe("S");
    expect(res.confidence).toBe("high");
  });

  it("respects product availableSizes when provided", () => {
    // Measurement fits XS (83 cm chest), but product only has ["S", "M", "L"]
    const res = calculateRecommendedSize({
      category: "women",
      unit: "cm",
      chest: 83,
      waist: 63,
      hip: 88,
      availableSizes: ["S", "M", "L"],
      entries: DEFAULT_SIZE_CHART_ENTRIES,
    });
    // Should choose closest available size (S)
    expect(res.recommendedSize).toBe("S");
  });
});

describe("mapRowToSizeChartEntry", () => {
  it("properly converts string numbers from PostgreSQL into numeric types", () => {
    const row: SizeChartRow = {
      id: "test-uuid",
      product_id: 42,
      category: "women",
      size: "M",
      sort_order: 3,
      chest_min_cm: 91 as unknown as number,
      chest_max_cm: 97 as unknown as number,
      waist_min_cm: 71 as unknown as number,
      waist_max_cm: 76 as unknown as number,
      hip_min_cm: 97 as unknown as number,
      hip_max_cm: 102 as unknown as number,
      inseam_cm: 78 as unknown as number,
      garment_length_cm: 67 as unknown as number,
      note_en: "Standard fit",
      note_ar: "قصة قياسية",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const entry = mapRowToSizeChartEntry(row);
    expect(entry.id).toBe("test-uuid");
    expect(entry.productId).toBe(42);
    expect(entry.category).toBe("women");
    expect(entry.size).toBe("M");
    expect(typeof entry.chestMinCm).toBe("number");
    expect(entry.chestMinCm).toBe(91);
    expect(entry.noteEn).toBe("Standard fit");
  });
});
