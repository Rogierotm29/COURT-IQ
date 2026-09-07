import { describe, it, expect } from "vitest";
import { calcWinPct, dynBase, dynPts } from "./scoring";

const STANDINGS = [
  { abbr:"OKC", w:60, l:10 },  // .857
  { abbr:"WAS", w:15, l:55 },  // .214
  { abbr:"BOS", w:35, l:35 },  // .500
  { abbr:"MIA", w:35, l:35 },  // .500
  { abbr:"NEW", w:0,  l:0  },  // sin partidos
];

const game = (over={}) => ({ home:"OKC", away:"WAS", status:"Upcoming", homeScore:0, awayScore:0, ...over });

describe("dynBase", () => {
  it("da 10 puntos cuando el partido está parejo", () => {
    expect(dynBase(50)).toBe(10);
  });

  it("da menos puntos mientras más favorito sea el equipo", () => {
    expect(dynBase(70)).toBe(6);
    expect(dynBase(90)).toBe(3);
  });

  it("da más puntos mientras más underdog sea", () => {
    expect(dynBase(30)).toBe(14);
    expect(dynBase(10)).toBe(18);
  });

  it("nunca baja de 3 ni sube de 18", () => {
    expect(dynBase(100)).toBe(3);
    expect(dynBase(0)).toBe(18);
    expect(dynBase(999)).toBe(3);
    expect(dynBase(-999)).toBe(18);
  });
});

describe("dynPts", () => {
  it("multiplica la base por la confianza", () => {
    expect(dynPts(50, 1)).toBe(10);
    expect(dynPts(50, 2)).toBe(20);
    expect(dynPts(50, 3)).toBe(30);
  });

  it("usa confianza 1 por defecto", () => {
    expect(dynPts(50)).toBe(dynPts(50, 1));
  });
});

describe("calcWinPct", () => {
  describe("sin standings", () => {
    it("regresa 50 cuando no hay datos", () => {
      expect(calcWinPct(game(), "home", [])).toBe(50);
      expect(calcWinPct(game(), "home", null)).toBe(50);
      expect(calcWinPct(game(), "home", undefined)).toBe(50);
    });
  });

  describe("partido terminado", () => {
    it("da 100 al ganador y 0 al perdedor", () => {
      const g = game({ status:"Final", homeScore:110, awayScore:98 });
      expect(calcWinPct(g, "home", STANDINGS)).toBe(100);
      expect(calcWinPct(g, "away", STANDINGS)).toBe(0);
    });

    it("trata el empate como derrota para ambos lados", () => {
      // Un empate no existe en la NBA, pero la función no debe romperse
      const g = game({ status:"Final", homeScore:100, awayScore:100 });
      expect(calcWinPct(g, "home", STANDINGS)).toBe(0);
      expect(calcWinPct(g, "away", STANDINGS)).toBe(0);
    });
  });

  describe("partido en vivo", () => {
    it("sube el porcentaje del equipo que va ganando", () => {
      const g = game({ status:"LIVE", homeScore:60, awayScore:50 });
      expect(calcWinPct(g, "home", STANDINGS)).toBe(75);   // 50 + 10*2.5
      expect(calcWinPct(g, "away", STANDINGS)).toBe(25);   // 50 - 10*2.5
    });

    it("da 50 cuando el marcador está empatado", () => {
      const g = game({ status:"LIVE", homeScore:80, awayScore:80 });
      expect(calcWinPct(g, "home", STANDINGS)).toBe(50);
    });

    it("no pasa de 95 ni baja de 5 con diferencias grandes", () => {
      const g = game({ status:"LIVE", homeScore:130, awayScore:60 });
      expect(calcWinPct(g, "home", STANDINGS)).toBe(95);
      expect(calcWinPct(g, "away", STANDINGS)).toBe(5);
    });
  });

  describe("partido próximo", () => {
    it("favorece al equipo con mejor récord", () => {
      const pct = calcWinPct(game(), "home", STANDINGS); // OKC .857 vs WAS .214
      expect(pct).toBeGreaterThan(70);
    });

    it("los dos lados suman 100", () => {
      const home = calcWinPct(game(), "home", STANDINGS);
      const away = calcWinPct(game(), "away", STANDINGS);
      expect(home + away).toBe(100);
    });

    it("da ventaja al local cuando los récords son iguales", () => {
      const g = game({ home:"BOS", away:"MIA" });
      expect(calcWinPct(g, "home", STANDINGS)).toBeGreaterThan(50);
    });

    it("asume .500 para equipos que no están en los standings", () => {
      const g = game({ home:"XXX", away:"YYY" });
      expect(calcWinPct(g, "home", STANDINGS)).toBeGreaterThan(50); // sólo la ventaja de local
      expect(calcWinPct(g, "home", STANDINGS)).toBeLessThan(56);
    });

    it("no divide entre cero con equipos sin partidos jugados", () => {
      const g = game({ home:"NEW", away:"NEW" });
      expect(() => calcWinPct(g, "home", STANDINGS)).not.toThrow();
      expect(calcWinPct(g, "home", STANDINGS)).toBeGreaterThan(0);
    });
  });
});