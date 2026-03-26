-- Run this in Supabase SQL Editor

-- ─── CHAT ──────────────────────────────────────────────
create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);
create index if not exists idx_chat_group on chat_messages(group_id, created_at desc);
alter table chat_messages enable row level security;
create policy "public_chat" on chat_messages for all using (true) with check (true);
grant all on chat_messages to anon, authenticated;

-- ─── ACHIEVEMENTS ──────────────────────────────────────
create table if not exists user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_key)
);
alter table user_achievements enable row level security;
create policy "public_achievements" on user_achievements for all using (true) with check (true);
grant all on user_achievements to anon, authenticated;

-- ─── MINI GAME SCORES ──────────────────────────────────
create table if not exists mini_game_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  game_type text not null,
  score int default 0,
  updated_at timestamptz default now(),
  unique(user_id, game_type)
);
alter table mini_game_scores enable row level security;
create policy "public_mini_scores" on mini_game_scores for all using (true) with check (true);
grant all on mini_game_scores to anon, authenticated;

-- ─── PUSH SUBSCRIPTIONS ─────────────────────────────
create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade unique,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);
alter table push_subscriptions enable row level security;
create policy "public_push_subs" on push_subscriptions for all using (true) with check (true);
grant all on push_subscriptions to anon, authenticated;

-- ─── NOTIFICATION PREFS ─────────────────────────────
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
create policy "public_notif_prefs" on notification_prefs for all using (true) with check (true);
grant all on notification_prefs to anon, authenticated;
