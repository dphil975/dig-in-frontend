-- ============================================================================
-- Profiles: unique usernames + server-side language moderation
--
-- The client filter (src/lib/wordFilter.js) is UX only and is bypassable, so
-- these are the AUTHORITATIVE checks. Run in the Supabase SQL editor, or via the
-- Supabase CLI (`supabase db push`).
-- ============================================================================

create extension if not exists citext;   -- case-insensitive text → "Chef" == "chef"

-- ── Normalize a string the same way the client does ────────────────────────
-- lowercase, fold common leetspeak, strip everything that isn't a-z, so
-- "sh!t", "f4ggot", "b_i_t_c_h" all collapse to their root form.
create or replace function public.normalize_for_filter(input text)
returns text
language sql immutable
as $$
  select regexp_replace(
           translate(lower(coalesce(input, '')), '01345789@$!', 'oieastbgasi'),
           '[^a-z]', '', 'g'
         );
$$;

-- ── Blocked-word check (mirror of the client list; keep this one canonical) ──
create or replace function public.contains_banned_word(input text)
returns boolean
language plpgsql immutable
as $$
declare
  norm  text := public.normalize_for_filter(input);
  roots text[] := array[
    -- profanity
    'fuck','shit','bitch','cunt','asshole','bastard','dick','cock','pussy',
    'whore','slut','wank','bollock','motherfucker','jackass',
    -- slurs
    'nigger','nigga','faggot','fag','retard','tranny','kike','spic','chink',
    'gook','wetback','coon','dyke','paki','raghead','beaner'
  ];
  r text;
begin
  if norm = '' then
    return false;
  end if;
  foreach r in array roots loop
    if position(r in norm) > 0 then
      return true;
    end if;
  end loop;
  return false;
end;
$$;

-- ── The table ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   citext unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Enforce format + moderation on every insert/update ─────────────────────
create or replace function public.validate_username()
returns trigger
language plpgsql
as $$
begin
  if new.username is null
     or length(new.username) < 3
     or length(new.username) > 20
     or new.username !~ '^[A-Za-z0-9_]+$' then
    raise exception 'invalid_username_format'
      using hint = 'Use 3-20 letters, numbers, or underscores.';
  end if;

  if public.contains_banned_word(new.username) then
    raise exception 'username_blocked_language'
      using hint = 'That username contains blocked language.';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_validate_username on public.profiles;
create trigger trg_validate_username
  before insert or update of username on public.profiles
  for each row execute function public.validate_username();

-- ── Auto-create a profile from the username stored in signup metadata ──────
-- If the username is taken or blocked, this raises → the whole signup is rolled
-- back, so a bad/duplicate username can never create an account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.raw_user_meta_data ? 'username' then
    insert into public.profiles (id, username)
    values (new.id, new.raw_user_meta_data->>'username');
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row-level security ─────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Anyone signed in can read profiles (needed for @mentions, leaderboards, etc.)
drop policy if exists "profiles readable by authenticated" on public.profiles;
create policy "profiles readable by authenticated"
  on public.profiles for select
  to authenticated using (true);

-- A user may only change their own row. Inserts happen via the trigger above
-- (security definer), so there is deliberately no client INSERT policy.
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ── Availability check for the sign-up form (callable before login) ────────
-- Lets the UI grey out taken names before submit. Usernames aren't secret, so
-- exposing availability is fine.
create or replace function public.is_username_available(candidate text)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select not exists (select 1 from public.profiles where username = candidate);
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;
