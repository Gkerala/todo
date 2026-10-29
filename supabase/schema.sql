-- 길 B: Supabase(PostgreSQL) 표 + RLS 정책
-- 사용법: Supabase 대시보드 → SQL Editor → 이 파일 전체를 붙여 넣고 Run
-- 설계 설명은 DB.md 참고. 길 A(src/db/sqlite-init.ts)와 같은 표/규칙을 PostgreSQL 문법으로 쓴 것이다.

-- ─────────────────────────────────────────────
-- 1. 표
--    user_id 기본값 = auth.uid() : 로그인한 사람의 id (JWT 안에 들어 있음)
-- ─────────────────────────────────────────────

create table if not exists public.user_settings (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  wake_time  time not null,
  sleep_time time not null
);

create table if not exists public.routines (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 100),
  kind       text not null check (kind in ('wake','meal','medicine','study','exercise','sleep','etc')),
  start_time time not null,
  end_time   time,
  days       text not null check (days ~ '^[1-7]+$'),
  must_do    boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_time is null or end_time > start_time)
);
create index if not exists routines_user_idx on public.routines (user_id);

create table if not exists public.routine_checks (
  id         uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date       date not null,
  memo       text check (memo is null or char_length(memo) <= 200),
  minutes    integer check (minutes is null or minutes between 0 and 1440),
  checked_at timestamptz not null default now(),
  unique (routine_id, date)
);
create index if not exists routine_checks_user_date_idx on public.routine_checks (user_id, date);

create table if not exists public.todos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 100),
  date       date not null,
  start_time time,
  end_time   time,
  done       boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_time is null or (start_time is not null and end_time > start_time))
);
create index if not exists todos_user_date_idx on public.todos (user_id, date);

-- ─────────────────────────────────────────────
-- 2. 권한: 로그인한 사용자(authenticated)만 표에 접근할 수 있다.
--    로그인하지 않은 요청(anon)은 아예 막는다.
-- ─────────────────────────────────────────────

revoke all on public.user_settings, public.routines, public.routine_checks, public.todos from anon;
grant select, insert, update, delete
  on public.user_settings, public.routines, public.routine_checks, public.todos
  to authenticated;

-- ─────────────────────────────────────────────
-- 3. RLS (행 수준 보안): "자기 행만" 보고, 만들고, 고치고, 지울 수 있다.
--    using      : 어떤 행을 보거나 고치거나 지울 수 있는가
--    with check : 새로 만들거나 고친 결과가 규칙에 맞는가
--    (select auth.uid()) 로 감싸면 행마다 다시 계산하지 않아 빠르다.
-- ─────────────────────────────────────────────

alter table public.user_settings  enable row level security;
alter table public.routines       enable row level security;
alter table public.routine_checks enable row level security;
alter table public.todos          enable row level security;

drop policy if exists "own settings" on public.user_settings;
create policy "own settings" on public.user_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own routines" on public.routines;
create policy "own routines" on public.routines
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 체크는 "내 행"이면서 "내 루틴에 대한 체크"여야 한다 (남의 루틴 id로 체크를 만드는 것을 막음)
drop policy if exists "own checks" on public.routine_checks;
create policy "own checks" on public.routine_checks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = (select auth.uid())
    )
  );

drop policy if exists "own todos" on public.todos;
create policy "own todos" on public.todos
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
