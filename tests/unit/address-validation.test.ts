import { describe, expect, it } from "vitest";
import {
  formatAddressDisplay,
  mapAddressRowToDomain,
  type AddressRow,
} from "../../src/features/addresses/types";
import { addressInputSchema } from "../../src/features/addresses/validation";

describe("Customer Address Validation & Formatting", () => {
  it("validates and parses a valid clinic delivery address", () => {
    const input = {
      label: "clinic",
      recipientName: "Dr. Nourhan Tarek",
      phone: "01096733209",
      governorateCode: "cairo",
      cityCode: "nasr_city",
      city: "Nasr City",
      streetAddress: "15 Tayaran Street, Medical Complex",
      building: "Tower B",
      floor: "4",
      apartment: "Clinic 402",
      landmark: "Next to Specialized Hospital",
      isDefault: true,
    };

    const parsed = addressInputSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data.phone).toBe("+201096733209");
    expect(parsed.data.label).toBe("clinic");
    expect(parsed.data.recipientName).toBe("Dr. Nourhan Tarek");
    expect(parsed.data.isDefault).toBe(true);
    expect(parsed.data.customLabel).toBeNull();
  });

  it("normalizes Egyptian phone numbers with different prefixes", () => {
    const validPhones = [
      { raw: "01012345678", expected: "+201012345678" },
      { raw: "+201112345678", expected: "+201112345678" },
      { raw: "201212345678", expected: "+201212345678" },
      { raw: "00201512345678", expected: "+201512345678" },
    ];

    for (const { raw, expected } of validPhones) {
      const parsed = addressInputSchema.safeParse({
        label: "home",
        recipientName: "Test User",
        phone: raw,
        governorateCode: "giza",
        cityCode: "dokki",
        city: "Dokki",
        streetAddress: "10 Mossadak Street",
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.phone).toBe(expected);
      }
    }
  });

  it("rejects invalid phone numbers or too short street addresses", () => {
    const invalidPhoneResult = addressInputSchema.safeParse({
      label: "work",
      recipientName: "Test User",
      phone: "12345",
      governorateCode: "cairo",
      cityCode: "heliopolis",
      city: "Heliopolis",
      streetAddress: "123 Baghdad St",
    });
    expect(invalidPhoneResult.success).toBe(false);

    const shortAddressResult = addressInputSchema.safeParse({
      label: "home",
      recipientName: "Test User",
      phone: "01012345678",
      governorateCode: "cairo",
      cityCode: "maadi",
      city: "Maadi",
      streetAddress: "St",
    });
    expect(shortAddressResult.success).toBe(false);
  });

  it("supports custom label when label is 'other'", () => {
    const parsed = addressInputSchema.safeParse({
      label: "other",
      customLabel: "Central Diagnostic Lab",
      recipientName: "Lab Staff",
      phone: "01098765432",
      governorateCode: "alexandria",
      cityCode: "smouha",
      city: "Smouha",
      streetAddress: "10 Fawzy Moaz Street",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.label).toBe("other");
      expect(parsed.data.customLabel).toBe("Central Diagnostic Lab");
    }
  });

  it("maps address database rows into typed domain objects", () => {
    const row: AddressRow = {
      id: 42,
      user_id: "777e1111-2222-3333-4444-555566667777",
      label: "clinic",
      custom_label: null,
      recipient_name: "Dr. Karim",
      phone: "+201012345678",
      governorate_code: "cairo",
      city_code: "zamalek",
      city: "Zamalek",
      street_address: "26 July Corridor",
      building: "10",
      floor: "2",
      apartment: "Clinic 3",
      landmark: "Behind Club",
      is_default: true,
      created_at: "2026-09-08T06:00:00Z",
      updated_at: "2026-09-08T06:00:00Z",
    };

    const domain = mapAddressRowToDomain(row);
    expect(domain.id).toBe(42);
    expect(domain.userId).toBe(row.user_id);
    expect(domain.recipientName).toBe("Dr. Karim");
    expect(domain.isDefault).toBe(true);
    expect(domain.building).toBe("10");
  });

  it("formats delivery address string for English and Arabic locales", () => {
    const sample = {
      streetAddress: "15 Medical Center St",
      building: "12",
      floor: "3",
      apartment: "5",
      city: "Nasr City",
      landmark: "Al-Ahly Club",
    };

    const enDisplay = formatAddressDisplay(sample, "Cairo", "en");
    expect(enDisplay).toContain("Bldg 12");
    expect(enDisplay).toContain("Fl 3");
    expect(enDisplay).toContain("Apt/Clinic 5");
    expect(enDisplay).toContain("15 Medical Center St");
    expect(enDisplay).toContain("Nasr City");
    expect(enDisplay).toContain("Cairo");
    expect(enDisplay).toContain("(Near: Al-Ahly Club)");

    const arDisplay = formatAddressDisplay(sample, "القاهرة", "ar");
    expect(arDisplay).toContain("عمارة 12");
    expect(arDisplay).toContain("طابق 3");
    expect(arDisplay).toContain("شقة/عيادة 5");
    expect(arDisplay).toContain("القاهرة");
    expect(arDisplay).toContain("علامة مميزة");
  });
});
