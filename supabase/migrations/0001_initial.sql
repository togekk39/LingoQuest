-- LingoQuest MVP v1 schema draft. Run in a Supabase PostgreSQL project.
-- IMPORTANT: audit grants/policies and run multi-user security tests before launch.
-- Backend-only answer keys are in non-exposed schema private.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  ui_locale text not null default 'es-419' check (ui_locale = 'es-419'),
  learning_locale text not null default 'en-US' check (learning_locale = 'en-US'),
  target_minutes smallint not null default 10 check (target_minutes in (5, 10, 15)),
  current_cefr text not null default 'A1' check (current_cefr in ('A1','A2')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.units (
  id text primary key,
  seq smallint not null unique check (seq > 0),
  title_es text not null,
  description_es text not null,
  cefr text not null check (cefr in ('A1','A2')),
  published boolean not null default false
);

create table public.lessons (
  id text primary key,
  unit_id text not null references public.units(id),
  seq smallint not null check (seq > 0),
  title_es text not null,
  estimated_minutes smallint not null default 7 check (estimated_minutes between 1 and 30),
  published boolean not null default false,
  unique (unit_id, seq)
);

create table public.skills (
  id text primary key,
  label_es text not null,
  category text not null check (category in ('grammar','pronunciation','communication')),
  cefr text not null check (cefr in ('A1','A2')),
  tag text
);

create table public.lesson_skills (
  lesson_id text not null references public.lessons(id) on delete cascade,
  skill_id text not null references public.skills(id) on delete cascade,
  primary key (lesson_id,skill_id)
);

create table public.exercises (
  id text primary key,
  lesson_id text not null references public.lessons(id),
  seq smallint not null check (seq > 0),
  exercise_type text not null check (exercise_type in
    ('single_choice','cloze','reorder','correction','short_text','read_aloud')),
  content_version integer not null default 1 check (content_version >= 1),
  difficulty smallint not null default 1 check (difficulty between 1 and 5),
  prompt jsonb not null check (jsonb_typeof(prompt) = 'object'),
  public_options jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  unique (lesson_id, seq)
);

create table private.exercise_keys (
  exercise_id text primary key references public.exercises(id) on delete cascade,
  content_version integer not null check (content_version >= 1),
  answer_rule jsonb not null check (jsonb_typeof(answer_rule) = 'object'),
  explanation_es text not null,
  rubric jsonb not null default '{}'::jsonb
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_attempt_id uuid not null,
  exercise_id text not null references public.exercises(id),
  content_version integer not null,
  answer jsonb not null,
  result text not null check (result in ('graded','needs_review')),
  is_correct boolean,
  score numeric(5,4) check (score between 0 and 1),
  answer_mode text not null check (answer_mode in ('recognition','production','speaking')),
  answered_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id,client_attempt_id)
);

create table public.skill_mastery (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id text not null references public.skills(id),
  mastery numeric(5,4) not null default 0 check (mastery between 0 and 1),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  unprompted_success_count integer not null default 0 check (unprompted_success_count >= 0),
  last_practiced_at timestamptz,
  next_review_at timestamptz,
  last_delayed_success_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id,skill_id)
);

