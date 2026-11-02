-- Social backend for Register. Run after schema.sql (claim links) in the Supabase SQL editor.
-- Mirrors src/lib/types.ts. Row level security on every table: you can read what your
-- circle (you + people you follow) and public plans expose, and write only your own rows.
-- Not wired to the client yet: the app runs on the demo crew in src/lib/social/seed.ts.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  handle text unique not null check (handle ~ '^[a-z0-9._]{2,30}$'),
  home text default '',
  color text default '#FF7A45',
  favorites text[] default '{}' check (array_length(favorites, 1) is null or array_length(favorites, 1) <= 4),
  created_at timestamptz default now()
);

create table if not exists follows (
  follower uuid references profiles(id) on delete cascade,
  followee uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower, followee),
  check (follower <> followee)
);

create table if not exists wants (
  user_id uuid references profiles(id) on delete cascade,
  peak_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, peak_id)
);

create table if not exists ascents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  peak_id text not null,
  climb_date date,
  with_ids uuid[] default '{}',
  guests jsonb default '[]',
  note text default '' check (char_length(note) <= 2000),
  -- Conditions report: surface, traction, wind, summitTime, route
  beta jsonb,
  source text not null default 'manual',
  tagged_by uuid references profiles(id),
  plan_id uuid,
  created_at timestamptz default now(),
  unique (user_id, peak_id, climb_date)
);
create index if not exists ascents_peak_date on ascents (peak_id, climb_date desc);
create index if not exists ascents_user on ascents (user_id, climb_date desc);

create table if not exists kudos (
  ascent_id uuid references ascents(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (ascent_id, user_id)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  ascent_id uuid not null references ascents(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz default now()
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  peak_id text not null,
  plan_date date not null,
  start_time text not null,
  host_id uuid not null references profiles(id) on delete cascade,
  size int not null check (size between 2 and 12),
  visibility text not null check (visibility in ('crew', 'public')),
  note text default '',
  done boolean default false,
  created_at timestamptz default now()
);

create table if not exists plan_members (
  plan_id uuid references plans(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text not null check (status in ('invited', 'requested', 'going')),
  created_at timestamptz default now(),
  primary key (plan_id, user_id)
);

-- Helpers ------------------------------------------------------------------

create or replace function in_circle(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select target = auth.uid()
      or exists (select 1 from follows where follower = auth.uid() and followee = target);
$$;

create or replace function on_plan(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from plan_members where plan_id = p and user_id = auth.uid());
$$;

-- RLS ----------------------------------------------------------------------

alter table profiles enable row level security;
alter table follows enable row level security;
alter table wants enable row level security;
alter table ascents enable row level security;
alter table kudos enable row level security;
alter table comments enable row level security;
alter table plans enable row level security;
alter table plan_members enable row level security;

-- Profiles are public (needed for search and suggestions); you edit only yours.
create policy profiles_read on profiles for select using (true);
create policy profiles_write on profiles for all using (id = auth.uid()) with check (id = auth.uid());

create policy follows_read on follows for select using (true);
create policy follows_write on follows for all using (follower = auth.uid()) with check (follower = auth.uid());

create policy wants_read on wants for select using (true);
create policy wants_write on wants for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Ascents: conditions reports are the shared good, so they're readable by everyone signed in.
create policy ascents_read on ascents for select using (auth.uid() is not null);
-- Tagging inserts a row for a friend. Before launch, make tagged rows pending until the friend confirms.
create policy ascents_write on ascents for insert with check (user_id = auth.uid() or (tagged_by = auth.uid() and in_circle(user_id)));
create policy ascents_update on ascents for update using (user_id = auth.uid());
create policy ascents_delete on ascents for delete using (user_id = auth.uid());

create policy kudos_read on kudos for select using (auth.uid() is not null);
create policy kudos_write on kudos for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy comments_read on comments for select using (auth.uid() is not null);
create policy comments_insert on comments for insert with check (user_id = auth.uid());
create policy comments_delete on comments for delete using (user_id = auth.uid());

-- Plans: public plans and plans in your circle are visible; crew plans only to the circle.
create policy plans_read on plans for select using (visibility = 'public' or in_circle(host_id) or on_plan(id));
create policy plans_write on plans for all using (host_id = auth.uid()) with check (host_id = auth.uid());

-- Members: you can request to join; the host invites and approves.
create policy members_read on plan_members for select using (
  exists (select 1 from plans p where p.id = plan_id and (p.visibility = 'public' or in_circle(p.host_id) or on_plan(p.id)))
);
create policy members_request on plan_members for insert with check (
  (user_id = auth.uid() and status = 'requested')
  or exists (select 1 from plans p where p.id = plan_id and p.host_id = auth.uid())
);
create policy members_host_update on plan_members for update using (
  exists (select 1 from plans p where p.id = plan_id and p.host_id = auth.uid())
  or user_id = auth.uid()
);
create policy members_leave on plan_members for delete using (
  user_id = auth.uid() or exists (select 1 from plans p where p.id = plan_id and p.host_id = auth.uid())
);

-- Feed: ascents from your circle, newest first. One query for the home screen.
create or replace view feed as
  select a.*, (select count(*) from kudos k where k.ascent_id = a.id) as kudos_count,
         (select count(*) from comments c where c.ascent_id = a.id) as comment_count
  from ascents a
  where in_circle(a.user_id)
  order by a.created_at desc;

-- Latest conditions for a peak (last 45 days).
create or replace function peak_beta(p_peak text)
returns setof ascents language sql stable security definer set search_path = public as $$
  select * from ascents
  where peak_id = p_peak and beta ? 'surface' and climb_date >= current_date - 45
  order by climb_date desc, created_at desc
  limit 20;
$$;
