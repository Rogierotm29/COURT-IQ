// /api/scoreboard.js — Proxy ESPN Scoreboard (partidos del día)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

  try {
    const r = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
      { headers: { "User-Agent": "CourtIQ/1.0" } }
    );
    if (!r.ok) throw new Error(`ESPN ${r.status}`);
    const d = await r.json();

    const FIX = { GS:"GSW", NY:"NYK", SA:"SAS", NO:"NOP", WSH:"WAS",
                  UTAH:"UTA", CHAR:"CHA", PHO:"PHX", UTH:"UTA" };
    const fix = (a) => FIX[a] || a;

    const games = (d.events || []).map((e) => {
      const comp = e.competitions?.[0];
      const home = comp?.competitors?.find((c) => c.homeAway === "home");
      const away = comp?.competitors?.find((c) => c.homeAway === "away");
      const st = comp?.status?.type;
      const done = st?.completed || st?.state === "post";
      const live = st?.state === "in";

      return {
        id: e.id,
        home: fix(home?.team?.abbreviation),
        away: fix(away?.team?.abbreviation),
        homeScore: parseInt(home?.score || 0),
        awayScore: parseInt(away?.score || 0),
        status: done ? "Final" : live ? "LIVE" : "Upcoming",
        startTime: e.date || null,
        detail: live
          ? `Q${comp?.status?.period || "?"} ${comp?.status?.displayClock || ""}`
          : (done ? "Final" : st?.shortDetail || ""),
      };
    });

    return res.status(200).json({ ok: true, games, ts: Date.now() });
  } catch (err) {
    console.error("Scoreboard error:", err.message);
    return res.status(500).json({ ok: false, error: err.message, games: [] });
  }
}
