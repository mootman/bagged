-- Bagged MVP schema. Run in the Supabase SQL editor.
-- Logs live on the device for now. The server only stores what claim links need:
-- a climb (peak + day + who tagged) and one secret token per tagged partner.
-- Clients never touch tables directly; everything goes through the functions below.

create extension if not exists pgcrypto;

create table if not exists climbs (
  id uuid primary key default gen_random_uuid(),
  peak_id text not null,
  climb_date date,
  tagger_name text not null check (char_length(tagger_name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table if not exists climb_tags (
  token text primary key,
  climb_id uuid not null references climbs(id) on delete cascade,
  partner_name text not null check (char_length(partner_name) between 1 and 60),
  claimed_at timestamptz,
  claimer_name text,
  created_at timestamptz not null default now()
);

alter table climbs enable row level security;
alter table climb_tags enable row level security;
-- No policies: direct table access is denied. The security definer functions below are the API.

create or replace function create_climb_with_tags(
  p_peak_id text,
  p_climb_date date,
  p_tagger_name text,
  p_partner_names text[]
) returns table (token text, partner_name text)
language plpgsql security definer set search_path = public as $$
declare
  v_climb uuid;
  v_name text;
begin
  if array_length(p_partner_names, 1) is null or array_length(p_partner_names, 1) > 20 then
    raise exception 'between 1 and 20 partners';
  end if;
  insert into climbs (peak_id, climb_date, tagger_name)
  values (p_peak_id, p_climb_date, trim(p_tagger_name))
  returning id into v_climb;

  foreach v_name in array p_partner_names loop
    token := encode(gen_random_bytes(12), 'hex');
    partner_name := trim(v_name);
    insert into climb_tags (token, climb_id, partner_name) values (token, v_climb, partner_name);
    return next;
  end loop;
end $$;

create or replace function get_claim(p_token text)
returns table (token text, peak_id text, climb_date date, tagger_name text, partner_name text, claimed boolean)
language sql security definer set search_path = public stable as $$
  select t.token, c.peak_id, c.climb_date, c.tagger_name, t.partner_name, t.claimed_at is not null
  from climb_tags t join climbs c on c.id = t.climb_id
  where t.token = p_token;
$$;

create or replace function claim_tag(p_token text, p_claimer_name text)
returns void
language sql security definer set search_path = public as $$
  update climb_tags
  set claimed_at = coalesce(claimed_at, now()), claimer_name = coalesce(claimer_name, trim(p_claimer_name))
  where token = p_token;
$$;

-- Growth metric: share of tags that get claimed, and how fast.
create or replace view claim_funnel as
select
  date_trunc('week', t.created_at) as week,
  count(*) as tags_sent,
  count(t.claimed_at) as tags_claimed,
  round(100.0 * count(t.claimed_at) / nullif(count(*), 0), 1) as claim_rate_pct
from climb_tags t
group by 1
order by 1 desc;

revoke all on claim_funnel from anon, authenticated;
grant execute on function create_climb_with_tags(text, date, text, text[]) to anon, authenticated;
grant execute on function get_claim(text) to anon, authenticated;
grant execute on function claim_tag(text, text) to anon, authenticated;
