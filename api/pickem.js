// /api/pickem.js — Pick'em social system (Supabase backend)
// Handles: register, createGroup, joinGroup, myGroups, makePick, myPicks, leaderboard, scoreGames

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

async function supabase(path, { method = "GET", body, filters = "" } = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}${filters}`;
  const opts = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: method === "POST" ? "return=representation" : "return=minimal",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Supabase ${r.status}: ${text}`);
  }
  const ct = r.headers.get("content-type") || "";
  return ct.includes("json") ? r.json() : null;
}

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const FIX = { GS:"GSW",NY:"NYK",SA:"SAS",NO:"NOP",WSH:"WAS",UTAH:"UTA",CHAR:"CHA",PHO:"PHX",UTH:"UTA" };
const fix = (a) => FIX[a] || a;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ ok: false, error: "Supabase not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to Vercel env vars." });
  }

  const { action } = req.query;
  const body = req.method === "POST" ? req.body : {};

  try {
    switch (action) {
      // ─── REGISTER ─────────────────────────────────────────
      case "register": {
        const { name, emoji } = body;
        if (!name) return res.json({ ok: false, error: "Nombre requerido" });
        const [user] = await supabase("users", {
          method: "POST",
          body: { name: name.trim(), avatar_emoji: emoji || "🏀" },
        });
        return res.json({ ok: true, user });
      }

      // ─── GET USER ─────────────────────────────────────────
      case "getUser": {
        const { userId } = req.query;
        if (!userId) return res.json({ ok: false, error: "userId requerido" });
        const users = await supabase("users", { filters: `?id=eq.${userId}` });
        return res.json({ ok: true, user: users?.[0] || null });
      }

      // ─── CREATE GROUP ─────────────────────────────────────
      case "createGroup": {
        const { name, emoji, userId } = body;
        if (!name || !userId) return res.json({ ok: false, error: "name y userId requeridos" });
        const code = genCode();
        const [group] = await supabase("groups", {
          method: "POST",
          body: { name: name.trim(), code, emoji: emoji || "🏀", owner_id: userId },
        });
        // Auto-join owner
        await supabase("group_members", {
          method: "POST",
          body: { group_id: group.id, user_id: userId },
        });
        return res.json({ ok: true, group });
      }

      // ─── JOIN GROUP ───────────────────────────────────────
      case "joinGroup": {
        const { code, userId } = body;
        if (!code || !userId) return res.json({ ok: false, error: "code y userId requeridos" });
        const groups = await supabase("groups", { filters: `?code=eq.${code.toUpperCase().trim()}` });
        if (!groups?.length) return res.json({ ok: false, error: "Código inválido" });
        const group = groups[0];
        // Check if already member
        const existing = await supabase("group_members", {
          filters: `?group_id=eq.${group.id}&user_id=eq.${userId}`,
        });
        if (existing?.length) return res.json({ ok: true, group, already: true });
        await supabase("group_members", {
          method: "POST",
          body: { group_id: group.id, user_id: userId },
        });
        return res.json({ ok: true, group });
      }

      // ─── MY GROUPS ────────────────────────────────────────
      case "myGroups": {
        const { userId } = req.query;
        if (!userId) return res.json({ ok: false, error: "userId requerido" });
        const memberships = await supabase("group_members", {
          filters: `?user_id=eq.${userId}&select=group_id,groups(id,name,code,emoji,owner_id,created_at)`,
        });
        const groups = (memberships || []).map((m) => m.groups).filter(Boolean);
        // Get member count for each group
        for (const g of groups) {
          const members = await supabase("group_members", { filters: `?group_id=eq.${g.id}&select=user_id,users(name,avatar_emoji)` });
          g.members = (members || []).map((m) => ({ userId: m.user_id, ...m.users }));
          g.memberCount = g.members.length;
        }
        return res.json({ ok: true, groups });
      }

      // ─── MAKE PICK ────────────────────────────────────────
      case "makePick": {
        const { userId, groupId, gameId, gameDate, pickedTeam, homeTeam, awayTeam } = body;
        if (!userId || !groupId || !gameId || !pickedTeam)
          return res.json({ ok: false, error: "Faltan datos" });
        // Upsert (si ya existe, actualiza)
        const existing = await supabase("picks", {
          filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&game_id=eq.${gameId}`,
        });
        if (existing?.length) {
          // Update
          await supabase(`picks?id=eq.${existing[0].id}`, {
            method: "PATCH",
            body: { picked_team: pickedTeam },
          });
          return res.json({ ok: true, updated: true });
        }
        const [pick] = await supabase("picks", {
          method: "POST",
          body: {
            user_id: userId, group_id: groupId, game_id: gameId,
            game_date: gameDate || new Date().toISOString().split("T")[0],
            picked_team: pickedTeam, home_team: homeTeam, away_team: awayTeam,
          },
        });
        return res.json({ ok: true, pick });
      }

      // ─── MY PICKS ─────────────────────────────────────────
      case "myPicks": {
        const { userId, groupId, date } = req.query;
        if (!userId || !groupId) return res.json({ ok: false, error: "userId y groupId requeridos" });
        let filters = `?user_id=eq.${userId}&group_id=eq.${groupId}&order=created_at.desc&limit=50`;
        if (date) filters += `&game_date=eq.${date}`;
        const picks = await supabase("picks", { filters });
        return res.json({ ok: true, picks: picks || [] });
      }

      // ─── LEADERBOARD ──────────────────────────────────────
      case "leaderboard": {
        const { groupId } = req.query;
        if (!groupId) return res.json({ ok: false, error: "groupId requerido" });
        const rows = await supabase("leaderboard", {
          filters: `?group_id=eq.${groupId}&order=total_points.desc`,
        });
        return res.json({ ok: true, leaderboard: rows || [] });
      }

      // ─── SCORE GAMES (check ESPN for finished games, update picks) ──
      case "scoreGames": {
        const today = new Date().toISOString().split("T")[0];
        // Get unscored picks
        const unscored = await supabase("picks", {
          filters: `?scored=eq.false&game_date=lte.${today}&limit=200`,
        });
        if (!unscored?.length) return res.json({ ok: true, scored: 0 });

        // Fetch ESPN scoreboard
        const espnRes = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard");
        const espnData = await espnRes.json();
        const finishedGames = {};
        (espnData.events || []).forEach((e) => {
          const comp = e.competitions?.[0];
          if (!comp?.status?.type?.completed) return;
          const home = comp.competitors?.find((c) => c.homeAway === "home");
          const away = comp.competitors?.find((c) => c.homeAway === "away");
          const homeScore = parseInt(home?.score || 0);
          const awayScore = parseInt(away?.score || 0);
          const winner = homeScore > awayScore ? fix(home?.team?.abbreviation) : fix(away?.team?.abbreviation);
          finishedGames[e.id] = winner;
        });

        let scored = 0;
        for (const pick of unscored) {
          const winner = finishedGames[pick.game_id];
          if (!winner) continue;
          const correct = pick.picked_team === winner;
          await supabase(`picks?id=eq.${pick.id}`, {
            method: "PATCH",
            body: { correct, scored: true, points: correct ? 10 : 0 },
          });
          scored++;
        }

        return res.json({ ok: true, scored, gamesChecked: Object.keys(finishedGames).length });
      }

      default:
        return res.json({ ok: false, error: `Acción desconocida: ${action}` });
    }
  } catch (err) {
    console.error(`Pickem [${action}] error:`, err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
