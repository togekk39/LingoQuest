-- LingoQuest v1.1 dual-mode additive migration; apply AFTER 0001_initial.sql.
-- DRAFT: requires local Supabase tests, RLS/security review and server-side transactions before launch.
-- Do not grant client writes to learning completion or challenge result tables.

create table public.lesson_completions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id text not null references public.lessons(id),
  completed_at timestamptz not null default now(),
  completion_version integer not null default 1 check (completion_version > 0),
  primary key (user_id, lesson_id)
);

create table public.challenge_tracks (
  id text primary key,
  required_unit_id text not null references public.units(id),
  title_es text not null,
  description_es text not null,
  default_type text not null check (default_type in ('grammar_rush','cloze_battle','reading_quest')),
  published boolean not null default false,
  content_version integer not null default 1 check (content_version > 0),
  created_at timestamptz not null default now()
);

create table public.challenge_levels (
  track_id text not null references public.challenge_tracks(id) on delete cascade,
  level_no smallint not null check (level_no between 1 and 13),
  rule_version integer not null default 1 check (rule_version > 0),
  question_count smallint not null check (question_count between 1 and 30),
  hearts_initial smallint not null check (hearts_initial between 1 and 10),
  grammar_rush_seconds integer not null check (grammar_rush_seconds between 30 and 3600),
  -- Reading and cloze time limits are computed using content lengths in backend.
  -- Do not apply grammar_rush_seconds to long reading passages.
  difficulty smallint not null check (difficulty between 1 and 13),
  primary key (track_id, level_no)
);

-- Client cannot directly SELECT challenge question bank; a backend endpoint returns
-- only assigned public prompt/options for the active run.
create table public.challenge_questions (
  id text primary key,
  track_id text not null references public.challenge_tracks(id),
  question_type text not null check (question_type in ('single_choice','cloze','reading')),
  skill_tags text[] not null default '{}',
  prompt jsonb not null check (jsonb_typeof(prompt) = 'object'),
  content_version integer not null default 1 check (content_version > 0),
  difficulty smallint not null check (difficulty between 1 and 13),
  word_count integer not null default 0 check (word_count >= 0),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table private.challenge_answer_keys (
  question_id text primary key references public.challenge_questions(id) on delete cascade,
  content_version integer not null check (content_version > 0),
  answer_rule jsonb not null check (jsonb_typeof(answer_rule) = 'object'),
  explanation_es text not null
);

create table public.challenge_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id text not null references public.challenge_tracks(id),
  highest_unlocked_level smallint not null default 1 check (highest_unlocked_level between 1 and 13),
  best_completed_level smallint not null default 0 check (best_completed_level between 0 and 13),
  best_score integer not null default 0 check (best_score >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, track_id),
  check (best_completed_level <= highest_unlocked_level)
);

create table public.challenge_runs (
  id uuid primary key default gen_random_uuid(),
  client_request_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id text not null references public.challenge_tracks(id),
  level_no smallint not null check (level_no between 1 and 13),
  mode text not null check (mode in ('ranked','practice')),
  challenge_type text not null check (challenge_type in ('grammar_rush','cloze_battle','reading_quest')),
  rule_version integer not null check (rule_version > 0),
  question_count smallint not null check (question_count between 1 and 30),
  status text not null default 'active' check (status in ('active','passed','failed','abandoned','interrupted')),
  hearts_initial smallint not null check (hearts_initial between 1 and 10),
  hearts_remaining smallint not null check (hearts_remaining between 0 and 10),
  completed_questions smallint not null default 0 check (completed_questions >= 0),
  correct_count smallint not null default 0 check (correct_count >= 0),
  score integer not null default 0 check (score >= 0),
  started_at timestamptz not null default now(),
  deadline_at timestamptz not null,
  finished_at timestamptz,
  unique (user_id, client_request_id),
  check (hearts_remaining <= hearts_initial),
  check (correct_count <= completed_questions),
  check (completed_questions <= question_count)
);

