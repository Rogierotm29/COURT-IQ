// /api/rosters.js — Rosters completos de los 30 equipos NBA
// ESPN no tiene un endpoint de "todos los jugadores", así que consultamos
// equipo por equipo y cacheamos el resultado por 6 horas.

const TEAM_IDS = {
  ATL:1, BOS:2, NOP:3, CHI:4, CLE:5, DAL:6, DEN:7, DET:8, GSW:9, HOU:10,
  IND:11, LAC:12, LAL:13, MIA:14, MIL:15, MIN:16, BKN:17, NYK:18, ORL:19, 
  PHI:20, PHX:21, POR:22, SAC:23, SAS:24, OKC:25, UTA:26, WAS:27, TOR:28, MEM:29, CHA:30,
};

let _cache = { data: null, at: 0 };
const TTL = 6 * 60 * 60 * 1000; // 6 horas

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=21600");

  const now = Date.now();
  if (_cache.data && now - _cache.at < TTL) {
    return res.json({ ok: true, players: _cache.data, cached: true });
  }

  const teams = Object.entries(TEAM_IDS).filter(([abbr]) => abbr !== "IND2");

  const results = await Promise.allSettled(teams.map(async ([abbr, id]) => {
    const r = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${id}/roster`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!r.ok) throw new Error(`ESPN ${r.status} para ${abbr}`);
    const data = await r.json();
    return (data.athletes || []).map(a => ({
      id: a.id,
      name: a.fullName || a.displayName,
      teamAbbr: abbr,
      pos: a.position?.abbreviation || "",
      jersey: a.jersey || "",
      height: a.displayHeight || "",
      weight: a.displayWeight || "",
      age: a.age ?? null,
      exp: a.experience?.years ?? null,
      headshot: a.headshot?.href || null,
    }));
  }));

  const players = results.filter(r => r.status === "fulfilled").flatMap(r => r.value);
  const failed = results.filter(r => r.status === "rejected");
  if (failed.length) console.warn(`rosters: ${failed.length} equipos fallaron`, failed[0].reason?.message);

  // Sólo cacheamos si trajimos la mayoría; si no, reintentamos en la próxima llamada
  if (players.length > 300) _cache = { data: players, at: now };

  return res.json({ ok: true, players, teamsFailed: failed.length });
}