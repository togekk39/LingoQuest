-- Rollback-only integration assertions. Use a disposable migrated database.
-- Running against actual Supabase Auth/RLS remains a separate staging gate.
\set ON_ERROR_STOP on
begin;

insert into auth.users(id) values
 ('00000000-0000-4000-8000-000000000001'),
 ('00000000-0000-4000-8000-000000000002');
insert into public.profiles(id) select id from auth.users
 where id in ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002');
insert into public.units(id,seq,title_es,description_es,cefr,published) values
 ('security_public',901,'Prueba','Prueba','A1',true),
 ('security_hidden',902,'Oculto','Oculto','A1',false);
insert into public.lessons(id,unit_id,seq,title_es,published) values
 ('security_lesson','security_public',1,'Prueba',true),
 ('security_draft','security_public',2,'Borrador',false),
 ('security_hidden_child','security_hidden',1,'Oculto',true);
insert into public.skills(id,label_es,category,cefr) values ('security_skill','Prueba','grammar','A1');
insert into public.exercises(id,lesson_id,seq,exercise_type,prompt,published) values
 ('security_exercise','security_lesson',1,'single_choice','{"text":"I ___ here."}',true),
 ('security_draft_exercise','security_draft',1,'single_choice','{"text":"Draft"}',true),
 ('security_hidden_exercise','security_hidden_child',1,'single_choice','{"text":"Hidden"}',true);
insert into private.exercise_keys(exercise_id,content_version,answer_rule,explanation_es)
 values ('security_exercise',1,'{"optionId":"am"}','Con I usamos am.');
insert into public.attempts(user_id,client_attempt_id,exercise_id,content_version,answer,result,is_correct,score,answer_mode,answered_at)
 select id,gen_random_uuid(),'security_exercise',1,'{"optionId":"am"}','graded',true,1,'recognition',now()
 from public.profiles where id in ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
insert into public.skill_mastery(user_id,skill_id) select id,'security_skill' from public.profiles
 where id in ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
insert into public.review_queue(user_id,skill_id,due_at) select id,'security_skill',now() from public.profiles
 where id in ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
insert into public.xp_events(user_id,xp,reason) select id,10,'security fixture' from public.profiles
 where id in ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
insert into public.lesson_completions(user_id,lesson_id) select id,'security_lesson' from public.profiles
 where id in ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
insert into public.challenge_tracks(id,required_unit_id,title_es,description_es,default_type,published) values
 ('security_track','security_public','Prueba','Prueba','grammar_rush',true),
 ('security_hidden_track','security_hidden','Oculto','Oculto','grammar_rush',true);
insert into public.challenge_questions(id,track_id,question_type,prompt,difficulty)
 values ('security_question','security_track','single_choice','{"text":"She ___ here."}',1);
insert into private.challenge_answer_keys(question_id,content_version,answer_rule,explanation_es)
 values ('security_question',1,'{"optionId":"works"}','Con she agregamos -s.');
insert into public.challenge_runs(id,client_request_id,user_id,track_id,level_no,mode,challenge_type,rule_version,question_count,hearts_initial,hearts_remaining,deadline_at)
 values
 ('00000000-0000-4000-9000-000000000001',gen_random_uuid(),'00000000-0000-4000-8000-000000000001','security_track',1,'practice','grammar_rush',1,1,5,5,now()+interval '3 minutes'),
 ('00000000-0000-4000-9000-000000000002',gen_random_uuid(),'00000000-0000-4000-8000-000000000002','security_track',1,'practice','grammar_rush',1,1,5,5,now()+interval '3 minutes');
