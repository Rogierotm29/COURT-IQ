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

// Grant achievement silently (unique constraint prevents duplicates)
async function grantAchievement(userId, key) {
  try {
    await supabase("user_achievements", { method: "POST", body: { user_id: userId, achievement_key: key } });
  } catch (_) {}
}

const FIX = { GS:"GSW",NY:"NYK",SA:"SAS",NO:"NOP",WSH:"WAS",UTAH:"UTA",CHAR:"CHA",PHO:"PHX",UTH:"UTA" };
const fix = (a) => FIX[a] || a;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
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
        grantAchievement(userId, "joined_group");
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
        const { userId, groupId, gameId, gameDate, pickedTeam, homeTeam, awayTeam, confidence } = body;
        if (!userId || !groupId || !gameId || !pickedTeam)
          return res.json({ ok: false, error: "Faltan datos" });
        const conf = Math.min(3, Math.max(1, parseInt(confidence) || 1));
        const existing = await supabase("picks", {
          filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&game_id=eq.${gameId}`,
        });
        if (existing?.length) {
          await supabase(`picks?id=eq.${existing[0].id}`, {
            method: "PATCH", body: { picked_team: pickedTeam, confidence: conf },
          });
          return res.json({ ok: true, updated: true });
        }
        const [pick] = await supabase("picks", {
          method: "POST",
          body: {
            user_id: userId, group_id: groupId, game_id: gameId,
            game_date: gameDate || new Date().toISOString().split("T")[0],
            picked_team: pickedTeam, home_team: homeTeam, away_team: awayTeam, confidence: conf,
          },
        });
        grantAchievement(userId, "first_pick");
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
        // Query members directly — no dependency on the view
        const members = await supabase("group_members", { filters: `?group_id=eq.${groupId}&select=user_id,users(name,avatar_emoji)` });
        if (!members?.length) return res.json({ ok: true, leaderboard: [] });
        // Get all picks for this group
        const picks = await supabase("picks", { filters: `?group_id=eq.${groupId}&select=user_id,correct,points&limit=2000` });
        // Aggregate by user
        const agg = {};
        for (const m of members) {
          agg[m.user_id] = { user_id: m.user_id, name: m.users?.name, avatar_emoji: m.users?.avatar_emoji, correct_picks: 0, total_picks: 0, total_points: 0 };
        }
        for (const p of (picks || [])) {
          if (!agg[p.user_id]) continue;
          agg[p.user_id].total_picks++;
          if (p.correct) { agg[p.user_id].correct_picks++; agg[p.user_id].total_points += (p.points || 10); }
        }
        const rows = Object.values(agg).map(r => ({ ...r, accuracy: r.total_picks > 0 ? Math.round(r.correct_picks / r.total_picks * 100) : 0 })).sort((a, b) => b.total_points - a.total_points);
        // Attach shop cosmetics
        const userIds = rows.map(r => r.user_id).filter(Boolean).join(",");
        const cosmetics = userIds ? await supabase("user_achievements", { filters: `?user_id=in.(${userIds})&achievement_key=like.shop_%&select=user_id,achievement_key` }) : [];
        const cosmeticsByUser = {};
        for (const c of cosmetics || []) {
          if (!cosmeticsByUser[c.user_id]) cosmeticsByUser[c.user_id] = [];
          cosmeticsByUser[c.user_id].push(c.achievement_key.replace("shop_", ""));
        }
        return res.json({ ok: true, leaderboard: rows.map(r => ({ ...r, shopItems: cosmeticsByUser[r.user_id] || [] })) });
      }

      // ─── SCORE GAMES (check ESPN for finished games, update picks) ──
      case "scoreGames": {
        const today = new Date().toISOString().split("T")[0];
        // Get unscored picks (any past date, not just today)
        const unscored = await supabase("picks", {
          filters: `?scored=eq.false&game_date=lte.${today}&limit=200`,
        });
        if (!unscored?.length) return res.json({ ok: true, scored: 0 });

        // Collect unique dates from unscored picks
        const dates = [...new Set(unscored.map(p => p.game_date))];

        // Fetch ESPN scoreboard for each date with unscored picks
        const finishedGames = {};
        const parseEspn = (espnData) => {
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
        };

        await Promise.all(dates.map(async (date) => {
          try {
            const dateStr = date.replace(/-/g, "");
            const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`);
            if (r.ok) parseEspn(await r.json());
          } catch (_) {}
        }));

        let scored = 0;
        const correctPicks = [];
        const userScoreMap = {}; // userId -> { correct, total, groupId }
        for (const pick of unscored) {
          const winner = finishedGames[pick.game_id];
          if (!winner) continue;
          const correct = pick.picked_team === winner;
          const conf = pick.confidence || 1;
          // conf=1 es seguro (sin penalización), conf>=2 tiene riesgo
          const points = correct ? conf * 10 : (conf >= 2 ? -(conf * 10) : 0);
          await supabase(`picks?id=eq.${pick.id}`, {
            method: "PATCH", body: { correct, scored: true, points },
          });
          if (!userScoreMap[pick.user_id]) userScoreMap[pick.user_id] = { correct: 0, total: 0, groupId: pick.group_id };
          userScoreMap[pick.user_id].total++;
          if (correct) { userScoreMap[pick.user_id].correct++; correctPicks.push(pick); }
          scored++;
        }

        // Grant achievements for scored users
        for (const [uid, stats] of Object.entries(userScoreMap)) {
          if (stats.correct > 0) grantAchievement(uid, "first_win");
          if (stats.correct >= 2 && stats.correct === stats.total) grantAchievement(uid, "perfect_day");
        }

        // Score pending parlays
        try {
          const pendingParlays = await supabase("parlays", { filters: `?status=eq.pending&limit=200` });
          for (const parlay of (pendingParlays || [])) {
            const picks = typeof parlay.picks === "string" ? JSON.parse(parlay.picks) : (parlay.picks || []);
            let changed = false, allScored = true, allCorrect = true;
            for (const p of picks) {
              if (p.scored) continue;
              const winner = finishedGames[p.game_id];
              if (winner) { p.correct = p.picked_team === winner; p.scored = true; changed = true; if (!p.correct) allCorrect = false; }
              else allScored = false;
            }
            if (!changed) continue;
            if (allScored) {
              const bonus = allCorrect ? picks.length * 30 : 0;
              if (allCorrect && bonus > 0) {
                const balRows = await supabase("coin_balances", { filters: `?user_id=eq.${parlay.user_id}&group_id=eq.${parlay.group_id}&limit=1` });
                if (balRows?.length) await supabase(`coin_balances?id=eq.${balRows[0].id}`, { method: "PATCH", body: { balance: balRows[0].balance + bonus } });
                grantAchievement(parlay.user_id, "parlay_win");
              }
              await supabase(`parlays?id=eq.${parlay.id}`, { method: "PATCH", body: { picks: JSON.stringify(picks), status: allCorrect ? "won" : "lost", bonus_earned: allCorrect ? picks.length * 30 : 0 } });
            } else {
              await supabase(`parlays?id=eq.${parlay.id}`, { method: "PATCH", body: { picks: JSON.stringify(picks) } });
            }
          }
        } catch (_) {}

        // Push notifications for correct picks
        if (correctPicks.length > 0) {
          try {
            const webpush = await import("web-push");
            const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
            const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
            if (VAPID_PUBLIC && VAPID_PRIVATE) {
              webpush.default.setVapidDetails("mailto:courtiq@app.com", VAPID_PUBLIC, VAPID_PRIVATE);
              for (const pick of correctPicks) {
                const subs = await supabase("push_subscriptions", { filters: `?user_id=eq.${pick.user_id}&limit=1` });
                if (!subs?.length) continue;
                const conf = pick.confidence || 1;
                const sub = { endpoint: subs[0].endpoint, keys: { p256dh: subs[0].p256dh, auth: subs[0].auth } };
                await webpush.default.sendNotification(sub, JSON.stringify({
                  title: "✅ ¡Acertaste!",
                  body: `Tu pick de ${pick.picked_team} fue correcto — +${conf * 10} pts 🏀${conf > 1 ? ` (${conf}x 🔥)` : ""}`,
                  tag: "pick-correct-" + pick.id, url: "/",
                })).catch(() => {});
              }
            }
          } catch (_) {}
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
        if (bet.status !== "open" && bet.status !== "pending") return res.json({ ok: false, error: "Apuesta ya no disponible" });
        if (bet.requester_id === userId) return res.json({ ok: false, error: "No puedes aceptar tu propia apuesta" });
        if (bet.status === "pending" && bet.opponent_id && bet.opponent_id !== userId) return res.json({ ok: false, error: "Esta apuesta es para otro usuario" });
        // Verificar que el partido no haya empezado aún
        try {
          const espnRes = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard", { signal: AbortSignal.timeout(5000) });
          const espnData = await espnRes.json();
          const game = (espnData.events || []).find(e => e.id === bet.game_id);
          if (!game) return res.json({ ok: false, error: "❌ Este partido ya no está disponible — probablemente ya terminó" });
          const state = game.competitions?.[0]?.status?.type?.state;
          if (state !== "pre") return res.json({ ok: false, error: "❌ Este partido ya empezó o terminó — no puedes aceptar esta apuesta" });
        } catch (_) {
          // Si ESPN falla, igual dejamos pasar (mejor experiencia)
        }
        const rows = await supabase("coin_balances", { filters: `?user_id=eq.${userId}&group_id=eq.${bet.group_id}&limit=1` });
        if (!rows?.length || rows[0].balance < bet.amount) return res.json({ ok: false, error: "Saldo insuficiente" });
        await supabase(`coin_balances?user_id=eq.${userId}&group_id=eq.${bet.group_id}`, {
          method: "PATCH", body: { balance: rows[0].balance - bet.amount },
        });
        await supabase(`bets?id=eq.${betId}`, { method: "PATCH", body: { opponent_id: userId, status: "active" } });
        // Notify requester that their bet was accepted
        try {
          const webpush = await import("web-push");
          const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
          const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
          if (VAPID_PUBLIC && VAPID_PRIVATE) {
            webpush.default.setVapidDetails("mailto:courtiq@app.com", VAPID_PUBLIC, VAPID_PRIVATE);
            const accepterRows = await supabase("users", { filters: `?id=eq.${userId}&select=name,avatar_emoji&limit=1` });
            const accepter = accepterRows?.[0];
            const subs = await supabase("push_subscriptions", { filters: `?user_id=eq.${bet.requester_id}&limit=1` });
            if (subs?.length) {
              const sub = { endpoint: subs[0].endpoint, keys: { p256dh: subs[0].p256dh, auth: subs[0].auth } };
              await webpush.default.sendNotification(sub, JSON.stringify({
                title: "🤝 ¡Apuesta aceptada!",
                body: `${accepter?.avatar_emoji || "🏀"} ${accepter?.name || "Alguien"} aceptó tu apuesta de 🪙${bet.amount}`,
                tag: "bet_accepted",
                url: "/?tab=pickem&subtab=apuestas",
              }));
            }
          }
        } catch (_) {}
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
          filters: `?group_id=eq.${groupId}&status=in.(open,active,pending)&select=*,requester:users!bets_requester_id_fkey(name,avatar_emoji),opponent:users!bets_opponent_id_fkey(name,avatar_emoji)&order=created_at.desc&limit=50`,
        });
        return res.json({ ok: true, bets: bets || [] });
      }

      // ─── SETTLE BETS (auto-score after games finish) ───────
      case "settleBets": {
        const webpush = await import("web-push");
        const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
        const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
        if (VAPID_PUBLIC && VAPID_PRIVATE) webpush.default.setVapidDetails("mailto:courtiq@app.com", VAPID_PUBLIC, VAPID_PRIVATE);
        const activeBets = await supabase("bets", { filters: `?status=eq.active&limit=100` });
        if (!activeBets?.length) return res.json({ ok: true, settled: 0 });
        // Fetch last 3 days of scoreboards to cover multi-day bets
        const dates = [];
        for (let i = 0; i < 3; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          dates.push(d.toISOString().split("T")[0]);
        }
        const finished = {};
        const parseEspn = (data) => {
          (data.events || []).forEach((e) => {
            const comp = e.competitions?.[0];
            if (!comp?.status?.type?.completed) return;
            const home = comp.competitors?.find((c) => c.homeAway === "home");
            const away = comp.competitors?.find((c) => c.homeAway === "away");
            const winner = parseInt(home?.score || 0) > parseInt(away?.score || 0) ? fix(home?.team?.abbreviation) : fix(away?.team?.abbreviation);
            finished[e.id] = winner;
          });
        };
        await Promise.all(dates.map(async (date) => {
          try {
            const dateStr = date.replace(/-/g, "");
            const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`);
            if (r.ok) parseEspn(await r.json());
          } catch (_) {}
        }));
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
          grantAchievement(winnerId, "bet_won");
          // Push notification al ganador
          if (VAPID_PUBLIC && VAPID_PRIVATE) {
            const winSub = await supabase("push_subscriptions", { filters: `?user_id=eq.${winnerId}&limit=1` });
            if (winSub?.length) {
              try {
                await webpush.default.sendNotification(
                  { endpoint: winSub[0].endpoint, keys: { p256dh: winSub[0].p256dh, auth: winSub[0].auth } },
                  JSON.stringify({ title: "🏆 ¡Ganaste la apuesta!", body: `${winner} ganó — ¡cobras 🪙${bet.amount * 2} monedas!`, tag: `bet-won-${bet.id}`, url: "/?tab=apuestas" })
                );
              } catch (_) {}
            }
          }
          settled++;
        }
        // ─── Auto-cancel open/pending bets whose game already started ───
        const openBets = await supabase("bets", { filters: `?status=in.(open,pending)&limit=200` });
        let cancelled = 0;
        if (openBets?.length) {
          // Build set of game ids that are no longer in "pre" state (already started or ended)
          const gameStates = {};
          await Promise.all(dates.map(async (date) => {
            try {
              const dateStr = date.replace(/-/g, "");
              const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`);
              if (r.ok) {
                const data = await r.json();
                (data.events || []).forEach(e => {
                  const state = e.competitions?.[0]?.status?.type?.state;
                  gameStates[e.id] = state || "pre";
                });
              }
            } catch (_) {}
          }));
          for (const bet of openBets) {
            const state = gameStates[bet.game_id];
            if (state && state !== "pre") {
              // Refund requester
              if (bet.status !== "open") {
                // pending bets: requester already paid, refund them
                const bal = await supabase("coin_balances", { filters: `?user_id=eq.${bet.requester_id}&group_id=eq.${bet.group_id}&limit=1` });
                if (bal?.length) {
                  await supabase(`coin_balances?user_id=eq.${bet.requester_id}&group_id=eq.${bet.group_id}`, {
                    method: "PATCH", body: { balance: bal[0].balance + bet.amount }
                  });
                }
              }
              await supabase(`bets?id=eq.${bet.id}`, { method: "PATCH", body: { status: "cancelled" } });
              cancelled++;
            }
          }
        }
        return res.json({ ok: true, settled, cancelled });
      }

      // ─── UPDATE PROFILE ────────────────────────────────────
      case "updateProfile": {
        const { userId, avatarEmoji } = body;
        if (!userId) return res.json({ ok: false, error: "userId requerido" });
        await supabase(`users?id=eq.${userId}`, { method: "PATCH", body: { avatar_emoji: avatarEmoji } });
        return res.json({ ok: true });
      }

      // ─── GLOBAL LEADERBOARD ────────────────────────────────
      case "globalLeaderboard": {
        const today = new Date().toISOString().split("T")[0];
        const picks = await supabase("picks", {
          filters: `?game_date=eq.${today}&scored=eq.true&select=user_id,correct,points,users(name,avatar_emoji)`,
        });
        const agg = {};
        for (const p of (picks || [])) {
          if (!agg[p.user_id]) agg[p.user_id] = { user_id: p.user_id, name: p.users?.name, avatar_emoji: p.users?.avatar_emoji, correct: 0, total: 0, points: 0 };
          agg[p.user_id].total++;
          if (p.correct) { agg[p.user_id].correct++; agg[p.user_id].points += p.points || 10; }
        }
        const sorted = Object.values(agg)
          .sort((a, b) => b.points - a.points || b.correct - a.correct)
          .map(u => ({ ...u, accuracy: u.total > 0 ? Math.round(u.correct / u.total * 100) : 0 }));
        return res.json({ ok: true, leaderboard: sorted });
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

      // ─── GET STREAK ────────────────────────────────────────
      case "getStreak": {
        const { userId, groupId } = req.query;
        if (!userId || !groupId) return res.json({ ok: false, error: "Faltan datos" });
        const picks = await supabase("picks", {
          filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&scored=eq.true&select=correct,game_date&order=game_date.desc,created_at.desc`,
        });
        let streak = 0;
        for (const p of (picks || [])) {
          if (p.correct) streak++;
          else break;
        }
        return res.json({ ok: true, streak });
      }

      // ─── CHALLENGE BET ─────────────────────────────────────
      case "challengeBet": {
        const { userId, groupId, gameId, amount, pickedTeam, homeTeam, awayTeam, opponentId } = body;
        if (!userId || !groupId || !gameId || !amount || !pickedTeam || !opponentId) return res.json({ ok: false, error: "Faltan datos" });
        const rows = await supabase("coin_balances", { filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&limit=1` });
        if (!rows?.length || rows[0].balance < amount) return res.json({ ok: false, error: "Saldo insuficiente" });
        await supabase(`coin_balances?user_id=eq.${userId}&group_id=eq.${groupId}`, {
          method: "PATCH", body: { balance: rows[0].balance - amount },
        });
        await supabase("bets", {
          method: "POST",
          body: { requester_id: userId, opponent_id: opponentId, group_id: groupId, game_id: gameId, amount: parseInt(amount), picked_team: pickedTeam, home_team: homeTeam, away_team: awayTeam, status: "pending" },
        });
        grantAchievement(userId, "challenge_sent");
        // Get requester name
        const requesterRows = await supabase("users", { filters: `?id=eq.${userId}&limit=1` });
        const requesterName = requesterRows?.[0]?.name || "Alguien";
        // Send push notification to opponent
        try {
          const webpush = await import("web-push");
          const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
          const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
          if (VAPID_PUBLIC && VAPID_PRIVATE) {
            webpush.default.setVapidDetails("mailto:courtiq@app.com", VAPID_PUBLIC, VAPID_PRIVATE);
            const subs = await supabase("push_subscriptions", { filters: `?user_id=eq.${opponentId}&limit=1` });
            if (subs?.length) {
              const sub = { endpoint: subs[0].endpoint, keys: { p256dh: subs[0].p256dh, auth: subs[0].auth } };
              await webpush.default.sendNotification(sub, JSON.stringify({
                title: "🪙 ¡Reto de apuesta!",
                body: `${requesterName} te reta: 🪙${amount} en ${homeTeam} vs ${awayTeam}`,
                tag: "bet_challenge",
                url: "/?tab=pickem&subtab=apuestas",
              }));
            }
          }
        } catch (_) {}
        return res.json({ ok: true });
      }

      // ─── GET CHAT ──────────────────────────────────────────
      case "getChat": {
        const { groupId } = req.query;
        if (!groupId) return res.json({ ok: false, error: "groupId requerido" });
        const messages = await supabase("chat_messages", {
          filters: `?group_id=eq.${groupId}&select=*,users(name,avatar_emoji)&order=created_at.desc&limit=40`,
        });
        return res.json({ ok: true, messages: (messages || []).reverse() });
      }

      // ─── SEND CHAT ─────────────────────────────────────────
      case "sendChat": {
        const { userId, groupId, content } = body;
        if (!userId || !groupId || !content) return res.json({ ok: false, error: "Faltan datos" });

        // Save the message
        await supabase("chat_messages", {
          method: "POST",
          body: { user_id: userId, group_id: groupId, content },
        });

        // Push notifications to all other group members in background
        try {
          const webpush = await import("web-push");
          const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
          const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
          if (VAPID_PUBLIC && VAPID_PRIVATE) {
            webpush.default.setVapidDetails("mailto:courtiq@app.com", VAPID_PUBLIC, VAPID_PRIVATE);

            // Get sender name
            const senderRows = await supabase("users", { filters: `?id=eq.${userId}&select=name,avatar_emoji&limit=1` });
            const sender = senderRows?.[0];

            // Get group name
            const groupRows = await supabase("groups", { filters: `?id=eq.${groupId}&select=name&limit=1` });
            const groupName = groupRows?.[0]?.name || "tu grupo";

            // Get all other members' push subscriptions
            const members = await supabase("group_members", {
              filters: `?group_id=eq.${groupId}&user_id=neq.${userId}&select=user_id`,
            });
            if (members?.length) {
              const memberIds = members.map(m => m.user_id);
              // Batch fetch subscriptions
              const subsFilter = memberIds.map(id => `user_id.eq.${id}`).join(",");
              const subs = await supabase("push_subscriptions", {
                filters: `?or=(${subsFilter})&select=endpoint,p256dh,auth`,
              });
              const shortMsg = content.length > 60 ? content.slice(0, 57) + "…" : content;
              const notifPayload = JSON.stringify({
                title: `${sender?.avatar_emoji || "🏀"} ${sender?.name || "Alguien"} — ${groupName}`,
                body: shortMsg,
                tag: `chat-${groupId}`,
                url: `/?chat=${groupId}`,
              });
              await Promise.allSettled((subs || []).map(sub =>
                webpush.default.sendNotification(
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  notifPayload
                )
              ));
            }
          }
        } catch (_) {}

        return res.json({ ok: true });
      }

      // ─── GET ACHIEVEMENTS ──────────────────────────────────
      case "getAchievements": {
        const { userId } = req.query;
        if (!userId) return res.json({ ok: false, error: "userId requerido" });
        const achievements = await supabase("user_achievements", {
          filters: `?user_id=eq.${userId}&select=achievement_key,unlocked_at`,
        });
        return res.json({ ok: true, achievements: achievements || [] });
      }

      // ─── UNLOCK ACHIEVEMENT ────────────────────────────────
      case "unlockAchievement": {
        const { userId, key } = body;
        if (!userId || !key) return res.json({ ok: false, error: "Faltan datos" });
        try {
          await supabase("user_achievements", {
            method: "POST",
            body: { user_id: userId, achievement_key: key },
          });
        } catch (_) {}
        return res.json({ ok: true });
      }

      // ─── HEAD TO HEAD ──────────────────────────────────────
      case "headToHead": {
        const { userId, opponentId, groupId } = req.query;
        if (!userId || !opponentId || !groupId) return res.json({ ok: false, error: "Faltan datos" });
        const myPicks = await supabase("picks", {
          filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&scored=eq.true&select=game_id,correct`,
        });
        const theirPicks = await supabase("picks", {
          filters: `?user_id=eq.${opponentId}&group_id=eq.${groupId}&scored=eq.true&select=game_id,correct`,
        });
        const theirMap = {};
        for (const p of (theirPicks || [])) theirMap[p.game_id] = p.correct;
        let bothCorrect = 0, iWon = 0, theyWon = 0, neither = 0, total = 0;
        for (const p of (myPicks || [])) {
          if (!(p.game_id in theirMap)) continue;
          total++;
          const me = p.correct, them = theirMap[p.game_id];
          if (me && them) bothCorrect++;
          else if (me && !them) iWon++;
          else if (!me && them) theyWon++;
          else neither++;
        }
        return res.json({ ok: true, bothCorrect, iWon, theyWon, neither, total });
      }

      // ─── SAVE MINI SCORE ───────────────────────────────────
      case "saveMiniScore": {
        const { userId, gameType, score } = body;
        if (!userId || !gameType || score === undefined) return res.json({ ok: false, error: "Faltan datos" });
        const existing = await supabase("mini_game_scores", {
          filters: `?user_id=eq.${userId}&game_type=eq.${gameType}&limit=1`,
        });
        if (existing?.length) {
          if (score > existing[0].score) {
            await supabase(`mini_game_scores?id=eq.${existing[0].id}`, {
              method: "PATCH", body: { score, updated_at: new Date().toISOString() },
            });
          }
        } else {
          await supabase("mini_game_scores", {
            method: "POST",
            body: { user_id: userId, game_type: gameType, score },
          });
        }
        return res.json({ ok: true });
      }

      // ─── GET MINI SCORES ───────────────────────────────────
      case "getMiniScores": {
        const { gameType } = req.query;
        if (!gameType) return res.json({ ok: false, error: "gameType requerido" });
        const scores = await supabase("mini_game_scores", {
          filters: `?game_type=eq.${gameType}&select=score,users(name,avatar_emoji)&order=score.desc&limit=10`,
        });
        return res.json({ ok: true, scores: scores || [] });
      }

      // ─── DAILY BONUS ───────────────────────────────────────
      case "claimDailyBonus": {
        const { userId } = body;
        if (!userId) return res.json({ ok: false, error: "userId requerido" });
        const today = new Date().toISOString().split("T")[0];
        const users = await supabase("users", { filters: `?id=eq.${userId}&limit=1` });
        if (!users?.length) return res.json({ ok: false, error: "Usuario no encontrado" });
        const u = users[0];
        if (u.last_daily_bonus === today) return res.json({ ok: false, already: true, error: "Ya reclamaste tu bonus hoy" });
        const memberships = await supabase("group_members", { filters: `?user_id=eq.${userId}&select=group_id` });
        const bonus = 25;
        for (const m of (memberships || [])) {
          const bal = await supabase("coin_balances", { filters: `?user_id=eq.${userId}&group_id=eq.${m.group_id}&limit=1` });
          if (bal?.length) await supabase(`coin_balances?id=eq.${bal[0].id}`, { method: "PATCH", body: { balance: bal[0].balance + bonus } });
          else await supabase("coin_balances", { method: "POST", body: { user_id: userId, group_id: m.group_id, balance: 500 + bonus } });
        }
        await supabase(`users?id=eq.${userId}`, { method: "PATCH", body: { last_daily_bonus: today } });
        return res.json({ ok: true, bonus });
      }

      // ─── CHECK DAILY BONUS STATUS ──────────────────────────
      case "dailyBonusStatus": {
        const { userId } = req.query;
        if (!userId) return res.json({ ok: false, error: "userId requerido" });
        const today = new Date().toISOString().split("T")[0];
        const users = await supabase("users", { filters: `?id=eq.${userId}&select=last_daily_bonus&limit=1` });
        const claimed = users?.[0]?.last_daily_bonus === today;
        return res.json({ ok: true, claimed });
      }

      // ─── PERSONAL STATS ────────────────────────────────────
      case "myStats": {
        const { userId } = req.query;
        if (!userId) return res.json({ ok: false, error: "userId requerido" });
        const picks = await supabase("picks", { filters: `?user_id=eq.${userId}&scored=eq.true&select=picked_team,correct,points,game_date&limit=500` });
        if (!picks?.length) return res.json({ ok: true, stats: null });
        const byTeam = {};
        let totalCorrect = 0, totalPicks = picks.length, totalPoints = 0;
        for (const p of picks) {
          totalPoints += p.points || 0;
          if (p.correct) totalCorrect++;
          if (!byTeam[p.picked_team]) byTeam[p.picked_team] = { team: p.picked_team, correct: 0, total: 0 };
          byTeam[p.picked_team].total++;
          if (p.correct) byTeam[p.picked_team].correct++;
        }
        const teamStats = Object.values(byTeam).map(t => ({ ...t, acc: Math.round(t.correct / t.total * 100) })).sort((a, b) => b.total - a.total);
        const minGames = 2;
        const favoriteTeam = teamStats[0] || null;
        const bestTeam = teamStats.filter(t => t.total >= minGames).sort((a, b) => b.acc - a.acc)[0] || null;
        const worstTeam = teamStats.filter(t => t.total >= minGames).sort((a, b) => a.acc - b.acc)[0] || null;
        return res.json({ ok: true, stats: { totalPicks, totalCorrect, totalPoints, accuracy: Math.round(totalCorrect / totalPicks * 100), favoriteTeam, bestTeam, worstTeam, topTeams: teamStats.slice(0, 10) } });
      }

      // ─── CHECK STREAK ACHIEVEMENTS ─────────────────────────
      case "checkAchievements": {
        const { userId, groupId } = req.query;
        if (!userId || !groupId) return res.json({ ok: false, error: "Faltan datos" });
        const picks = await supabase("picks", { filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&scored=eq.true&select=correct,game_date&order=game_date.desc&limit=30` });
        let streak = 0;
        for (const p of (picks || [])) { if (!p.correct) break; streak++; }
        const newAchievements = [];
        if (streak >= 3) { await grantAchievement(userId, "streak_3"); if (streak === 3) newAchievements.push("streak_3"); }
        if (streak >= 5) { await grantAchievement(userId, "streak_5"); if (streak === 5) newAchievements.push("streak_5"); }
        if (streak >= 7) {
          await grantAchievement(userId, "streak_7");
          newAchievements.push("streak_7");
          // Give a streak shield
          const u = await supabase("users", { filters: `?id=eq.${userId}&limit=1` });
          if (u?.length) {
            const shields = (u[0].streak_shields || 0) + 1;
            await supabase(`users?id=eq.${userId}`, { method: "PATCH", body: { streak_shields: shields } });
          }
        }
        return res.json({ ok: true, streak, newAchievements });
      }

      // ─── STREAK SHIELD ─────────────────────────────────────
      case "getShields": {
        const { userId } = req.query;
        if (!userId) return res.json({ ok: false, error: "userId requerido" });
        const u = await supabase("users", { filters: `?id=eq.${userId}&select=streak_shields&limit=1` });
        return res.json({ ok: true, shields: u?.[0]?.streak_shields || 0 });
      }

      case "useShield": {
        const { userId } = body;
        if (!userId) return res.json({ ok: false, error: "userId requerido" });
        const u = await supabase("users", { filters: `?id=eq.${userId}&limit=1` });
        if (!u?.length) return res.json({ ok: false, error: "Usuario no encontrado" });
        const shields = u[0].streak_shields || 0;
        if (shields < 1) return res.json({ ok: false, error: "No tienes escudos disponibles" });
        await supabase(`users?id=eq.${userId}`, { method: "PATCH", body: { streak_shields: shields - 1 } });
        return res.json({ ok: true, shieldsLeft: shields - 1 });
      }

      // ─── UPDATE GROUP (admin) ──────────────────────────────
      case "updateGroup": {
        const { userId, groupId, name, emoji } = body;
        if (!userId || !groupId) return res.json({ ok: false, error: "Faltan datos" });
        const grp = await supabase("groups", { filters: `?id=eq.${groupId}&owner_id=eq.${userId}&limit=1` });
        if (!grp?.length) return res.json({ ok: false, error: "Solo el creador puede editar el grupo" });
        const updates = {};
        if (name?.trim()) updates.name = name.trim();
        if (emoji) updates.emoji = emoji;
        await supabase(`groups?id=eq.${groupId}`, { method: "PATCH", body: updates });
        return res.json({ ok: true });
      }

      // ─── SEND GAME REMINDERS (cron every 30 min) ──────────
      case "sendReminders": {
        const webpush = await import("web-push");
        const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
        const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
        if (!VAPID_PUBLIC || !VAPID_PRIVATE) return res.json({ ok: false, error: "VAPID keys no configuradas" });
        webpush.default.setVapidDetails("mailto:courtiq@app.com", VAPID_PUBLIC, VAPID_PRIVATE);
        const now = new Date();
        const in15 = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
        const in45 = new Date(now.getTime() + 45 * 60 * 1000).toISOString();
        const espnRes = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard");
        const espnData = await espnRes.json();
        const upcoming = (espnData.events || []).filter(e => e.date >= in15 && e.date <= in45);
        const subs = await supabase("push_subscriptions", { filters: `?select=endpoint,p256dh,auth` });
        if (!subs?.length || !upcoming.length) return res.json({ ok: true, sent: 0 });
        let remindedGames = 0;
        for (const game of upcoming) {
          try {
            await supabase("reminder_sent", { method: "POST", body: { game_id: game.id } });
          } catch (_) { continue; } // Already sent for this game
          const comp = game.competitions?.[0];
          const home = comp?.competitors?.find(c => c.homeAway === "home");
          const away = comp?.competitors?.find(c => c.homeAway === "away");
          const payload = JSON.stringify({
            title: "⏰ ¡Partido en 15 min!",
            body: `${fix(away?.team?.abbreviation || "")} vs ${fix(home?.team?.abbreviation || "")} — ¡Haz tus picks!`,
            tag: `reminder-${game.id}`, url: "/",
          });
          await Promise.allSettled(subs.map(s =>
            webpush.default.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
          ));
          remindedGames++;
        }
        return res.json({ ok: true, remindedGames });
      }

      // ─── PARLAY ────────────────────────────────────────────
      case "createParlay": {
        const { userId, groupId, parlayPicks } = body;
        if (!userId || !groupId || !Array.isArray(parlayPicks)) return res.json({ ok: false, error: "Faltan datos" });
        if (parlayPicks.length < 3 || parlayPicks.length > 5) return res.json({ ok: false, error: "El parlay necesita 3-5 juegos" });
        const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1);
        const weekStart = d.toISOString().split("T")[0];
        const existing = await supabase("parlays", { filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&week_start=eq.${weekStart}&limit=1` });
        const picks = parlayPicks.map(p => ({ ...p, correct: null, scored: false }));
        if (existing?.length) {
          await supabase(`parlays?id=eq.${existing[0].id}`, { method: "PATCH", body: { picks: JSON.stringify(picks), status: "pending", bonus_earned: 0 } });
          return res.json({ ok: true, updated: true });
        }
        const [parlay] = await supabase("parlays", { method: "POST", body: { user_id: userId, group_id: groupId, week_start: weekStart, picks: JSON.stringify(picks), status: "pending", bonus_earned: 0 } });
        return res.json({ ok: true, parlay });
      }

      case "myParlay": {
        const { userId, groupId } = req.query;
        if (!userId || !groupId) return res.json({ ok: false, error: "Faltan datos" });
        const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1);
        const weekStart = d.toISOString().split("T")[0];
        const parlays = await supabase("parlays", { filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&week_start=eq.${weekStart}&limit=1` });
        const parlay = parlays?.[0] || null;
        if (parlay && typeof parlay.picks === "string") parlay.picks = JSON.parse(parlay.picks);
        return res.json({ ok: true, parlay });
      }

      case "groupParlays": {
        const { groupId } = req.query;
        if (!groupId) return res.json({ ok: false, error: "groupId requerido" });
        const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1);
        const weekStart = d.toISOString().split("T")[0];
        const parlays = await supabase("parlays", { filters: `?group_id=eq.${groupId}&week_start=eq.${weekStart}&select=*,users(name,avatar_emoji)&order=bonus_earned.desc` });
        return res.json({ ok: true, parlays: (parlays || []).map(p => ({ ...p, picks: typeof p.picks === "string" ? JSON.parse(p.picks) : p.picks })) });
      }

      // ─── COIN SHOP ─────────────────────────────────────────
      case "purchaseItem": {
        const { userId, groupId, itemKey, itemCost } = body;
        if (!userId || !itemKey) return res.json({ ok: false, error: "Faltan datos" });
        const cost = parseInt(itemCost) || 0;
        // Shield is consumable — add directly to streak_shields, don't store in achievements
        if (itemKey === "shield") {
          if (!groupId) return res.json({ ok: false, error: "groupId requerido" });
          const bal = await supabase("coin_balances", { filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&limit=1` });
          if (!bal?.length || bal[0].balance < cost) return res.json({ ok: false, error: "Saldo insuficiente" });
          await supabase(`coin_balances?id=eq.${bal[0].id}`, { method: "PATCH", body: { balance: bal[0].balance - cost } });
          const u = await supabase("users", { filters: `?id=eq.${userId}&limit=1` });
          const newShields = (u?.[0]?.streak_shields || 0) + 1;
          await supabase(`users?id=eq.${userId}`, { method: "PATCH", body: { streak_shields: newShields } });
          return res.json({ ok: true, shields: newShields });
        }
        const owned = await supabase("user_achievements", { filters: `?user_id=eq.${userId}&achievement_key=eq.shop_${itemKey}&limit=1` });
        if (owned?.length) return res.json({ ok: false, error: "Ya tienes este artículo" });
        if (groupId && cost > 0) {
          const bal = await supabase("coin_balances", { filters: `?user_id=eq.${userId}&group_id=eq.${groupId}&limit=1` });
          if (!bal?.length || bal[0].balance < cost) return res.json({ ok: false, error: "Saldo insuficiente" });
          await supabase(`coin_balances?id=eq.${bal[0].id}`, { method: "PATCH", body: { balance: bal[0].balance - cost } });
        }
        await supabase("user_achievements", { method: "POST", body: { user_id: userId, achievement_key: `shop_${itemKey}` } });
        return res.json({ ok: true });
      }

      case "myShopItems": {
        const { userId } = req.query;
        if (!userId) return res.json({ ok: false, error: "userId requerido" });
        const items = await supabase("user_achievements", { filters: `?user_id=eq.${userId}&achievement_key=like.shop_%&select=achievement_key` });
        return res.json({ ok: true, items: (items || []).map(i => i.achievement_key.replace("shop_", "")) });
      }

      // ─── USER PROFILE ───────────────────────────────────────
      case "userProfile": {
        const { targetId } = req.query;
        if (!targetId) return res.json({ ok: false, error: "targetId requerido" });
        const [u] = await supabase("users", { filters: `?id=eq.${targetId}&select=id,name,avatar_emoji&limit=1` }) || [];
        const picks = await supabase("picks", { filters: `?user_id=eq.${targetId}&scored=eq.true&select=picked_team,correct,points&limit=500` });
        const achievements = await supabase("user_achievements", { filters: `?user_id=eq.${targetId}&select=achievement_key,unlocked_at` });
        const total = picks?.length || 0;
        const correct = picks?.filter(p => p.correct).length || 0;
        const pts = picks?.reduce((s, p) => s + (p.points || 0), 0) || 0;
        const byTeam = {};
        for (const p of picks || []) {
          if (!byTeam[p.picked_team]) byTeam[p.picked_team] = { team: p.picked_team, correct: 0, total: 0 };
          byTeam[p.picked_team].total++;
          if (p.correct) byTeam[p.picked_team].correct++;
        }
        const topTeams = Object.values(byTeam).map(t => ({ ...t, acc: Math.round(t.correct / t.total * 100) })).sort((a, b) => b.total - a.total).slice(0, 5);
        return res.json({ ok: true, user: u, stats: { totalPicks: total, totalCorrect: correct, accuracy: total ? Math.round(correct / total * 100) : 0, totalPoints: pts, topTeams }, achievements: achievements || [] });
      }

      // ─── STREAK ALERT (cron: 2h before first game) ─────────
      case "streakAlert": {
        const webpush = await import("web-push");
        const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
        const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
        if (!VAPID_PUBLIC || !VAPID_PRIVATE) return res.json({ ok: false, error: "VAPID no configurado" });
        webpush.default.setVapidDetails("mailto:courtiq@app.com", VAPID_PUBLIC, VAPID_PRIVATE);
        const today = new Date().toISOString().split("T")[0];
        // Check window: 90–150 min before first game
        const espnRes = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard");
        const espnData = await espnRes.json();
        const upcoming = (espnData.events || []).filter(e => e.competitions?.[0]?.status?.type?.state === "pre");
        if (!upcoming.length) return res.json({ ok: true, sent: 0, reason: "no upcoming games" });
        const earliest = upcoming.map(e => new Date(e.date)).sort((a, b) => a - b)[0];
        const minsUntil = (earliest - new Date()) / 60000;
        if (minsUntil < 90 || minsUntil > 150) return res.json({ ok: true, sent: 0, reason: `not in window (${Math.round(minsUntil)}min)` });
        // Get users who haven't picked today
        const pickedToday = await supabase("picks", { filters: `?game_date=eq.${today}&select=user_id` });
        const pickedIds = new Set((pickedToday || []).map(p => p.user_id));
        // Get all subscribers
        const subs = await supabase("push_subscriptions", { filters: `?select=endpoint,p256dh,auth,user_id` });
        if (!subs?.length) return res.json({ ok: true, sent: 0 });
        // Get streaks for subscribers who haven't picked
        let sent = 0;
        for (const sub of subs) {
          if (pickedIds.has(sub.user_id)) continue; // already picked
          const recentPicks = await supabase("picks", { filters: `?user_id=eq.${sub.user_id}&scored=eq.true&select=correct&order=game_date.desc&limit=10` });
          let streak = 0;
          for (const p of recentPicks || []) { if (!p.correct) break; streak++; }
          if (streak < 2) continue; // only alert if streak >= 2
          const payload = JSON.stringify({
            title: "⚠️ ¡Tu racha está en peligro!",
            body: `Llevas ${streak} picks seguidos correctos — ¡haz tus picks antes de que empiece el juego!`,
            tag: `streak-alert-${today}`, url: "/",
          });
          try {
            await webpush.default.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
            sent++;
          } catch (_) {}
        }
        return res.json({ ok: true, sent });
      }

      // ─── WEEKLY SUMMARY (cron: Sunday night) ───────────────
      case "weeklySummary": {
        const webpush = await import("web-push");
        const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
        const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
        if (!VAPID_PUBLIC || !VAPID_PRIVATE) return res.json({ ok: false, error: "VAPID no configurado" });
        webpush.default.setVapidDetails("mailto:courtiq@app.com", VAPID_PUBLIC, VAPID_PRIVATE);
        const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1);
        const weekStart = d.toISOString().split("T")[0];
        // Get week picks per user
        const picks = await supabase("picks", { filters: `?game_date=gte.${weekStart}&scored=eq.true&select=user_id,correct,points,group_id` });
        if (!picks?.length) return res.json({ ok: true, sent: 0 });
        const byUser = {};
        for (const p of picks) {
          if (!byUser[p.user_id]) byUser[p.user_id] = { correct: 0, total: 0, points: 0 };
          byUser[p.user_id].total++;
          byUser[p.user_id].points += p.points || 0;
          if (p.correct) byUser[p.user_id].correct++;
        }
        // Get leaderboard rank for each user in their group (simplified: by points this week)
        const subs = await supabase("push_subscriptions", { filters: `?select=endpoint,p256dh,auth,user_id` });
        if (!subs?.length) return res.json({ ok: true, sent: 0 });
        let sent = 0;
        for (const sub of subs) {
          const stats = byUser[sub.user_id];
          if (!stats || stats.total === 0) continue;
          const pct = Math.round(stats.correct / stats.total * 100);
          const payload = JSON.stringify({
            title: "📊 Tu resumen semanal · Court IQ",
            body: `${stats.correct}/${stats.total} picks acertados (${pct}%) · +${stats.points} pts esta semana 🏀`,
            tag: `weekly-${weekStart}`, url: "/",
          });
          try {
            await webpush.default.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
            sent++;
          } catch (_) {}
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
