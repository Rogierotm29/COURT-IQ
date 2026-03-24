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
              const { name, emoji, pin } = body;
              if (!name) return res.json({ ok: false, error: "Nombre requerido" });
              if (!pin || pin.length !== 4) return res.json({ ok: false, error: "PIN de 4 dígitos requerido" });
              // Check if user exists
              const existing = await supabase("users", {
                filters: `?name=eq.${encodeURIComponent(name.trim())}&limit=1`,
              });
              if (existing && existing.length > 0) {
                // Verify PIN
                if (existing[0].pin !== pin) {
                  return res.json({ ok: false, error: "PIN incorrecto" });
                }
                return res.json({ ok: true, user: existing[0], reconnected: true });
              }
              // Create new user with PIN
              const [user] = await supabase("users", {
                method: "POST",
                body: { name: name.trim(), avatar_emoji: emoji || "🏀", pin },
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

      // ─── BRACKET: Save pick ─────────────────────────────
      case "bracketPick": {
        const { userId, matchupId, round, teamA, teamB, predictedWinner, predictedGames } = body;
        if (!userId || !matchupId || !predictedWinner) return res.json({ ok: false, error: "Faltan datos" });
        const existing = await supabase("bracket_picks", {
          filters: `?user_id=eq.${userId}&matchup_id=eq.${matchupId}`,
        });
        if (existing?.length) {
          await supabase(`bracket_picks?id=eq.${existing[0].id}`, {
            method: "PATCH",
            body: { predicted_winner: predictedWinner, predicted_games: predictedGames || 4 },
          });
          return res.json({ ok: true, updated: true });
        }
        const [pick] = await supabase("bracket_picks", {
          method: "POST",
          body: { user_id: userId, matchup_id: matchupId, round, team_a: teamA, team_b: teamB, predicted_winner: predictedWinner, predicted_games: predictedGames || 4 },
        });
        return res.json({ ok: true, pick });
      }

      // ─── BRACKET: Get my picks ──────────────────────────
      case "myBracketPicks": {
        const { userId } = req.query;
        if (!userId) return res.json({ ok: false, error: "userId requerido" });
        const picks = await supabase("bracket_picks", {
          filters: `?user_id=eq.${userId}&order=created_at.asc`,
        });
        return res.json({ ok: true, picks: picks || [] });
      }

      // ─── BRACKET: Save MVP pick ─────────────────────────
      case "mvpPick": {
        const { userId, playerName, playerTeam } = body;
        if (!userId || !playerName) return res.json({ ok: false, error: "Faltan datos" });
        const existing = await supabase("mvp_picks", {
          filters: `?user_id=eq.${userId}`,
        });
        if (existing?.length) {
          await supabase(`mvp_picks?id=eq.${existing[0].id}`, {
            method: "PATCH",
            body: { player_name: playerName, player_team: playerTeam },
          });
          return res.json({ ok: true, updated: true });
        }
        const [pick] = await supabase("mvp_picks", {
          method: "POST",
          body: { user_id: userId, player_name: playerName, player_team: playerTeam },
        });
        return res.json({ ok: true, pick });
      }

      // ─── BRACKET: Get MVP pick ──────────────────────────
      case "myMvpPick": {
        const { userId } = req.query;
        if (!userId) return res.json({ ok: false, error: "userId requerido" });
        const picks = await supabase("mvp_picks", {
          filters: `?user_id=eq.${userId}&limit=1`,
        });
        return res.json({ ok: true, pick: picks?.[0] || null });
      }

      // ─── BRACKET: Leaderboard ───────────────────────────
      case "bracketLeaderboard": {
        const rows = await supabase("bracket_leaderboard", {
          filters: `?order=total_points.desc`,
        });
        return res.json({ ok: true, leaderboard: rows || [] });
      }

      // ─── BRACKET: Admin score a matchup ─────────────────
      case "scoreMatchup": {
        const { matchupId, actualWinner, actualGames } = body;
        if (!matchupId || !actualWinner) return res.json({ ok: false, error: "Faltan datos" });
        const picks = await supabase("bracket_picks", {
          filters: `?matchup_id=eq.${matchupId}&scored=eq.false`,
        });
        let scored = 0;
        for (const pick of (picks || [])) {
          let points = 0;
          const correctWinner = pick.predicted_winner === actualWinner;
          if (correctWinner) points += 10;
          if (correctWinner && pick.predicted_games === actualGames) points += 5;
          if (pick.round === "finals" && correctWinner) points += 15;
          await supabase(`bracket_picks?id=eq.${pick.id}`, {
            method: "PATCH",
            body: { actual_winner: actualWinner, actual_games: actualGames, points, scored: true },
          });
          scored++;
        }
        return res.json({ ok: true, scored });
      }

      // ─── BRACKET: Admin score MVP ───────────────────────
      case "scoreMvp": {
        const { actualMvp } = body;
        if (!actualMvp) return res.json({ ok: false, error: "actualMvp requerido" });
        const picks = await supabase("mvp_picks", {
          filters: `?scored=eq.false`,
        });
        let scored = 0;
        for (const pick of (picks || [])) {
          const correct = pick.player_name.toLowerCase() === actualMvp.toLowerCase();
          await supabase(`mvp_picks?id=eq.${pick.id}`, {
            method: "PATCH",
            body: { actual_mvp: actualMvp, points: correct ? 15 : 0, scored: true },
          });
          scored++;
        }
        return res.json({ ok: true, scored });
      }

      // ─── CHECK USERNAME ───────────────────────────────────
      case "checkUsername": {
        const { name } = req.query;
        if (!name) return res.json({ ok: false, error: "Nombre requerido" });
        const existing = await supabase("users", {
          filters: `?name=eq.${encodeURIComponent(name.trim())}&limit=1`,
        });
        return res.json({ ok: true, available: !existing?.length });
      }

      // ─── PICK HISTORY (last 7 days) ───────────────────────
      case "pickHistory": {
        const { userId, groupId } = req.query;
        if (!userId || !groupId) return res.json({ ok: false, error: "userId y groupId requeridos" });
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const picks = await supabase("picks", {
          filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&game_date=gte.${cutoff.toISOString().split("T")[0]}&order=game_date.desc,created_at.desc&limit=100`,
        });
        return res.json({ ok: true, picks: picks || [] });
      }

      // ─── GROUP PICKS (all members today) ──────────────────
      case "groupPicks": {
        const { groupId, date } = req.query;
        if (!groupId) return res.json({ ok: false, error: "groupId requerido" });
        const queryDate = date || new Date().toISOString().split("T")[0];
        const picks = await supabase("picks", {
          filters: `?group_id=eq.${groupId}&game_date=eq.${queryDate}&select=*,users(name,avatar_emoji)&order=created_at.asc`,
        });
        return res.json({ ok: true, picks: picks || [] });
      }

      // ─── WILDCARD STATUS ──────────────────────────────────
      case "wildcardStatus": {
        const { userId, groupId } = req.query;
        if (!userId || !groupId) return res.json({ ok: false, error: "Faltan datos" });
        const today = new Date().toISOString().split("T")[0];
        const rows = await supabase("wildcards", {
          filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&date=eq.${today}`,
        });
        return res.json({ ok: true, used: rows?.length > 0, wildcard: rows?.[0] || null });
      }

      // ─── USE WILDCARD ──────────────────────────────────────
      case "useWildcard": {
        const { userId, groupId, gameId, pickedTeam, homeTeam, awayTeam } = body;
        if (!userId || !groupId || !gameId || !pickedTeam) return res.json({ ok: false, error: "Faltan datos" });
        const today = new Date().toISOString().split("T")[0];
        const already = await supabase("wildcards", {
          filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&date=eq.${today}`,
        });
        if (already?.length) return res.json({ ok: false, error: "Ya usaste el comodín hoy" });
        const existingPick = await supabase("picks", {
          filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&game_id=eq.${gameId}`,
        });
        if (existingPick?.length) {
          await supabase(`picks?id=eq.${existingPick[0].id}`, {
            method: "PATCH",
            body: { picked_team: pickedTeam, is_wildcard: true },
          });
        } else {
          await supabase("picks", {
            method: "POST",
            body: { user_id: userId, group_id: groupId, game_id: gameId, game_date: today, picked_team: pickedTeam, home_team: homeTeam, away_team: awayTeam, is_wildcard: true },
          });
        }
        await supabase("wildcards", {
          method: "POST",
          body: { user_id: userId, group_id: groupId, date: today, game_id: gameId },
        });
        return res.json({ ok: true });
      }

      // ─── PERIOD LEADERBOARD (week/month/season) ───────────
      case "periodLeaderboard": {
        const { groupId, period } = req.query;
        if (!groupId) return res.json({ ok: false, error: "groupId requerido" });
        let cutoff;
        const now = new Date();
        if (period === "week") { const d = new Date(now); d.setDate(d.getDate() - 7); cutoff = d.toISOString().split("T")[0]; }
        else if (period === "month") { const d = new Date(now); d.setDate(d.getDate() - 30); cutoff = d.toISOString().split("T")[0]; }
        else { cutoff = "2025-10-01"; }
        const picks = await supabase("picks", {
          filters: `?group_id=eq.${groupId}&game_date=gte.${cutoff}&scored=eq.true&select=user_id,correct,points,users(name,avatar_emoji)&limit=500`,
        });
        const agg = {};
        for (const p of (picks || [])) {
          if (!agg[p.user_id]) agg[p.user_id] = { user_id: p.user_id, name: p.users?.name, avatar_emoji: p.users?.avatar_emoji, correct: 0, total: 0, points: 0 };
          agg[p.user_id].total++;
          if (p.correct) { agg[p.user_id].correct++; agg[p.user_id].points += p.points || 10; }
        }
        const lb = Object.values(agg).sort((a, b) => b.points - a.points).map((r, i) => ({
          ...r, rank: i + 1, accuracy: r.total > 0 ? Math.round(r.correct / r.total * 100) : 0,
        }));
        return res.json({ ok: true, leaderboard: lb });
      }

      // ─── DAILY WINNER ──────────────────────────────────────
      case "dailyWinner": {
        const { groupId, date } = req.query;
        if (!groupId) return res.json({ ok: false, error: "groupId requerido" });
        const queryDate = date || new Date().toISOString().split("T")[0];
        const picks = await supabase("picks", {
          filters: `?group_id=eq.${groupId}&game_date=eq.${queryDate}&scored=eq.true&select=user_id,correct,points,users(name,avatar_emoji)`,
        });
        const agg = {};
        for (const p of (picks || [])) {
          if (!agg[p.user_id]) agg[p.user_id] = { user_id: p.user_id, name: p.users?.name, avatar_emoji: p.users?.avatar_emoji, correct: 0, total: 0, points: 0 };
          agg[p.user_id].total++;
          if (p.correct) { agg[p.user_id].correct++; agg[p.user_id].points += p.points || 10; }
        }
        const sorted = Object.values(agg).sort((a, b) => b.points - a.points || b.correct - a.correct);
        return res.json({ ok: true, winner: sorted[0] || null, all: sorted });
      }

      // ─── COIN BALANCE ──────────────────────────────────────
      case "getBalance": {
        const { userId, groupId } = req.query;
        if (!userId || !groupId) return res.json({ ok: false, error: "Faltan datos" });
        const today = new Date().toISOString().split("T")[0];
        const rows = await supabase("coin_balances", {
          filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&limit=1`,
        });
        if (!rows?.length) {
          await supabase("coin_balances", {
            method: "POST",
            body: { user_id: userId, group_id: groupId, balance: 500, last_reset_date: today },
          });
          return res.json({ ok: true, balance: 500, isNew: true });
        }
        let { balance, last_reset_date, id } = rows[0];
        if (last_reset_date !== today && balance < 200) {
          balance = Math.min(balance + 100, 500);
          await supabase(`coin_balances?id=eq.${id}`, { method: "PATCH", body: { balance, last_reset_date: today } });
        }
        return res.json({ ok: true, balance });
      }

      // ─── CREATE BET ────────────────────────────────────────
      case "createBet": {
        const { userId, groupId, gameId, amount, pickedTeam, homeTeam, awayTeam } = body;
        if (!userId || !groupId || !gameId || !amount || !pickedTeam) return res.json({ ok: false, error: "Faltan datos" });
        const rows = await supabase("coin_balances", { filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&limit=1` });
        if (!rows?.length || rows[0].balance < amount) return res.json({ ok: false, error: "Saldo insuficiente" });
        await supabase(`coin_balances?user_id=eq.${userId}&group_id=eq.${groupId}`, {
          method: "PATCH", body: { balance: rows[0].balance - amount },
        });
        const [bet] = await supabase("bets", {
          method: "POST",
          body: { requester_id: userId, group_id: groupId, game_id: gameId, amount: parseInt(amount), picked_team: pickedTeam, home_team: homeTeam, away_team: awayTeam, status: "open" },
        });
        return res.json({ ok: true, bet });
      }

      // ─── ACCEPT BET ────────────────────────────────────────
      case "acceptBet": {
        const { userId, betId } = body;
        if (!userId || !betId) return res.json({ ok: false, error: "Faltan datos" });
        const bets = await supabase("bets", { filters: `?id=eq.${betId}` });
        if (!bets?.length) return res.json({ ok: false, error: "Apuesta no encontrada" });
        const bet = bets[0];
        if (bet.status !== "open") return res.json({ ok: false, error: "Apuesta ya no disponible" });
        if (bet.requester_id === userId) return res.json({ ok: false, error: "No puedes aceptar tu propia apuesta" });
        const rows = await supabase("coin_balances", { filters: `?user_id=eq.${userId}&group_id=eq.${bet.group_id}&limit=1` });
        if (!rows?.length || rows[0].balance < bet.amount) return res.json({ ok: false, error: "Saldo insuficiente" });
        await supabase(`coin_balances?user_id=eq.${userId}&group_id=eq.${bet.group_id}`, {
          method: "PATCH", body: { balance: rows[0].balance - bet.amount },
        });
        await supabase(`bets?id=eq.${betId}`, { method: "PATCH", body: { opponent_id: userId, status: "active" } });
        return res.json({ ok: true });
      }

      // ─── CANCEL BET ────────────────────────────────────────
      case "cancelBet": {
        const { userId, betId } = body;
        if (!userId || !betId) return res.json({ ok: false, error: "Faltan datos" });
        const bets = await supabase("bets", { filters: `?id=eq.${betId}&requester_id=eq.${userId}&status=eq.open` });
        if (!bets?.length) return res.json({ ok: false, error: "No puedes cancelar esta apuesta" });
        const bet = bets[0];
        const rows = await supabase("coin_balances", { filters: `?user_id=eq.${userId}&group_id=eq.${bet.group_id}&limit=1` });
        if (rows?.length) {
          await supabase(`coin_balances?user_id=eq.${userId}&group_id=eq.${bet.group_id}`, {
            method: "PATCH", body: { balance: rows[0].balance + bet.amount },
          });
        }
        await supabase(`bets?id=eq.${betId}`, { method: "PATCH", body: { status: "cancelled" } });
        return res.json({ ok: true });
      }

      // ─── GROUP BETS ────────────────────────────────────────
      case "groupBets": {
        const { groupId } = req.query;
        if (!groupId) return res.json({ ok: false, error: "groupId requerido" });
        const bets = await supabase("bets", {
          filters: `?group_id=eq.${groupId}&status=in.(open,active)&order=created_at.desc&limit=50`,
        });
        return res.json({ ok: true, bets: bets || [] });
      }

      // ─── SETTLE BETS (auto-score after games finish) ───────
      case "settleBets": {
        const activeBets = await supabase("bets", { filters: `?status=eq.active&limit=100` });
        if (!activeBets?.length) return res.json({ ok: true, settled: 0 });
        const espnRes = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard");
        const espnData = await espnRes.json();
        const finished = {};
        (espnData.events || []).forEach((e) => {
          const comp = e.competitions?.[0];
          if (!comp?.status?.type?.completed) return;
          const home = comp.competitors?.find((c) => c.homeAway === "home");
          const away = comp.competitors?.find((c) => c.homeAway === "away");
          const winner = parseInt(home?.score || 0) > parseInt(away?.score || 0) ? fix(home?.team?.abbreviation) : fix(away?.team?.abbreviation);
          finished[e.id] = winner;
        });
        let settled = 0;
        for (const bet of activeBets) {
          const winner = finished[bet.game_id];
          if (!winner) continue;
          const winnerId = bet.picked_team === winner ? bet.requester_id : bet.opponent_id;
          const winRows = await supabase("coin_balances", { filters: `?user_id=eq.${winnerId}&group_id=eq.${bet.group_id}&limit=1` });
          if (winRows?.length) {
            await supabase(`coin_balances?user_id=eq.${winnerId}&group_id=eq.${bet.group_id}`, {
              method: "PATCH", body: { balance: winRows[0].balance + bet.amount * 2 },
            });
          }
          await supabase(`bets?id=eq.${bet.id}`, { method: "PATCH", body: { status: "settled", winner_id: winnerId, actual_winner: winner } });
          settled++;
        }
        return res.json({ ok: true, settled });
      }

      // ─── SUBSCRIBE PUSH ────────────────────────────────────
      case "subscribePush": {
        const { userId, subscription } = body;
        if (!userId || !subscription?.endpoint) return res.json({ ok: false, error: "Faltan datos" });
        const existing = await supabase("push_subscriptions", {
          filters: `?user_id=eq.${userId}&limit=1`,
        });
        if (existing?.length) {
          await supabase(`push_subscriptions?id=eq.${existing[0].id}`, {
            method: "PATCH",
            body: { endpoint: subscription.endpoint, p256dh: subscription.keys?.p256dh, auth: subscription.keys?.auth },
          });
        } else {
          await supabase("push_subscriptions", {
            method: "POST",
            body: { user_id: userId, endpoint: subscription.endpoint, p256dh: subscription.keys?.p256dh, auth: subscription.keys?.auth },
          });
        }
        return res.json({ ok: true });
      }

      case "unsubscribePush": {
        const { userId } = body;
        if (!userId) return res.json({ ok: false, error: "userId requerido" });
        await supabase(`push_subscriptions?user_id=eq.${userId}`, { method: "DELETE" });
        return res.json({ ok: true });
      }

      // ─── NOTIFICATION PREFS ────────────────────────────────
      case "getNotifPrefs": {
        const { userId } = req.query;
        if (!userId) return res.json({ ok: false, error: "userId requerido" });
        const rows = await supabase("notification_prefs", { filters: `?user_id=eq.${userId}&limit=1` });
        return res.json({ ok: true, prefs: rows?.[0] || { picks_reminder: true, win_notify: true, loss_notify: true, daily_summary: true } });
      }

      case "setNotifPrefs": {
        const { userId, picks_reminder, win_notify, loss_notify, daily_summary } = body;
        if (!userId) return res.json({ ok: false, error: "userId requerido" });
        const existing = await supabase("notification_prefs", { filters: `?user_id=eq.${userId}&limit=1` });
        if (existing?.length) {
          await supabase(`notification_prefs?id=eq.${existing[0].id}`, {
            method: "PATCH", body: { picks_reminder, win_notify, loss_notify, daily_summary },
          });
        } else {
          await supabase("notification_prefs", {
            method: "POST", body: { user_id: userId, picks_reminder, win_notify, loss_notify, daily_summary },
          });
        }
        return res.json({ ok: true });
      }

      // ─── SEND PUSH NOTIFICATIONS (called by cron) ─────────
      case "sendNotification": {
        const webpush = await import("web-push");
        const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
        const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
        if (!VAPID_PUBLIC || !VAPID_PRIVATE) return res.json({ ok: false, error: "VAPID keys no configuradas" });
        webpush.default.setVapidDetails("mailto:courtiq@app.com", VAPID_PUBLIC, VAPID_PRIVATE);

        const { notifType, groupId: nGroupId } = body;
        let targetUserIds = [];
        let notifData = {};

        if (notifType === "picks_reminder") {
          // Send to all users in group who haven't picked yet
          notifData = { title: "⏰ ¡Faltan 30 minutos!", body: "Haz tus picks antes de que empiece el primer partido", tag: "reminder" };
          const members = await supabase("group_members", { filters: `?group_id=eq.${nGroupId}&select=user_id` });
          targetUserIds = (members || []).map((m) => m.user_id);
        } else if (notifType === "daily_summary") {
          const { userId: sUserId, correct, total, points } = body;
          targetUserIds = [sUserId];
          const pct = total > 0 ? Math.round(correct / total * 100) : 0;
          notifData = { title: "📊 Resumen del día", body: `Atinaste ${correct}/${total} picks · ${pct}% precisión · +${points} pts`, tag: "summary" };
        }

        let sent = 0;
        for (const uid of targetUserIds) {
          const subs = await supabase("push_subscriptions", { filters: `?user_id=eq.${uid}&limit=1` });
          if (!subs?.length) continue;
          const sub = { endpoint: subs[0].endpoint, keys: { p256dh: subs[0].p256dh, auth: subs[0].auth } };
          try {
            await webpush.default.sendNotification(sub, JSON.stringify(notifData));
            sent++;
          } catch (e) {
            if (e.statusCode === 410) {
              await supabase(`push_subscriptions?user_id=eq.${uid}`, { method: "DELETE" });
            }
          }
        }
        return res.json({ ok: true, sent });
      }

      default:
        return res.json({ ok: false, error: `Acción desconocida: ${action}` });
    }
  } catch (err) {
    console.error(`Pickem [${action}] error:`, err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
