-- ═══════════════════════════════════════════════════════════════
-- COURT IQ — Migraciones completas
-- Pega TODO esto en Supabase → SQL Editor → Run
-- Es seguro correrlo varias veces (IF NOT EXISTS / IF EXISTS)
-- ═══════════════════════════════════════════════════════════════

-- ─── COLUMNAS FALTANTES EN TABLAS EXISTENTES ─────────────────

-- users: PIN, avatar, bonus diario, escudos de racha
alter table users add column if not exists pin text;
alter table users add column if not exists avatar_emoji text default '🏀';
alter table users add column if not exists last_daily_bonus date;
alter table users add column if not exists streak_shields int default 0;

-- picks: confianza (1x/2x/3x) y probabilidad al momento del pick
alter table picks add column if not exists confidence int default 1;
alter table picks add column if not exists win_pct int default 50;

-- groups: emoji
alter table groups add column if not exists emoji text default '🏀';

-- ─── TABLA: coin_balances ─────────────────────────────────────
create table if not exists coin_balances (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  balance int default 500,
  updated_at timestamptz default now(),
  unique(user_id, group_id)
);
alter table coin_balances enable row level security;
create policy if not exists "public_coin_balances" on coin_balances for all using (true) with check (true);
grant all on coin_balances to anon, authenticated;

-- ─── TABLA: bets ──────────────────────────────────────────────
create table if not exists bets (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  requester_id uuid references users(id) on delete cascade,
  opponent_id uuid references users(id) on delete set null,
  game_id text not null,
  home_team text not null,
  away_team text not null,
  picked_team text not null,
  amount int not null default 25,
  status text default 'open',   -- open | pending | active | settled | cancelled
  winner_id uuid references users(id) on delete set null,
  actual_winner text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_bets_group on bets(group_id);
alter table bets enable row level security;
create policy if not exists "public_bets" on bets for all using (true) with check (true);
grant all on bets to anon, authenticated;

-- ─── TABLA: chat_messages ────────────────────────────────────
create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);
create index if not exists idx_chat_group on chat_messages(group_id, created_at desc);
alter table chat_messages enable row level security;
create policy if not exists "public_chat" on chat_messages for all using (true) with check (true);
grant all on chat_messages to anon, authenticated;

-- ─── TABLA: user_achievements ────────────────────────────────
create table if not exists user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_key)
);
alter table user_achievements enable row level security;
create policy if not exists "public_achievements" on user_achievements for all using (true) with check (true);
grant all on user_achievements to anon, authenticated;

-- ─── TABLA: push_subscriptions ───────────────────────────────
create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade unique,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);
alter table push_subscriptions enable row level security;
create policy if not exists "public_push_subs" on push_subscriptions for all using (true) with check (true);
grant all on push_subscriptions to anon, authenticated;

-- ─── TABLA: notification_prefs ───────────────────────────────
create table if not exists notification_prefs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade unique,
  picks_reminder boolean default true,
  win_notify boolean default true,
  loss_notify boolean default false,
  daily_summary boolean default true,
  updated_at timestamptz default now()
);
alter table notification_prefs enable row level security;
create policy if not exists "public_notif_prefs" on notification_prefs for all using (true) with check (true);
grant all on notification_prefs to anon, authenticated;

-- ─── TABLA: parlays ──────────────────────────────────────────
create table if not exists parlays (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  week_start date not null,
  picks jsonb not null default '[]',
  status text default 'pending',
  bonus_earned int default 0,
  created_at timestamptz default now(),
  unique(user_id, group_id, week_start)
);
alter table parlays enable row level security;
create policy if not exists "public_parlays" on parlays for all using (true) with check (true);
grant all on parlays to anon, authenticated;

-- ─── TABLA: reminder_sent (dedup cron) ───────────────────────
create table if not exists reminder_sent (
  game_id text primary key,
  sent_at timestamptz default now()
);
alter table reminder_sent enable row level security;
create policy if not exists "public_reminder_sent" on reminder_sent for all using (true) with check (true);
grant all on reminder_sent to anon, authenticated;

-- ─── TABLA: mini_game_scores ─────────────────────────────────
create table if not exists mini_game_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  game_type text not null,
  score int default 0,
  updated_at timestamptz default now(),
  unique(user_id, game_type)
);
alter table mini_game_scores enable row level security;
create policy if not exists "public_mini_scores" on mini_game_scores for all using (true) with check (true);
grant all on mini_game_scores to anon, authenticated;

-- ─── VISTA: leaderboard (todos los picks, no filtra por scored) ─
create or replace view leaderboard as
select
  gm.group_id,
  gm.user_id,
  u.name,
  u.avatar_emoji,
  count(p.id) as total_picks,
  count(case when p.correct = true then 1 end) as correct_picks,
  coalesce(sum(p.points), 0) as total_points,
  case when count(p.id) > 0
    then round(count(case when p.correct = true then 1 end)::numeric / count(p.id) * 100, 1)
    else 0
  end as accuracy
from group_members gm
join users u on u.id = gm.user_id
left join picks p on p.user_id = gm.user_id
  and p.group_id = gm.group_id
group by gm.group_id, gm.user_id, u.name, u.avatar_emoji;

-- ─── GRANTS para la vista ────────────────────────────────────
grant select on leaderboard to anon, authenticated;
