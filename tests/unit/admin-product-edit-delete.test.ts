import { describe, expect, it } from "vitest";
import {
  updateProductSchema,
  productSchema,
  colourListSchema,
  colourItemSchema,
  parseSizesString,
} from "../../src/features/admin/schemas";

describe("Admin Product Edit & Delete Feature", () => {
  describe("updateProductSchema validation", () => {
    const validProductData = {
      productId: 42,
      locale: "en",
      slug: "apex-performance-scrub-top",
      titleEn: "Apex Performance Scrub Top",
      titleAr: "بلوزة سكراب أبيكس للأداء العالي",
      descriptionEn:
        "Engineered 4-way stretch scrub top with anti-microbial finish.",
      descriptionAr: "بلوزة سكراب معالجة ومقاومة للبكتيريا وقابلة للتمدد.",
      categoryId: 1,
      gender: "unisex",
      status: "active",
      price: 850,
      compareAt: 950,
      cost: 450,
      codDeposit: 150,
      material: "72% Polyester, 21% Rayon, 7% Spandex",
      fit: "Athletic Fit",
      colours: JSON.stringify([
        { code: "navy", en: "Navy", ar: "كحلي", hex: "#172c52" },
        { code: "teal", en: "Teal", ar: "بترولي", hex: "#07516a" },
      ]),
      sizes: "XS, S, M, L, XL, XXL",
      imageUrl: "https://example.com/scrub-navy.jpg",
    };

    it("accepts valid product update data", () => {
      const parsed = updateProductSchema.safeParse(validProductData);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.productId).toBe(42);
        expect(parsed.data.slug).toBe("apex-performance-scrub-top");
        expect(parsed.data.price).toBe(850);
        expect(parsed.data.status).toBe("active");
      }
    });

    it("accepts archived status for product updates", () => {
      const parsed = updateProductSchema.safeParse({
        ...validProductData,
        status: "archived",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.status).toBe("archived");
      }
    });

    it("accepts empty string for compareAt and cost", () => {
      const parsed = updateProductSchema.safeParse({
        ...validProductData,
        compareAt: "",
        cost: "",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.compareAt).toBe("");
        expect(parsed.data.cost).toBe("");
      }
    });

    it("rejects compareAt when lower than base price", () => {
      const parsed = updateProductSchema.safeParse({
        ...validProductData,
        price: 850,
        compareAt: 800, // lower than price!
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const errorMessages = parsed.error.issues.map((i) => i.message);
        expect(
          errorMessages.some((msg) =>
            msg.includes(
              "Compare price must be equal to or higher than the price",
            ),
          ),
        ).toBe(true);
      }
    });

    it("rejects COD deposit higher than base price", () => {
      const parsed = updateProductSchema.safeParse({
        ...validProductData,
        price: 850,
        codDeposit: 900, // higher than price!
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const errorMessages = parsed.error.issues.map((i) => i.message);
        expect(
          errorMessages.some((msg) =>
            msg.includes(
              "The COD deposit cannot be higher than the product price",
            ),
          ),
        ).toBe(true);
      }
    });

    it("rejects invalid slugs with uppercase or special characters", () => {
      const invalidSlugs = [
        "Apex-Scrub", // uppercase
        "apex scrub", // spaces
        "apex_scrub", // underscores
        "-apex-scrub", // leading dash
        "apex-scrub-", // trailing dash
      ];

      for (const slug of invalidSlugs) {
        const parsed = updateProductSchema.safeParse({
          ...validProductData,
          slug,
        });
        expect(parsed.success).toBe(false);
      }
    });

    it("rejects non-positive productId", () => {
      const parsedZero = updateProductSchema.safeParse({
        ...validProductData,
        productId: 0,
      });
      expect(parsedZero.success).toBe(false);

      const parsedNegative = updateProductSchema.safeParse({
        ...validProductData,
        productId: -5,
      });
      expect(parsedNegative.success).toBe(false);
    });

    it("rejects negative base price", () => {
      const parsed = updateProductSchema.safeParse({
        ...validProductData,
        price: -10,
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("colour validation", () => {
    it("validates individual colour format and hex code", () => {
      const validColour = {
        code: "burgundy-deep",
        en: "Deep Burgundy",
        ar: "نبيتي داكن",
        hex: "#6F182F",
      };
      expect(colourItemSchema.safeParse(validColour).success).toBe(true);

      const invalidHex = {
        ...validColour,
        hex: "6F182F", // missing #
      };
      expect(colourItemSchema.safeParse(invalidHex).success).toBe(false);

      const invalidCode = {
        ...validColour,
        code: "Burgundy Deep!", // uppercase and special char
      };
      expect(colourItemSchema.safeParse(invalidCode).success).toBe(false);
    });

    it("enforces colour count between 1 and 12", () => {
      expect(colourListSchema.safeParse([]).success).toBe(false);

      const twelveColours = Array.from({ length: 12 }, (_, i) => ({
        code: `colour-${i}`,
        en: `Colour ${i}`,
        ar: `لون ${i}`,
        hex: "#123456",
      }));
      expect(colourListSchema.safeParse(twelveColours).success).toBe(true);

      const thirteenColours = Array.from({ length: 13 }, (_, i) => ({
        code: `colour-${i}`,
        en: `Colour ${i}`,
        ar: `لون ${i}`,
        hex: "#123456",
      }));
      expect(colourListSchema.safeParse(thirteenColours).success).toBe(false);
    });
  });

  describe("parseSizesString helper", () => {
    it("trims whitespace and deduplicates sizes correctly", () => {
      const input = " S , M,  L, XL , S , XXL, ";
      const result = parseSizesString(input);
      expect(result).toEqual(["S", "M", "L", "XL", "XXL"]);
    });

    it("handles empty or whitespace-only inputs", () => {
      expect(parseSizesString("")).toEqual([]);
      expect(parseSizesString("   ,  , ")).toEqual([]);
    });
  });

  describe("Product creation vs update schema comparison", () => {
    it("productSchema requires stock and lowStockThreshold, while updateProductSchema does not", () => {
      // updateProductSchema operates on existing product variants whose stock is adjusted separately or preserved
      const updateData = {
        productId: 10,
        locale: "en",
        slug: "classic-joggers",
        titleEn: "Classic Joggers",
        titleAr: "بناطيل كلاسيك",
        descriptionEn: "Comfortable medical scrub pants.",
        descriptionAr: "بنطلون سكراب طبي مريح.",
        categoryId: 2,
        gender: "women",
        status: "draft",
        price: 650,
        compareAt: "",
        cost: "",
        codDeposit: 100,
        material: "Poly-viscose",
        fit: "Jogger",
        colours: "[]",
        sizes: "S, M, L",
        imageUrl: "",
      };

      expect(updateProductSchema.safeParse(updateData).success).toBe(true);

      // productSchema requires stock
      const createData = { ...updateData };
      delete (createData as Record<string, unknown>).productId;
      expect(productSchema.safeParse(createData).success).toBe(false);
    });

    it("accepts updateProductSchema when imageUrl is omitted, empty, or a relative path", () => {
      const baseData = {
        productId: 10,
        locale: "en",
        slug: "classic-joggers",
        titleEn: "Classic Joggers",
        titleAr: "بناطيل كلاسيك",
        descriptionEn: "Comfortable medical scrub pants.",
        descriptionAr: "بنطلون سكراب طبي مريح.",
        categoryId: 2,
        gender: "women",
        status: "draft",
        price: 650,
        compareAt: "",
        cost: "",
        codDeposit: 100,
        material: "Poly-viscose",
        fit: "Jogger",
        colours: JSON.stringify([{ code: "navy", en: "Navy", ar: "كحلي", hex: "#172c52" }]),
        sizes: "S, M, L",
      };

      // 1. imageUrl is omitted entirely (like multi-image form submission)
      expect(updateProductSchema.safeParse(baseData).success).toBe(true);

      // 2. imageUrl is empty string
      expect(updateProductSchema.safeParse({ ...baseData, imageUrl: "" }).success).toBe(true);

      // 3. imageUrl is a relative path (e.g. catalog assets)
      expect(
        updateProductSchema.safeParse({
          ...baseData,
          imageUrl: "/images/scrub-vibe/female-design-2.webp",
        }).success,
      ).toBe(true);

      // 4. imageUrl is a full https URL
      expect(
        updateProductSchema.safeParse({
          ...baseData,
          imageUrl: "https://cdn.example.com/products/item.jpg",
        }).success,
      ).toBe(true);
    });
  });
});
