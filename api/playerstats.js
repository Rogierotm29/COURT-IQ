// /api/playerstats.js — Estadísticas de un jugador bajo demanda.
// Evita traer las 450 de golpe: sólo pedimos las del jugador que se abre.

const _cache = new Map();          // playerId -> { data, at }
const TTL = 30 * 60 * 1000;        // 30 min
const MAX_ENTRIES = 200;           // techo para no crecer sin límite

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=900");

  const { playerId } = req.query;
  if (!playerId) return res.json({ ok: false, error: "playerId requerido" });

  const hit = _cache.get(playerId);
  if (hit && Date.now() - hit.at < TTL) {
    return res.json({ ok: true, stats: hit.data, cached: true });
  }

  try {
    const r = await fetch(
      `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/stats`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) throw new Error(`ESPN ${r.status}`);
    const data = await r.json();

    // Buscamos el bloque de promedios de la temporada regular actual
    const cat = data.categories?.find(c => c.name === "averages")
             || data.categories?.[0];
    const split = cat?.statistics?.[0] || cat?.splits?.[0];
    const names = cat?.names || [];
    const values = split?.stats || [];


    const pick = (key) => {
      const i = names.indexOf(key);
      return i >= 0 ? parseFloat(values[i]) : null;
    };

    const stats = {
      gp:     pick("gamesPlayed"),
      gs:     pick("gamesStarted"),
      min:    pick("avgMinutes"),
      pts:    pick("avgPoints"),
      reb:    pick("avgRebounds"),
      oreb:   pick("avgOffensiveRebounds"),
      dreb:   pick("avgDefensiveRebounds"),
      ast:    pick("avgAssists"),
      stl:    pick("avgSteals"),
      blk:    pick("avgBlocks"),
      to:     pick("avgTurnovers"),
      fouls:  pick("avgFouls"),
      fgPct:  pick("fieldGoalPct"),
      fg3Pct: pick("threePointFieldGoalPct"),
      ftPct:  pick("freeThrowPct"),
    };

    if (_cache.size >= MAX_ENTRIES) _cache.delete(_cache.keys().next().value);
    _cache.set(playerId, { data: stats, at: Date.now() });

    return res.json({ ok: true, stats });
  } catch (e) {
    console.warn(`playerstats[${playerId}]:`, e.message);
    return res.json({ ok: false, error: "No pudimos cargar las estadísticas" });
  }
}