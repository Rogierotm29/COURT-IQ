import { describe, it, expect } from "vitest";
import { getNameColor, getNamePrefix, getBorderColor } from "./cosmetics";
import { SHOP_ITEMS } from "../data/shop";

// Tomamos llaves reales del catálogo por tipo, sin escribirlas a mano.
// Así los tests siguen valiendo aunque se renombren items.
const byType = (t) => SHOP_ITEMS.filter(i => i.type === t);
const COLORS  = byType("color");
const TITLES  = byType("title");
const BORDERS = byType("border");

const firstColor = COLORS[0];
const lastColor  = COLORS[COLORS.length - 1];
const firstTitle = TITLES[0];
const lastTitle  = TITLES[TITLES.length - 1];

describe("getNameColor", () => {
  it("regresa null cuando el usuario no tiene items", () => {
    expect(getNameColor([], {})).toBe(null);
  });

  it("regresa null cuando no se le pasa nada", () => {
    expect(getNameColor()).toBe(null);
  });

  it("usa el color equipado cuando el usuario sí lo posee", () => {
    const items = [firstColor.key, lastColor.key];
    const equipped = { color: firstColor.key };
    expect(getNameColor(items, equipped)).toBe(firstColor.value);
  });

  it("ignora un item equipado que el usuario no posee", () => {
    // Equipado apunta a lastColor, pero sólo tiene firstColor
    const result = getNameColor([firstColor.key], { color: lastColor.key });
    expect(result).toBe(firstColor.value);
    expect(result).not.toBe(lastColor.value);
  });

  it("cae al último item del catálogo que posea cuando no hay nada equipado", () => {
    const items = [firstColor.key, lastColor.key];
    expect(getNameColor(items, {})).toBe(lastColor.value);
  });

  it("no se confunde con items de otro tipo", () => {
    // Sólo tiene un título; no debería devolver color
    expect(getNameColor([firstTitle.key], {})).toBe(null);
  });

  it("soporta la llave legacy fire_color", () => {
    expect(getNameColor(["fire_color"], { color: "fire_color" })).toBe("#FF6B35");
  });
});

describe("getNamePrefix", () => {
  it("regresa string vacío cuando no hay items", () => {
    expect(getNamePrefix([], {})).toBe("");
  });

  it("regresa string vacío, no null, para poder concatenar", () => {
    // Importante: se usa como {prefix}{nombre} en el render
    expect(typeof getNamePrefix()).toBe("string");
  });

  it("agrega el emoji del título equipado con un espacio al final", () => {
    const result = getNamePrefix([firstTitle.key], { title: firstTitle.key });
    expect(result).toBe(firstTitle.emoji + " ");
    expect(result.endsWith(" ")).toBe(true);
  });

  it("ignora un título equipado que no posee", () => {
    const result = getNamePrefix([firstTitle.key], { title: lastTitle.key });
    expect(result).toBe(firstTitle.emoji + " ");
  });

  it("cae al último título del catálogo que posea", () => {
    const items = [firstTitle.key, lastTitle.key];
    expect(getNamePrefix(items, {})).toBe(lastTitle.emoji + " ");
  });

  it("soporta la llave legacy crown_badge", () => {
    expect(getNamePrefix(["crown_badge"], { title: "crown_badge" })).toBe("👑 ");
  });
});

describe("getBorderColor", () => {
  const solidBorder = BORDERS.find(b => b.value !== "rainbow");
  const rainbow     = BORDERS.find(b => b.value === "rainbow");

  it("regresa null cuando no hay items", () => {
    expect(getBorderColor([], {})).toBe(null);
  });

  it("usa el marco equipado cuando el usuario lo posee", () => {
    expect(getBorderColor([solidBorder.key], { border: solidBorder.key })).toBe(solidBorder.value);
  });

  it("devuelve un color sólido para el marco arcoíris", () => {
    // rainbow no es un color CSS válido; la función debe traducirlo
    const result = getBorderColor([rainbow.key], { border: rainbow.key });
    expect(result).not.toBe("rainbow");
    expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("soporta la llave legacy gold_border", () => {
    expect(getBorderColor(["gold_border"], { border: "gold_border" })).toBe("#FFB800");
  });

  it("no se confunde con items de otro tipo", () => {
    expect(getBorderColor([firstColor.key], {})).toBe(null);
  });
});

describe("las tres funciones son independientes entre sí", () => {
  it("un usuario con los tres tipos equipados obtiene los tres", () => {
    const border = BORDERS.find(b => b.value !== "rainbow");
    const items = [firstColor.key, firstTitle.key, border.key];
    const equipped = { color: firstColor.key, title: firstTitle.key, border: border.key };

    expect(getNameColor(items, equipped)).toBe(firstColor.value);
    expect(getNamePrefix(items, equipped)).toBe(firstTitle.emoji + " ");
    expect(getBorderColor(items, equipped)).toBe(border.value);
  });
});