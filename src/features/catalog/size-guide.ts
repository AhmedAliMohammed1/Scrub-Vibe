import type {
  SizeCategory,
  SizeChartEntry,
  SizeChartRow,
  SizeRecommendationInput,
  SizeRecommendationResult,
} from "./size-guide-types";

export const INCH_IN_CM = 2.54;

export function cmToInches(cm: number): number {
  return Math.round((cm / INCH_IN_CM) * 10) / 10;
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * INCH_IN_CM * 10) / 10;
}

export const DEFAULT_SIZE_CHART_ENTRIES: SizeChartEntry[] = [
  // Women
  {
    id: "default-w-xs",
    productId: null,
    category: "women",
    size: "XS",
    sortOrder: 1,
    chestMinCm: 81,
    chestMaxCm: 86,
    waistMinCm: 61,
    waistMaxCm: 66,
    hipMinCm: 86,
    hipMaxCm: 91,
    inseamCm: 76,
    garmentLengthCm: 65,
    noteEn: "Tailored slim fit across shoulders and torso",
    noteAr: "قصة ضيقة ومحددة عند الكتفين والصدر",
  },
  {
    id: "default-w-s",
    productId: null,
    category: "women",
    size: "S",
    sortOrder: 2,
    chestMinCm: 86,
    chestMaxCm: 91,
    waistMinCm: 66,
    waistMaxCm: 71,
    hipMinCm: 91,
    hipMaxCm: 97,
    inseamCm: 77,
    garmentLengthCm: 66,
    noteEn: "Standard professional fit for everyday comfort",
    noteAr: "قصة قياسية مريحة للعمل اليومي",
  },
  {
    id: "default-w-m",
    productId: null,
    category: "women",
    size: "M",
    sortOrder: 3,
    chestMinCm: 91,
    chestMaxCm: 97,
    waistMinCm: 71,
    waistMaxCm: 76,
    hipMinCm: 97,
    hipMaxCm: 102,
    inseamCm: 78,
    garmentLengthCm: 67,
    noteEn: "Standard professional fit with stretch ease",
    noteAr: "قصة قياسية مع مرونة مريحة للحركة",
  },
  {
    id: "default-w-l",
    productId: null,
    category: "women",
    size: "L",
    sortOrder: 4,
    chestMinCm: 97,
    chestMaxCm: 104,
    waistMinCm: 76,
    waistMaxCm: 84,
    hipMinCm: 102,
    hipMaxCm: 109,
    inseamCm: 78,
    garmentLengthCm: 69,
    noteEn: "Relaxed comfortable cut for flexible motion",
    noteAr: "قصة واسعة مريحة لحرية حركة كاملة",
  },
  {
    id: "default-w-xl",
    productId: null,
    category: "women",
    size: "XL",
    sortOrder: 5,
    chestMinCm: 104,
    chestMaxCm: 112,
    waistMinCm: 84,
    waistMaxCm: 91,
    hipMinCm: 109,
    hipMaxCm: 117,
    inseamCm: 79,
    garmentLengthCm: 70,
    noteEn: "Relaxed roomy silhouette for long shifts",
    noteAr: "قصة رحبة مريحة للنوبات الطويلة",
  },
  {
    id: "default-w-2xl",
    productId: null,
    category: "women",
    size: "2XL",
    sortOrder: 6,
    chestMinCm: 112,
    chestMaxCm: 120,
    waistMinCm: 91,
    waistMaxCm: 99,
    hipMinCm: 117,
    hipMaxCm: 124,
    inseamCm: 79,
    garmentLengthCm: 71,
    noteEn: "Extended comfort fit with generous drape",
    noteAr: "قصة واسعة مريحة مع انسيابية كاملة",
  },

  // Men
  {
    id: "default-m-s",
    productId: null,
    category: "men",
    size: "S",
    sortOrder: 1,
    chestMinCm: 89,
    chestMaxCm: 94,
    waistMinCm: 74,
    waistMaxCm: 79,
    hipMinCm: 89,
    hipMaxCm: 94,
    inseamCm: 79,
    garmentLengthCm: 71,
    noteEn: "Athletic tailored fit through chest and waist",
    noteAr: "قصة رياضية محددة عند الصدر والخصر",
  },
  {
    id: "default-m-m",
    productId: null,
    category: "men",
    size: "M",
    sortOrder: 2,
    chestMinCm: 97,
    chestMaxCm: 102,
    waistMinCm: 81,
    waistMaxCm: 86,
    hipMinCm: 97,
    hipMaxCm: 102,
    inseamCm: 80,
    garmentLengthCm: 73,
    noteEn: "Standard modern fit for clinical shifts",
    noteAr: "قصة عصرية قياسية للعمل الطبي",
  },
  {
    id: "default-m-l",
    productId: null,
    category: "men",
    size: "L",
    sortOrder: 3,
    chestMinCm: 104,
    chestMaxCm: 109,
    waistMinCm: 89,
    waistMaxCm: 94,
    hipMinCm: 104,
    hipMaxCm: 109,
    inseamCm: 81,
    garmentLengthCm: 75,
    noteEn: "Standard comfortable cut with full arm mobility",
    noteAr: "قصة مريحة مع حرية حركة كاملة للذراعين",
  },
  {
    id: "default-m-xl",
    productId: null,
    category: "men",
    size: "XL",
    sortOrder: 4,
    chestMinCm: 112,
    chestMaxCm: 117,
    waistMinCm: 97,
    waistMaxCm: 102,
    hipMinCm: 112,
    hipMaxCm: 117,
    inseamCm: 81,
    garmentLengthCm: 76,
    noteEn: "Roomy fit across shoulders and chest",
    noteAr: "قصة واسعة عند الأكتاف والصدر",
  },
  {
    id: "default-m-2xl",
    productId: null,
    category: "men",
    size: "2XL",
    sortOrder: 5,
    chestMinCm: 120,
    chestMaxCm: 125,
    waistMinCm: 104,
    waistMaxCm: 109,
    hipMinCm: 120,
    hipMaxCm: 125,
    inseamCm: 82,
    garmentLengthCm: 77,
    noteEn: "Generous silhouette for unrestricted movement",
    noteAr: "قصة واسعة لراحة غير مقيدة طوال اليوم",
  },
  {
    id: "default-m-3xl",
    productId: null,
    category: "men",
    size: "3XL",
    sortOrder: 6,
    chestMinCm: 127,
    chestMaxCm: 135,
    waistMinCm: 112,
    waistMaxCm: 120,
    hipMinCm: 127,
    hipMaxCm: 135,
    inseamCm: 82,
    garmentLengthCm: 78,
    noteEn: "Extended relaxed cut designed for comfort",
    noteAr: "قصة رحبة مصممة لأقصى راحة",
  },

  // Unisex
  {
    id: "default-u-s",
    productId: null,
    category: "unisex",
    size: "S",
    sortOrder: 1,
    chestMinCm: 86,
    chestMaxCm: 92,
    waistMinCm: 71,
    waistMaxCm: 77,
    hipMinCm: 91,
    hipMaxCm: 97,
    inseamCm: 78,
    garmentLengthCm: 70,
    noteEn: "Unisex straight cut for men and women",
    noteAr: "قصة مستقيمة موحدة للجنسين",
  },
  {
    id: "default-u-m",
    productId: null,
    category: "unisex",
    size: "M",
    sortOrder: 2,
    chestMinCm: 94,
    chestMaxCm: 100,
    waistMinCm: 79,
    waistMaxCm: 85,
    hipMinCm: 99,
    hipMaxCm: 105,
    inseamCm: 79,
    garmentLengthCm: 72,
    noteEn: "Unisex balanced fit with flexible mobility",
    noteAr: "قصة متوازنة مريحة للجنسين",
  },
  {
    id: "default-u-l",
    productId: null,
    category: "unisex",
    size: "L",
    sortOrder: 3,
    chestMinCm: 102,
    chestMaxCm: 108,
    waistMinCm: 87,
    waistMaxCm: 93,
    hipMinCm: 107,
    hipMaxCm: 113,
    inseamCm: 80,
    garmentLengthCm: 74,
    noteEn: "Relaxed straight profile for clinical duty",
    noteAr: "قصة واسعة مستقيمة لأداء المهام الطبية",
  },
  {
    id: "default-u-xl",
    productId: null,
    category: "unisex",
    size: "XL",
    sortOrder: 4,
    chestMinCm: 110,
    chestMaxCm: 117,
    waistMinCm: 95,
    waistMaxCm: 102,
    hipMinCm: 115,
    hipMaxCm: 122,
    inseamCm: 81,
    garmentLengthCm: 75,
    noteEn: "Roomy comfort fit suitable for layering",
    noteAr: "قصة رحبة ملائمة للارتداء فوق الملابس",
  },
  {
    id: "default-u-2xl",
    productId: null,
    category: "unisex",
    size: "2XL",
    sortOrder: 5,
    chestMinCm: 119,
    chestMaxCm: 126,
    waistMinCm: 104,
    waistMaxCm: 111,
    hipMinCm: 124,
    hipMaxCm: 131,
    inseamCm: 81,
    garmentLengthCm: 76,
    noteEn: "Extended unisex cut for full range of motion",
    noteAr: "قصة موسعة لحرية حركة تامة",
  },
];

