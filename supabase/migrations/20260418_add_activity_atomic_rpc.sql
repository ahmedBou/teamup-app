create or replace function public.create_activity_atomic(
  p_host_id uuid,
  p_title text,
  p_description text,
  p_activity_type text,
  p_city text,
  p_start_time timestamptz,
  p_max_participants integer,
  p_circuit_id uuid default null
)
returns public.activities
language plpgsql
security invoker
as $$
declare
  v_activity public.activities;
begin
  insert into public.activities (
    host_id,
    title,
    description,
    activity_type,
    city,
    start_time,
    max_participants,
    circuit_id
  )
  values (
    p_host_id,
    p_title,
    p_description,
    p_activity_type,
    p_city,
    p_start_time,
    p_max_participants,
    p_circuit_id
  )
  returning * into v_activity;

  insert into public.activity_participants (
    activity_id,
    user_id
  )
  values (
    v_activity.id,
    p_host_id
  );

  return v_activity;
end;
$$;

create or replace function public.join_activity_atomic(
  p_activity_id uuid,
  p_user_id uuid
)
returns public.activity_participants
language plpgsql
security invoker
as $$
declare
  v_activity public.activities;
  v_existing public.activity_participants;
  v_participant public.activity_participants;
  v_participant_count integer;
begin
  select *
  into v_activity
  from public.activities
  where id = p_activity_id
  for update;

  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.status = 'cancelled' then
    raise exception 'Ride cancelled';
  end if;

  if v_activity.status = 'completed' then
    raise exception 'Ride completed';
  end if;

  select *
  into v_existing
  from public.activity_participants
  where activity_id = p_activity_id
    and user_id = p_user_id;

  if found then
    return v_existing;
  end if;

  select count(*)
  into v_participant_count
  from public.activity_participants
  where activity_id = p_activity_id;

  if v_activity.status = 'full' or v_participant_count >= v_activity.max_participants then
    raise exception 'Ride is full';
  end if;

  insert into public.activity_participants (
    activity_id,
    user_id
  )
  values (
    p_activity_id,
    p_user_id
  )
  returning * into v_participant;

  v_participant_count := v_participant_count + 1;

  if v_participant_count >= v_activity.max_participants and v_activity.status <> 'full' then
    update public.activities
    set status = 'full'
    where id = p_activity_id;
  end if;

  return v_participant;
end;
$$;
