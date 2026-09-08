import type { Database } from "@/types/database";

export type SizeCategory = "women" | "men" | "unisex";
export type MeasurementUnit = "cm" | "in";

export type SizeChartRow = Database["public"]["Tables"]["size_chart_entries"]["Row"];

export type SizeChartEntry = {
  id: string;
  productId: number | null;
  category: SizeCategory;
  size: string;
  sortOrder: number;
  chestMinCm: number;
  chestMaxCm: number;
  waistMinCm: number;
  waistMaxCm: number;
  hipMinCm: number;
  hipMaxCm: number;
  inseamCm: number | null;
  garmentLengthCm: number | null;
  noteEn: string | null;
  noteAr: string | null;
};

export type SizeRecommendationInput = {
  category: SizeCategory;
  unit: MeasurementUnit;
  chest?: number | null;
  waist?: number | null;
  hip?: number | null;
  availableSizes?: string[];
  entries: SizeChartEntry[];
};

export type SizeFitVerdict = "perfect" | "slim" | "relaxed" | "between_sizes";

export type SizeRecommendationResult = {
  recommendedSize: string | null;
  secondarySize: string | null;
  verdict: SizeFitVerdict;
  messageEn: string;
  messageAr: string;
  confidence: "high" | "medium" | "low";
  fitBreakdown: {
    chestFit?: "under" | "optimal" | "over";
    waistFit?: "under" | "optimal" | "over";
    hipFit?: "under" | "optimal" | "over";
  };
};
