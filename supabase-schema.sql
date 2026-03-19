-- ═══════════════════════════════════════════════════════════════
-- COURT IQ — Supabase Schema
-- Corre esto en Supabase SQL Editor (supabase.com → tu proyecto → SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- Usuarios (solo nombre, sin auth complejo)
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  avatar_emoji text default '🏀',
  created_at timestamptz default now()
);

-- Grupos de Pick'em
create table if not exists groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text unique not null,
  emoji text default '🏀',
  owner_id uuid references users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Miembros de grupo
create table if not exists group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- Picks (predicciones)
create table if not exists picks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  game_id text not null,
  game_date date not null,
  picked_team text not null,
  home_team text not null,
  away_team text not null,
  correct boolean default null,
  points integer default 0,
  scored boolean default false,
  created_at timestamptz default now(),
  unique(user_id, group_id, game_id)
);
--
-- Índices para performance
create index if not exists idx_picks_user on picks(user_id);
create index if not exists idx_picks_group on picks(group_id);
create index if not exists idx_picks_date on picks(game_date);
create index if not exists idx_group_members_user on group_members(user_id);
create index if not exists idx_groups_code on groups(code);

-- Row Level Security (permite acceso público para simplificar)
alter table users enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table picks enable row level security;

-- Políticas: acceso abierto (en producción real usarías auth)
create policy "public_users" on users for all using (true) with check (true);
create policy "public_groups" on groups for all using (true) with check (true);
create policy "public_members" on group_members for all using (true) with check (true);
create policy "public_picks" on picks for all using (true) with check (true);

-- Vista de leaderboard (puntos totales por usuario por grupo)
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
left join picks p on p.user_id = gm.user_id and p.group_id = gm.group_id
group by gm.group_id, gm.user_id, u.name, u.avatar_emoji;