create table public.review_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id text not null references public.skills(id),
  due_at timestamptz not null,
  status text not null default 'due' check (status in ('due','completed','cancelled')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_attempt_id uuid unique references public.attempts(id) on delete cascade,
  xp integer not null check (xp >= 0 and xp <= 500),
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.pronunciation_prompts (
  id text primary key,
  skill_id text not null references public.skills(id),
  target_text text not null,
  target_ipa text,
  hint_es text not null,
  reference_audio_url text,
  published boolean not null default false
);

create table public.pronunciation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prompt_id text not null references public.pronunciation_prompts(id),
  result text not null check (result in ('scored','unscorable','error')),
  score numeric(5,2) check (score between 0 and 100),
  feedback_es text,
  phoneme_evidence jsonb,
  reliability_warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.dialogue_scenarios (
  id text primary key,
  title_es text not null,
  cefr text not null check (cefr in ('A1','A2')),
  public_scene jsonb not null,
  published boolean not null default false
);

create table public.dialogue_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scenario_id text not null references public.dialogue_scenarios(id),
  current_state text not null,
  turns jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for RLS filters and due reviews
create index idx_attempts_user_created on public.attempts (user_id, created_at desc);
create index idx_mastery_due on public.skill_mastery (user_id, next_review_at);
create index idx_reviews_user_due on public.review_queue (user_id, status, due_at);
create index idx_xp_user_created on public.xp_events (user_id, created_at desc);
create index idx_pronunciation_attempts_user on public.pronunciation_attempts (user_id, created_at desc);
create index idx_dialogue_sessions_user on public.dialogue_sessions (user_id, updated_at desc);

-- Enable RLS for all exposed public tables
alter table public.profiles enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.skills enable row level security;
alter table public.lesson_skills enable row level security;
alter table public.exercises enable row level security;
alter table public.attempts enable row level security;
alter table public.skill_mastery enable row level security;
alter table public.review_queue enable row level security;
alter table public.xp_events enable row level security;
alter table public.pronunciation_prompts enable row level security;
alter table public.pronunciation_attempts enable row level security;
alter table public.dialogue_scenarios enable row level security;
alter table public.dialogue_sessions enable row level security;

-- Revoke broad access first. Backend's service_role can bypass RLS.
revoke all on public.profiles, public.units, public.lessons, public.skills,
 public.lesson_skills, public.exercises, public.attempts, public.skill_mastery,
 public.review_queue, public.xp_events, public.pronunciation_prompts,
 public.pronunciation_attempts, public.dialogue_scenarios, public.dialogue_sessions
 from anon, authenticated;
revoke all on private.exercise_keys from public, anon, authenticated;
grant select on private.exercise_keys to service_role;

-- Clients only read published course content and their own progress.
grant select on public.units,public.lessons,public.skills,public.lesson_skills,
 public.exercises,public.pronunciation_prompts,public.dialogue_scenarios to authenticated;
grant select on public.attempts,public.skill_mastery,public.review_queue,
 public.xp_events,public.pronunciation_attempts,public.dialogue_sessions to authenticated;
grant select,insert,update on public.profiles to authenticated;

create policy read_published_units on public.units for select to authenticated using (published = true);
create policy read_published_lessons on public.lessons for select to authenticated using (published = true);
create policy read_skills on public.skills for select to authenticated using (true);
create policy read_lesson_skills on public.lesson_skills for select to authenticated using (
  exists (select 1 from public.lessons l where l.id = lesson_id and l.published = true)
);
create policy read_published_exercises on public.exercises for select to authenticated using (published = true);
create policy read_published_speech_prompts on public.pronunciation_prompts for select to authenticated using (published = true);
create policy read_published_scenarios on public.dialogue_scenarios for select to authenticated using (published = true);

create policy read_own_profile on public.profiles for select to authenticated
 using ((select auth.uid()) = id);
create policy insert_own_profile on public.profiles for insert to authenticated
 with check ((select auth.uid()) = id);
create policy update_own_profile on public.profiles for update to authenticated
 using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy read_own_attempts on public.attempts for select to authenticated
 using ((select auth.uid()) = user_id);
create policy read_own_mastery on public.skill_mastery for select to authenticated
 using ((select auth.uid()) = user_id);
create policy read_own_reviews on public.review_queue for select to authenticated
 using ((select auth.uid()) = user_id);
create policy read_own_xp on public.xp_events for select to authenticated
 using ((select auth.uid()) = user_id);
create policy read_own_speech_attempts on public.pronunciation_attempts for select to authenticated
 using ((select auth.uid()) = user_id);
create policy read_own_dialogue_sessions on public.dialogue_sessions for select to authenticated
 using ((select auth.uid()) = user_id);

-- Important implementation notes:
-- 1. Public course access for unsigned guest mode is via bundled sample content, not anon RLS grants.
-- 2. Backend must validate user JWT and derive user_id from it; never trust client-supplied user_id.
-- 3. Backend owns attempts/mastery/review_queue/XP writes (no authenticated INSERT/UPDATE grants).
-- 4. Do not expose `private` as an API schema.
-- 5. Implement multi-user RLS tests and validate privileges of service_role before deploying.
-- 6. Content edits must create new versioned exercise IDs or preserve historical answer versions;
--    this schema is a baseline and does not store all historic key versions.
