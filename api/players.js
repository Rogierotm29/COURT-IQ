// /api/players.js — Proxy NBA.com Stats API (estadísticas por jugador)
// NBA.com requiere headers específicos que solo funcionan desde servidor
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");

  const FIX = { GS:"GSW",NY:"NYK",SA:"SAS",NO:"NOP",WSH:"WAS",
                UTAH:"UTA",CHAR:"CHA",PHO:"PHX",UTH:"UTA",GSW:"GSW" };
  const fix = (a) => FIX[a] || a;

  // ─── Intento 1: NBA.com Stats API (datos más completos) ─────────────
  try {
    const season = "2025-26";
    const url = `https://stats.nba.com/stats/leagueLeaders?LeagueID=00&PerMode=PerGame&Scope=S&Season=${season}&SeasonType=Regular+Season&StatCategory=PTS`;

    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.nba.com/",
        "Origin": "https://www.nba.com",
        "Accept": "application/json",
        "x-nba-stats-origin": "stats",
        "x-nba-stats-token": "true",
      },
    });

    if (!r.ok) throw new Error(`NBA.com ${r.status}`);
    const d = await r.json();

    const headers = d.resultSet?.headers || [];
    const rows = d.resultSet?.rowSet || [];

    if (!rows.length) throw new Error("empty NBA.com response");

    const idx = (name) => headers.indexOf(name);

    const players = rows.slice(0, 40).map((row, i) => {
      const teamRaw = row[idx("TEAM")] || row[idx("TEAM_ABBREVIATION")] || "";
      const teamAbbr = fix(teamRaw);
      return {
        id: i + 1,
        playerId: row[idx("PLAYER_ID")],
        name: row[idx("PLAYER")] || row[idx("PLAYER_NAME")] || "?",
        teamAbbr,
        gp: row[idx("GP")] || 0,
        min: row[idx("MIN")] || 0,
        pts: +(row[idx("PTS")] || 0).toFixed(1),
        ast: +(row[idx("AST")] || 0).toFixed(1),
        reb: +(row[idx("REB")] || 0).toFixed(1),
        stl: +(row[idx("STL")] || 0).toFixed(1),
        blk: +(row[idx("BLK")] || 0).toFixed(1),
        fgPct: +(((row[idx("FG_PCT")] || 0) * 100).toFixed(1)),
        fg3Pct: +(((row[idx("FG3_PCT")] || 0) * 100).toFixed(1)),
        ftPct: +(((row[idx("FT_PCT")] || 0) * 100).toFixed(1)),
      };
    });

    console.log(`✅ NBA.com stats: ${players.length} players`);
    return res.status(200).json({ ok: true, source: "nba.com", players, ts: Date.now() });
  } catch (err1) {
    console.warn("NBA.com failed:", err1.message);
  }

  // ─── Intento 2: ESPN Leaders API (datos parciales pero confiable) ───
  try {
    const r = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/leaders",
      { headers: { "User-Agent": "CourtIQ/1.0" } }
    );
    if (!r.ok) throw new Error(`ESPN ${r.status}`);
    const d = await r.json();

    const playerMap = {};

    (d.categories || []).forEach((cat) => {
      const key = cat.name?.toLowerCase() || "";
      const leaders = cat.leaders || [];

      leaders.slice(0, 40).forEach((leader) => {
        const ath = leader.athlete;
        if (!ath) return;
        const id = ath.id;
        const teamRaw = ath.team?.abbreviation || "";
        const teamAbbr = fix(teamRaw);

        if (!playerMap[id]) {
          playerMap[id] = {
            id: parseInt(id),
            name: ath.displayName || ath.fullName || "?",
            teamAbbr,
            pos: ath.position?.abbreviation || "—",
            pts: 0, ast: 0, reb: 0, stl: 0, blk: 0,
            fgPct: 0, fg3Pct: 0,
          };
        }

        const val = +(Number(leader.value || 0).toFixed(1));
        if (key.includes("point") || key.includes("scoring")) playerMap[id].pts = val;
        else if (key.includes("assist")) playerMap[id].ast = val;
        else if (key.includes("rebound")) playerMap[id].reb = val;
        else if (key.includes("steal")) playerMap[id].stl = val;
        else if (key.includes("block")) playerMap[id].blk = val;
      });
    });

    const players = Object.values(playerMap)
      .filter((p) => p.pts > 0)
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 40)
      .map((p, i) => ({ ...p, id: i + 1 }));

    console.log(`✅ ESPN leaders: ${players.length} players`);
    return res.status(200).json({ ok: true, source: "espn", players, ts: Date.now() });
  } catch (err2) {
    console.error("ESPN leaders failed:", err2.message);
    return res.status(500).json({ ok: false, error: "All sources failed", players: [] });
  }
}