insert into public.challenge_submissions(run_id,user_id,client_submission_id,question_position,response,is_correct,heart_cost)
 select id,user_id,gen_random_uuid(),1,'{"optionId":"works"}',true,0
 from public.challenge_runs where track_id='security_track';

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
do $$
begin
 if (select count(*) from public.profiles) <> 1 then raise exception 'Profile isolation failed'; end if;
 if (select count(*) from public.attempts) <> 1 then raise exception 'Attempt isolation failed'; end if;
 if (select count(*) from public.skill_mastery) <> 1 then raise exception 'Mastery isolation failed'; end if;
 if (select count(*) from public.review_queue) <> 1 then raise exception 'Review isolation failed'; end if;
 if (select count(*) from public.xp_events) <> 1 then raise exception 'XP isolation failed'; end if;
 if (select count(*) from public.lesson_completions) <> 1 then raise exception 'Completion isolation failed'; end if;
 if (select count(*) from public.challenge_runs) <> 1 then raise exception 'Run isolation failed'; end if;
 if (select count(*) from public.challenge_submissions) <> 1 then raise exception 'Submission isolation failed'; end if;
 if (select count(*) from public.lessons where id like 'security_%') <> 1 then raise exception 'Published-parent lesson filter failed'; end if;
 if (select count(*) from public.exercises where id like 'security_%') <> 1 then raise exception 'Published-parent exercise filter failed'; end if;
 if (select count(*) from public.challenge_tracks where id like 'security_%') <> 1 then raise exception 'Published-parent track filter failed'; end if;
 if has_table_privilege(current_user,'public.attempts','INSERT') then raise exception 'Clients can insert attempts'; end if;
 if has_table_privilege(current_user,'public.challenge_runs','UPDATE') then raise exception 'Clients can edit runs'; end if;
 if has_table_privilege(current_user,'public.challenge_questions','SELECT') then raise exception 'Clients can read question bank'; end if;
 if has_schema_privilege(current_user,'private','USAGE') then raise exception 'Private schema exposed'; end if;
 update public.profiles set target_minutes=15 where id=auth.uid();
 begin
  update public.profiles set current_cefr='A2' where id=auth.uid();
  raise exception 'Client edited server-owned profile columns';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.xp_events(user_id,xp,reason) values(auth.uid(),500,'forged');
  raise exception 'Client forged XP';
 exception when insufficient_privilege then null;
 end;
 begin
  perform * from private.exercise_keys;
  raise exception 'Client read answer keys';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
do $$
begin
 if exists(select 1 from public.profiles where id='00000000-0000-4000-8000-000000000001') then raise exception 'User B sees A'; end if;
 if (select target_minutes from public.profiles where id=auth.uid()) <> 10 then raise exception 'User A changed B profile'; end if;
end $$;
reset role;

do $$
begin
 begin
  insert into public.challenge_submissions(run_id,user_id,client_submission_id,question_position,response,is_correct,heart_cost)
   values('00000000-0000-4000-9000-000000000001','00000000-0000-4000-8000-000000000002',gen_random_uuid(),2,'{}',true,0);
  raise exception 'Backend can create cross-user run submission';
 exception when foreign_key_violation then null;
 end;
 begin
  update private.exercise_keys set answer_rule='{"optionId":"is"}' where exercise_id='security_exercise';
  raise exception 'Exercise key version mutated';
 exception when check_violation then null;
 end;
 begin
  update private.challenge_answer_keys set answer_rule='{"optionId":"work"}' where question_id='security_question';
  raise exception 'Challenge key version mutated';
 exception when check_violation then null;
 end;
end $$;

set local role service_role;
update private.exercise_keys set content_version=2,answer_rule='{"optionId":"are"}' where exercise_id='security_exercise';
do $$
begin
 if (select count(*) from private.exercise_key_versions where exercise_id='security_exercise') <> 2 then raise exception 'Historical key missing'; end if;
 if (select answer_rule from private.exercise_key_versions where exercise_id='security_exercise' and content_version=1) <> '{"optionId":"am"}'::jsonb then raise exception 'Historical answer changed'; end if;
 if not has_table_privilege(current_user,'public.attempts','INSERT') then raise exception 'Backend grant missing'; end if;
 if has_table_privilege(current_user,'private.exercise_key_versions','UPDATE') then raise exception 'Backend may edit archive'; end if;
end $$;
reset role;

set local role anon;
do $$
begin
 begin
  perform * from public.profiles;
  raise exception 'Anonymous read personal data';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;

rollback;
select 'PASS: RLS isolation, private keys, publication filters, backend grants, immutable answer versions' as result;
