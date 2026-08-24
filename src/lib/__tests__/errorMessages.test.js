import { describe, it, expect } from "vitest";
import { translateApiError } from "../errorMessages";

describe("translateApiError — dictionary", () => {
  const cases = [
    ["Email cannot be changed for existing registration.", "Email tidak bisa diubah untuk pendaftaran yang sudah ada."],
    ["Username already exists", "Username sudah digunakan. Coba username lain."],
    ["Email already registered", "Email sudah terdaftar. Gunakan email lain atau masuk."],
    ["This value already exists", "Data sudah terdaftar sebelumnya."],
    ["Too many requests", "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi."],
    ["User not found", "Data tidak ditemukan."],
    ["Token expired", "Sesi atau kode sudah kedaluwarsa. Silakan coba lagi."],
    ["Invalid credentials", "Data yang dimasukkan tidak valid."],
    ["Password is required", "Ada data wajib yang belum diisi."],
  ];

  it.each(cases)("%s → pesan Indonesia yang sesuai (bukan teks Inggris mentah)", (raw, expectedId) => {
    const result = translateApiError(raw);
    expect(result).not.toBe(raw);
    expect(result).toBe(expectedId);
  });

  it("pesan tidak dikenal → fallback generik", () => {
    expect(translateApiError("some totally unrecognized backend blip")).toBe(
      "Terjadi kesalahan. Silakan coba lagi."
    );
  });

  it("input kosong / non-string → fallback generik (tidak throw)", () => {
    expect(translateApiError("")).toBe("Terjadi kesalahan. Silakan coba lagi.");
    expect(translateApiError(null)).toBe("Terjadi kesalahan. Silakan coba lagi.");
    expect(translateApiError(undefined)).toBe("Terjadi kesalahan. Silakan coba lagi.");
    expect(translateApiError(42)).toBe("Terjadi kesalahan. Silakan coba lagi.");
  });

  it("pencocokan case-insensitive", () => {
    expect(translateApiError("EMAIL ALREADY EXISTS")).toBe(
      "Email sudah terdaftar. Gunakan email lain atau masuk."
    );
  });
});