export function mapRowToSizeChartEntry(row: SizeChartRow): SizeChartEntry {
  return {
    id: row.id,
    productId: row.product_id ? Number(row.product_id) : null,
    category: row.category as SizeCategory,
    size: row.size,
    sortOrder: row.sort_order,
    chestMinCm: Number(row.chest_min_cm),
    chestMaxCm: Number(row.chest_max_cm),
    waistMinCm: Number(row.waist_min_cm),
    waistMaxCm: Number(row.waist_max_cm),
    hipMinCm: Number(row.hip_min_cm),
    hipMaxCm: Number(row.hip_max_cm),
    inseamCm: row.inseam_cm !== null ? Number(row.inseam_cm) : null,
    garmentLengthCm:
      row.garment_length_cm !== null ? Number(row.garment_length_cm) : null,
    noteEn: row.note_en,
    noteAr: row.note_ar,
  };
}

export function calculateRecommendedSize(
  input: SizeRecommendationInput,
): SizeRecommendationResult {
  const {
    category,
    unit,
    chest: rawChest,
    waist: rawWaist,
    hip: rawHip,
    availableSizes,
    entries,
  } = input;

  const validEntries = (entries.length > 0 ? entries : DEFAULT_SIZE_CHART_ENTRIES)
    .filter((e) => e.category === category)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (validEntries.length === 0) {
    return {
      recommendedSize: null,
      secondarySize: null,
      verdict: "perfect",
      messageEn: "No size chart available for this collection.",
      messageAr: "لا يتوفر جدول مقاسات لهذه المجموعة.",
      confidence: "low",
      fitBreakdown: {},
    };
  }

  // Convert inputs to CM
  const chestCm =
    rawChest && rawChest > 0
      ? unit === "in"
        ? inchesToCm(rawChest)
        : rawChest
      : null;
  const waistCm =
    rawWaist && rawWaist > 0
      ? unit === "in"
        ? inchesToCm(rawWaist)
        : rawWaist
      : null;
  const hipCm =
    rawHip && rawHip > 0
      ? unit === "in"
        ? inchesToCm(rawHip)
        : rawHip
      : null;

  if (!chestCm && !waistCm && !hipCm) {
    return {
      recommendedSize: null,
      secondarySize: null,
      verdict: "perfect",
      messageEn: "Please enter at least one measurement (chest, waist, or hips).",
      messageAr: "يرجى إدخال قياس واحد على الأقل (الصدر أو الخصر أو الأرداف).",
      confidence: "low",
      fitBreakdown: {},
    };
  }

  type CandidateScore = {
    entry: SizeChartEntry;
    score: number;
    fitBreakdown: {
      chestFit?: "under" | "optimal" | "over";
      waistFit?: "under" | "optimal" | "over";
      hipFit?: "under" | "optimal" | "over";
    };
    isPerfectFit: boolean;
    isAvailable: boolean;
  };

  const candidates: CandidateScore[] = validEntries.map((entry) => {
    let totalPenalty = 0;
    let metricCount = 0;
    const fitBreakdown: CandidateScore["fitBreakdown"] = {};

    // 1. Chest evaluation (weight: 1.2)
    if (chestCm !== null) {
      metricCount += 1.2;
      if (chestCm < entry.chestMinCm) {
        const diff = entry.chestMinCm - chestCm;
        totalPenalty += diff * 1.5 * 1.2; // penalty for being too small
        fitBreakdown.chestFit = "under";
      } else if (chestCm > entry.chestMaxCm) {
        const diff = chestCm - entry.chestMaxCm;
        totalPenalty += diff * 2.0 * 1.2; // heavier penalty for being too tight
        fitBreakdown.chestFit = "over";
      } else {
        fitBreakdown.chestFit = "optimal";
      }
    }

    // 2. Waist evaluation (weight: 1.0)
    if (waistCm !== null) {
      metricCount += 1.0;
      if (waistCm < entry.waistMinCm) {
        const diff = entry.waistMinCm - waistCm;
        totalPenalty += diff * 1.2;
        fitBreakdown.waistFit = "under";
      } else if (waistCm > entry.waistMaxCm) {
        const diff = waistCm - entry.waistMaxCm;
        totalPenalty += diff * 1.8;
        fitBreakdown.waistFit = "over";
      } else {
        fitBreakdown.waistFit = "optimal";
      }
    }

    // 3. Hip evaluation (weight: 0.9)
    if (hipCm !== null) {
      metricCount += 0.9;
      if (hipCm < entry.hipMinCm) {
        const diff = entry.hipMinCm - hipCm;
        totalPenalty += diff * 1.1 * 0.9;
        fitBreakdown.hipFit = "under";
      } else if (hipCm > entry.hipMaxCm) {
        const diff = hipCm - entry.hipMaxCm;
        totalPenalty += diff * 1.7 * 0.9;
        fitBreakdown.hipFit = "over";
      } else {
        fitBreakdown.hipFit = "optimal";
      }
    }

    const isAvailable =
      !availableSizes || availableSizes.length === 0 || availableSizes.includes(entry.size);

    // If size is not available in product, penalize score to prefer in-stock sizes
    if (!isAvailable) {
      totalPenalty += 100;
    }

    return {
      entry,
      score: totalPenalty / (metricCount || 1),
      fitBreakdown,
      isPerfectFit: totalPenalty === 0,
      isAvailable,
    };
  });

  candidates.sort((a, b) => a.score - b.score);
  const best = candidates[0];
  const second = candidates[1];

  const primarySize = best.entry.size;
  const secondarySize = second && second.score - best.score < 2.5 ? second.entry.size : null;

  let verdict: SizeRecommendationResult["verdict"] = "perfect";
  let messageEn = `We recommend size ${primarySize} for the best tailored fit.`;
  let messageAr = `نوصي بالمقاس ${primarySize} للحصول على قصة متناسقة ومريحة.`;
  let confidence: SizeRecommendationResult["confidence"] = "high";

  if (secondarySize) {
    verdict = "between_sizes";
    const smaller = best.entry.sortOrder < second.entry.sortOrder ? primarySize : secondarySize;
    const larger = best.entry.sortOrder > second.entry.sortOrder ? primarySize : secondarySize;
    messageEn = `You are between sizes ${smaller} and ${larger}. Choose ${smaller} for a tailored fit, or ${larger} for relaxed mobility.`;
    messageAr = `أنت بين المقاسين ${smaller} و ${larger}. اختر ${smaller} لقصة محددة، أو ${larger} لحرية حركة مريحة.`;
    confidence = "medium";
  } else if (best.score > 4) {
    confidence = "medium";
    const anyOver = Object.values(best.fitBreakdown).includes("over");
    if (anyOver) {
      verdict = "slim";
      messageEn = `Size ${primarySize} will fit snug. If you prefer room to layer clothes, consider sizing up.`;
      messageAr = `سيكون المقاس ${primarySize} مضبوطاً تماماً. إذا كنت تفضل مساحة للارتداء فوق الملابس، ننصح باختيار مقاس أكبر.`;
    } else {
      verdict = "relaxed";
      messageEn = `Size ${primarySize} will have a relaxed, roomy fit.`;
      messageAr = `سيكون المقاس ${primarySize} واسعاً ومريحاً.`;
    }
  }

  if (!best.isAvailable && availableSizes && availableSizes.length > 0) {
    messageEn += ` (Note: Size ${primarySize} is currently unavailable for this product).`;
    messageAr += ` (ملاحظة: المقاس ${primarySize} غير متوفر حالياً لهذا المنتج).`;
    confidence = "low";
  }

  return {
    recommendedSize: primarySize,
    secondarySize,
    verdict,
    messageEn,
    messageAr,
    confidence,
    fitBreakdown: best.fitBreakdown,
  };
}