-- Run-specific assigned question order is server-only.
create table private.challenge_run_items (
  run_id uuid not null references public.challenge_runs(id) on delete cascade,
  position smallint not null check (position > 0),
  question_id text not null references public.challenge_questions(id),
  question_content_version integer not null check (question_content_version > 0),
  primary key (run_id, position),
  unique (run_id, question_id)
);

create table public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.challenge_runs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_submission_id uuid not null,
  question_position smallint not null check (question_position > 0),
  response jsonb not null check (jsonb_typeof(response) = 'object'),
  is_correct boolean not null,
  heart_cost smallint not null check (heart_cost between 0 and 2),
  response_time_ms integer check (response_time_ms >= 0),
  created_at timestamptz not null default now(),
  unique (run_id, question_position),
  unique (user_id, client_submission_id)
);

create index idx_lesson_completions_user on public.lesson_completions(user_id, completed_at desc);
create index idx_challenge_tracks_unit on public.challenge_tracks(required_unit_id);
create index idx_challenge_questions_track on public.challenge_questions(track_id, published, difficulty);
create index idx_challenge_runs_user on public.challenge_runs(user_id, started_at desc);
create index idx_challenge_submissions_run on public.challenge_submissions(run_id, question_position);

-- Policies: read-only published track/level metadata + each user's progress; all writes server-owned.
alter table public.lesson_completions enable row level security;
alter table public.challenge_tracks enable row level security;
alter table public.challenge_levels enable row level security;
alter table public.challenge_questions enable row level security;
alter table public.challenge_progress enable row level security;
alter table public.challenge_runs enable row level security;
alter table public.challenge_submissions enable row level security;

revoke all on public.lesson_completions, public.challenge_tracks, public.challenge_levels,
 public.challenge_questions, public.challenge_progress, public.challenge_runs,
 public.challenge_submissions from anon, authenticated;
revoke all on private.challenge_answer_keys, private.challenge_run_items from public, anon, authenticated;
grant select, insert, update, delete on private.challenge_answer_keys, private.challenge_run_items to service_role;
-- Explicitly give backend service role access to the new server-managed tables.
-- BYPASSRLS alone is not a replacement for SQL object privileges.
grant select, insert, update, delete on public.lesson_completions, public.challenge_tracks,
 public.challenge_levels, public.challenge_questions, public.challenge_progress,
 public.challenge_runs, public.challenge_submissions to service_role;

grant select on public.lesson_completions, public.challenge_tracks, public.challenge_levels,
 public.challenge_progress, public.challenge_runs, public.challenge_submissions to authenticated;

create policy read_own_lesson_completions on public.lesson_completions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy read_published_challenge_tracks on public.challenge_tracks
  for select to authenticated using (published = true);
create policy read_published_challenge_levels on public.challenge_levels
  for select to authenticated using (exists (
    select 1 from public.challenge_tracks t where t.id = track_id and t.published = true
  ));
create policy read_own_challenge_progress on public.challenge_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy read_own_challenge_runs on public.challenge_runs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy read_own_challenge_submissions on public.challenge_submissions
  for select to authenticated using ((select auth.uid()) = user_id);
-- No policies / no authenticated SELECT on challenge_questions: accessible by server only.

-- INTEGRATION REQUIREMENTS (in API, transactional):
-- 1. Server checks that all PUBLISHED lessons of required_unit_id are completed,
--    and that the published required unit actually has lessons, before opening ranked challenge.
-- 2. Lesson completions are written only after verifying server-graded required practice steps.
-- 3. Challenge runs use DB clock for deadlines. Do not trust client time/hearts/score.
-- 4. Idempotent submissions + finish guarded by row locks, transaction and constraints.
-- 5. Challenge failure must NEVER update learning mastery, lesson completion or XP.
-- 6. Do not auto-publicize tracks/questions before content review and security testing.
-- 7. `challenge_levels` rules can change; server must snapshot all rule details per run
--    or keep archived immutable rules versions. This draft snapshots core fields and version.
-- 8. Historical question answer keys need immutable versioning before editing published content.
