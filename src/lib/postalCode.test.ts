import { describe, it, expect } from "vitest";
import {
  POSTAL_CODE_REGEX,
  isValidPostalCode,
  normalizePostalCode,
} from "./postalCode";

describe("postal code validation (client)", () => {
  describe("isValidPostalCode", () => {
    it("acepta exactamente 5 dígitos", () => {
      expect(isValidPostalCode("86000")).toBe(true);
      expect(isValidPostalCode("01000")).toBe(true);
    });

    it("rechaza menos de 5 dígitos", () => {
      expect(isValidPostalCode("")).toBe(false);
      expect(isValidPostalCode("123")).toBe(false);
      expect(isValidPostalCode("8600")).toBe(false);
    });

    it("rechaza más de 5 dígitos", () => {
      expect(isValidPostalCode("860000")).toBe(false);
    });

    it("rechaza valores con letras o símbolos", () => {
      expect(isValidPostalCode("8600A")).toBe(false);
      expect(isValidPostalCode("86-00")).toBe(false);
      expect(isValidPostalCode("86 00")).toBe(false);
      expect(isValidPostalCode("ABCDE")).toBe(false);
    });

    it("recorta espacios alrededor antes de validar", () => {
      expect(isValidPostalCode("  86000  ")).toBe(true);
    });
  });

  describe("normalizePostalCode", () => {
    it("elimina guiones, espacios y letras", () => {
      expect(normalizePostalCode("86-000")).toBe("86000");
      expect(normalizePostalCode("86 000")).toBe("86000");
      expect(normalizePostalCode("CP86000")).toBe("86000");
    });

    it("limita a 5 dígitos", () => {
      expect(normalizePostalCode("1234567890")).toBe("12345");
    });

    it("normaliza y luego valida correctamente", () => {
      expect(isValidPostalCode(normalizePostalCode("86-000"))).toBe(true);
      expect(isValidPostalCode(normalizePostalCode("12"))).toBe(false);
    });
  });

  it("la regex es la misma usada por el endpoint del servidor", () => {
    // Mismo patrón usado en supabase/functions/create-admin-order/index.ts
    expect(POSTAL_CODE_REGEX.source).toBe("^\\d{5}$");
  });
});
