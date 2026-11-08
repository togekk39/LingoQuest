-- Additive hardening of the supplied 0001/0002 drafts.
-- This schema is a future Supabase adapter, not the local SQLite runtime.
-- Apply using the database owner only after testing against a project clone.

-- Never rely on Supabase's project-wide default grants for server-owned data.
revoke all on all tables in schema private from public, anon, authenticated;
revoke all on all sequences in schema private from public, anon, authenticated;
alter default privileges in schema private revoke all on tables from public, anon, authenticated;
alter default privileges in schema private revoke all on sequences from public, anon, authenticated;

grant usage on schema public, private to service_role;
grant select, insert, update, delete on public.profiles, public.units, public.lessons,
  public.skills, public.lesson_skills, public.exercises, public.attempts,
  public.skill_mastery, public.review_queue, public.xp_events,
  public.pronunciation_prompts, public.pronunciation_attempts,
  public.dialogue_scenarios, public.dialogue_sessions,
  public.lesson_completions, public.challenge_tracks, public.challenge_levels,
  public.challenge_questions, public.challenge_progress, public.challenge_runs,
  public.challenge_submissions to service_role;
grant select, insert, update, delete on private.exercise_keys,
  private.challenge_answer_keys, private.challenge_run_items to service_role;

-- The app may edit preferences, never its own CEFR, identity or audit timestamps.
revoke insert, update on public.profiles from authenticated;
grant insert (id, ui_locale, learning_locale, target_minutes)
  on public.profiles to authenticated;
grant update (ui_locale, learning_locale, target_minutes)
  on public.profiles to authenticated;

-- Publishing a child does not bypass an unpublished parent.
drop policy read_published_lessons on public.lessons;
create policy read_published_lessons on public.lessons for select to authenticated
  using (published and exists (
    select 1 from public.units u where u.id = unit_id and u.published
  ));
drop policy read_published_exercises on public.exercises;
create policy read_published_exercises on public.exercises for select to authenticated
  using (published and exists (
    select 1 from public.lessons l where l.id = lesson_id and l.published
  ));
drop policy read_published_challenge_tracks on public.challenge_tracks;
create policy read_published_challenge_tracks on public.challenge_tracks
  for select to authenticated using (published and exists (
    select 1 from public.units u where u.id = required_unit_id and u.published
  ));

-- Original key tables are authoring pointers. Immutable archives retain scoring
-- rules for attempts and runs that started before an author publishes a revision.
create table private.exercise_key_versions (
  exercise_id text not null references public.exercises(id),
  content_version integer not null check (content_version >= 1),
  answer_rule jsonb not null check (jsonb_typeof(answer_rule) = 'object'),
  explanation_es text not null,
  rubric jsonb not null default '{}'::jsonb,
  archived_at timestamptz not null default now(),
  primary key (exercise_id, content_version)
);
create table private.challenge_key_versions (
  question_id text not null references public.challenge_questions(id),
  content_version integer not null check (content_version >= 1),
  answer_rule jsonb not null check (jsonb_typeof(answer_rule) = 'object'),
  explanation_es text not null,
  archived_at timestamptz not null default now(),
  primary key (question_id, content_version)
);

insert into private.exercise_key_versions
  (exercise_id, content_version, answer_rule, explanation_es, rubric)
  select exercise_id, content_version, answer_rule, explanation_es, rubric
  from private.exercise_keys;
insert into private.challenge_key_versions
  (question_id, content_version, answer_rule, explanation_es)
  select question_id, content_version, answer_rule, explanation_es
  from private.challenge_answer_keys;

revoke all on private.exercise_key_versions, private.challenge_key_versions
  from public, anon, authenticated, service_role;
grant select, insert on private.exercise_key_versions, private.challenge_key_versions
  to service_role;

-- Reject in-place scoring edits. Increment content_version (and publish a new
-- immutable content ID for prompt changes); never regrade historical attempts
-- against a mutable latest key.
create function private.archive_exercise_key() returns trigger
language plpgsql set search_path = '' as $$
declare prior private.exercise_key_versions;
begin
  select * into prior from private.exercise_key_versions
    where exercise_id = new.exercise_id and content_version = new.content_version;
  if found and (prior.answer_rule is distinct from new.answer_rule
    or prior.explanation_es is distinct from new.explanation_es
    or prior.rubric is distinct from new.rubric) then
    raise exception 'Exercise answer versions are immutable' using errcode = '23514';
  end if;
  insert into private.exercise_key_versions
    (exercise_id, content_version, answer_rule, explanation_es, rubric)
    values (new.exercise_id, new.content_version, new.answer_rule, new.explanation_es, new.rubric)
    on conflict (exercise_id, content_version) do nothing;
  return new;
end;
$$;
create trigger archive_exercise_key after insert or update on private.exercise_keys
  for each row execute function private.archive_exercise_key();

create function private.archive_challenge_key() returns trigger
language plpgsql set search_path = '' as $$
declare prior private.challenge_key_versions;
begin
  select * into prior from private.challenge_key_versions
    where question_id = new.question_id and content_version = new.content_version;
  if found and (prior.answer_rule is distinct from new.answer_rule
    or prior.explanation_es is distinct from new.explanation_es) then
    raise exception 'Challenge answer versions are immutable' using errcode = '23514';
  end if;
  insert into private.challenge_key_versions
    (question_id, content_version, answer_rule, explanation_es)
    values (new.question_id, new.content_version, new.answer_rule, new.explanation_es)
    on conflict (question_id, content_version) do nothing;
  return new;
end;
$$;
create trigger archive_challenge_key after insert or update on private.challenge_answer_keys
  for each row execute function private.archive_challenge_key();

-- Trigger functions use caller privileges, not SECURITY DEFINER privileges.
revoke all on function private.archive_exercise_key(), private.archive_challenge_key()
  from public, anon, authenticated;
grant execute on function private.archive_exercise_key(), private.archive_challenge_key()
  to service_role;

-- A submission must belong to the same user as its run, even for backend writes.
alter table public.challenge_runs add constraint challenge_runs_id_user_unique unique (id, user_id);
alter table public.challenge_submissions add constraint challenge_submission_run_owner
  foreign key (run_id, user_id) references public.challenge_runs(id, user_id) on delete cascade;
alter table public.challenge_runs add constraint challenge_run_clock_order
  check (deadline_at > started_at);

comment on schema private is
  'Backend-only scoring data. Never add this schema to exposed PostgREST schemas.';
comment on table private.exercise_key_versions is
  'Append-only answer versions; API grading must select the exact exercise/content_version pair.';
comment on table private.challenge_key_versions is
  'Append-only answer versions; select run-snapshotted version, never latest mutable key.';
