// /api/standings.js — Proxy ESPN Standings (clasificaciones en vivo)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");

  const TM_CONF = {
    ATL:"E",BOS:"E",BKN:"E",CHA:"E",CHI:"E",CLE:"E",DET:"E",IND:"E",
    MIA:"E",MIL:"E",NYK:"E",ORL:"E",PHI:"E",TOR:"E",WAS:"E",
    DAL:"W",DEN:"W",GSW:"W",HOU:"W",LAC:"W",LAL:"W",MEM:"W",MIN:"W",
    NOP:"W",OKC:"W",PHX:"W",POR:"W",SAC:"W",SAS:"W",UTA:"W",
  };
  const TM_DIV = {
    ATL:"Southeast",BOS:"Atlantic",BKN:"Atlantic",CHA:"Southeast",CHI:"Central",
    CLE:"Central",DAL:"Southwest",DEN:"Northwest",DET:"Central",GSW:"Pacific",
    HOU:"Southwest",IND:"Central",LAC:"Pacific",LAL:"Pacific",MEM:"Southwest",
    MIA:"Southeast",MIL:"Central",MIN:"Northwest",NOP:"Southwest",NYK:"Atlantic",
    OKC:"Northwest",ORL:"Southeast",PHI:"Atlantic",PHX:"Pacific",POR:"Northwest",
    SAC:"Pacific",SAS:"Southwest",TOR:"Atlantic",UTA:"Northwest",WAS:"Southeast",
  };
  const FIX = { GS:"GSW",NY:"NYK",SA:"SAS",NO:"NOP",WSH:"WAS",
                UTAH:"UTA",CHAR:"CHA",PHO:"PHX",UTH:"UTA" };
  const fix = (a) => FIX[a] || a;

  try {
    const r = await fetch(
      "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings",
      { headers: { "User-Agent": "CourtIQ/1.0" } }
    );
    if (!r.ok) throw new Error(`ESPN ${r.status}`);
    const d = await r.json();

    const results = [];
    const walk = (node) => {
      if (node?.standings?.entries?.length) {
        node.standings.entries.forEach((entry) => {
          const abbr = fix(entry.team?.abbreviation || "");
          if (!TM_CONF[abbr]) return;

          const sm = {};
          (entry.stats || []).forEach((s) => {
            sm[s.name] = s.value;
            if (s.abbreviation) sm[s.abbreviation] = s.value;
          });

          const w = Math.round(sm.wins ?? sm.W ?? 0);
          const l = Math.round(sm.losses ?? sm.L ?? 0);
          const streak = sm.streak ?? 0;
          const gb = sm.gamesBehind ?? sm.GB ?? 0;

          results.push({
            abbr,
            conf: TM_CONF[abbr],
            div: TM_DIV[abbr],
            w,
            l,
            pct: w + l > 0 ? +(w / (w + l)).toFixed(3) : 0,
            streak: `${Number(streak) >= 0 ? "W" : "L"}${Math.abs(Number(streak)) || 1}`,
            gb,
          });
        });
      }
      (node?.children || []).forEach(walk);
    };
    walk(d);

    // Sort by conference and wins
    results.sort((a, b) => b.w - a.w);

    return res.status(200).json({ ok: true, standings: results, ts: Date.now() });
  } catch (err) {
    console.error("Standings error:", err.message);
    return res.status(500).json({ ok: false, error: err.message, standings: [] });
  }
}
