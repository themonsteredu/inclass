-- learning-platform initial schema
-- Run in Supabase SQL editor (one-shot). All access goes through service role
-- from the Next.js server, so no RLS policies are needed.

create extension if not exists "pgcrypto";

-- ============ USERS ============
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  login_id      text not null unique,
  name          text not null,
  password_hash text not null,
  role          text not null check (role in ('admin','student')) default 'student',
  status        text not null check (status in ('active','dormant')) default 'active',
  dormant_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_users_status on users(status);

-- ============ WORKBOOKS / PROBLEMS / LECTURES ============
create table if not exists workbooks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists problems (
  id           uuid primary key default gen_random_uuid(),
  workbook_id  uuid not null references workbooks(id) on delete cascade,
  number       int  not null,
  title        text,
  created_at   timestamptz not null default now(),
  unique (workbook_id, number)
);
create index if not exists idx_problems_workbook on problems(workbook_id, number);

create table if not exists lectures (
  id            uuid primary key default gen_random_uuid(),
  problem_id    uuid not null references problems(id) on delete cascade,
  kind          text not null check (kind in ('tip','concept','type')),
  title         text,
  drive_file_id text not null,
  duration_sec  int  not null default 0,
  created_at    timestamptz not null default now(),
  unique (problem_id, kind)
);
create index if not exists idx_lectures_problem on lectures(problem_id);

-- ============ ROADMAPS (2-year plan per student) ============
create table if not exists roadmaps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  title      text not null default '2년 로드맵',
  start_date date not null,
  end_date   date not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_roadmaps_user on roadmaps(user_id);

create table if not exists roadmap_items (
  id           uuid primary key default gen_random_uuid(),
  roadmap_id   uuid not null references roadmaps(id) on delete cascade,
  workbook_id  uuid not null references workbooks(id) on delete restrict,
  target_start date not null,
  target_end   date not null,
  position     int  not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists idx_roadmap_items_roadmap on roadmap_items(roadmap_id, position);

-- ============ STUDY PLANS (per workbook, with auto/manual distribution) ============
create table if not exists study_plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  workbook_id     uuid not null references workbooks(id) on delete restrict,
  roadmap_item_id uuid references roadmap_items(id) on delete set null,
  source          text not null check (source in ('auto','manual')) default 'auto',
  start_date      date not null,
  end_date        date not null,
  -- weekday bitmask: Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64
  -- default: Mon-Sat (Sun excluded) = 63
  weekdays_mask   int  not null default 63,
  hours_per_day   numeric(4,2) not null default 2.0,
  created_at      timestamptz not null default now()
);
create index if not exists idx_study_plans_user on study_plans(user_id);

create table if not exists plan_days (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references study_plans(id) on delete cascade,
  date          date not null,
  problem_ids   jsonb not null default '[]'::jsonb,
  unique (plan_id, date)
);
create index if not exists idx_plan_days_plan_date on plan_days(plan_id, date);

-- ============ EVENTS / PROGRESS ============
create table if not exists lecture_views (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  lecture_id      uuid not null references lectures(id) on delete cascade,
  watched_sec     int  not null default 0,
  view_count      int  not null default 0,
  completed       boolean not null default false,
  last_watched_at timestamptz,
  unique (user_id, lecture_id)
);
create index if not exists idx_lecture_views_user on lecture_views(user_id);

create table if not exists problem_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  problem_id  uuid not null references problems(id) on delete cascade,
  kind        text not null check (kind in ('tip_clicked','concept_clicked','type_clicked','marked_done')),
  created_at  timestamptz not null default now()
);
create index if not exists idx_problem_events_user_problem on problem_events(user_id, problem_id);
create index if not exists idx_problem_events_kind on problem_events(kind);

create table if not exists problem_completions (
  user_id     uuid not null references users(id) on delete cascade,
  problem_id  uuid not null references problems(id) on delete cascade,
  done_at     timestamptz not null default now(),
  primary key (user_id, problem_id)
);

-- ============ DRIVE OAUTH (single shared admin token) ============
create table if not exists drive_tokens (
  id            int primary key default 1,
  access_token  text,
  refresh_token text,
  expiry_date   timestamptz,
  scope         text,
  updated_at    timestamptz not null default now(),
  check (id = 1)
);
