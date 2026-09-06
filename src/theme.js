export const APP_URL = "court-iq-woad.vercel.app";

/* ═══ DESIGN TOKENS ═══ */

// Superficies — del fondo hacia arriba, cada nivel más claro
const surface = {
  0: "#0A0C10",   // fondo de la app
  1: "#111419",   // tarjetas
  2: "#181C23",   // elementos dentro de tarjetas
  3: "#20252E",   // hover, elevado
};

// Texto — jerarquía por contraste, no por color
const text = {
  primary:   "#E8EBF0",  // títulos, datos importantes
  secondary: "#9BA5B4",  // cuerpo, descripciones
  tertiary:  "#6B7686",  // etiquetas, metadatos
  disabled:  "#4A5261",
};

// Acento — un solo azul, tres intensidades
const accent = {
  base:   "#3B82F6",
  hover:  "#60A5FA",
  subtle: "#3B82F620",  // fondos suaves
  border: "#3B82F640",
};

// Semánticos — sólo para estado, nunca decoración
const success = { base:"#22C55E", subtle:"#22C55E18", border:"#22C55E38" };
const danger  = { base:"#EF4444", subtle:"#EF444418", border:"#EF444438" };
const warning = { base:"#F59E0B", subtle:"#F59E0B18", border:"#F59E0B38" };

// Bordes
const border = {
  subtle: "#1E242D",
  base:   "#2A313C",
  strong: "#3A424F",
};

// Escala tipográfica — 7 tamaños, no 25
const font = {
  xs: 11, sm: 13, base: 15, lg: 18, xl: 22, "2xl": 30, "3xl": 44,
};

// Espaciado — múltiplos de 4
const space = { 1:4, 2:8, 3:12, 4:16, 5:24, 6:32, 7:48, 8:64 };

// Radios
const radius = { sm:6, base:10, lg:14, xl:20, full:9999 };

// Sombras
const shadow = {
  sm: "0 1px 2px #00000040",
  base: "0 4px 12px #00000050",
  lg: "0 12px 32px #00000060",
};

export const T = { surface, text, accent, success, danger, warning, border, font, space, radius, shadow };

/* ═══ COMPATIBILIDAD ═══
   Mapea los nombres viejos a los tokens nuevos para no romper
   los ~200 usos de C que existen hoy. Se irá retirando. */
export const C = {
  bg:     surface[0],
  card:   surface[1],
  border: border.base,
  muted:  text.tertiary,
  dim:    text.secondary,
  text:   text.primary,
  accent: accent.base,
};

