-- Profili (vzdevek, anonimnost), zgodovina in skupine prijateljev za »Do vrha?«
-- Zaženi enkrat v Supabase: Dashboard › SQL Editor › New query › prilepi vse › Run.
-- Lahko ga zaženeš večkrat – obstoječih podatkov ne briše.

-- ============ PROFILI ============
-- Vsak igralec (tudi anonimen) ima lahko vzdevek. Če je »anonimen«, ga drugi na javni lestvici ne vidijo.

create table if not exists profili (
  uid        uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  vzdevek    text check (vzdevek is null or (char_length(btrim(vzdevek)) between 2 and 20 and vzdevek !~ '[<>"\\/]')),
  anonimen   boolean not null default false,
  ustvarjeno timestamptz not null default now()
);
create unique index if not exists profili_vzdevek on profili (lower(btrim(vzdevek)));
alter table profili enable row level security;

drop policy if exists "svoj profil - branje" on profili;
drop policy if exists "svoj profil - vpis" on profili;
drop policy if exists "svoj profil - posodobitev" on profili;
create policy "svoj profil - branje" on profili for select to authenticated using (uid = auth.uid());
create policy "svoj profil - vpis" on profili for insert to authenticated with check (uid = auth.uid());
create policy "svoj profil - posodobitev" on profili for update to authenticated using (uid = auth.uid()) with check (uid = auth.uid());

-- javna imena za lestvice: samo tisti, ki niso anonimni
create or replace view imena as
  select uid, btrim(vzdevek) as vzdevek from profili where not anonimen and vzdevek is not null;
grant select on imena to anon, authenticated;

-- ============ ZGODOVINA ============
-- vse moje končane igre z mestom na dnevni lestvici
create or replace function moja_zgodovina()
returns table (datum date, vm integer, mesto bigint, igralcev bigint)
language sql stable set search_path = public as $$
  select i.datum, i.vm,
         (select count(*) from igre j where j.datum = i.datum and j.koncano and j.vm > i.vm) + 1,
         (select count(*) from igre j where j.datum = i.datum and j.koncano)
  from igre i
  where i.uid = auth.uid() and i.koncano
  order by i.datum desc
  limit 400;
$$;
grant execute on function moja_zgodovina() to authenticated;

-- ============ SKUPINE PRIJATELJEV ============
-- Skupino ustvariš z imenom, dobiš kodo (npr. 4F9A2C), prijatelji se pridružijo s kodo.
-- Člani skupine vidijo vzdevke drug drugega tudi, če so na javni lestvici anonimni.

create table if not exists skupine (
  id         uuid primary key default gen_random_uuid(),
  ime        text not null check (char_length(btrim(ime)) between 2 and 30),
  koda       text not null unique,
  ustvaril   uuid not null default auth.uid(),
  ustvarjeno timestamptz not null default now()
);
create table if not exists clani (
  skupina_id uuid not null references skupine(id) on delete cascade,
  uid        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pridruzen  timestamptz not null default now(),
  primary key (skupina_id, uid)
);
alter table skupine enable row level security;
alter table clani   enable row level security;

create or replace function moje_skupine_id() returns setof uuid
language sql stable security definer set search_path = public as $$
  select skupina_id from clani where uid = auth.uid();
$$;

drop policy if exists "moje skupine" on skupine;
drop policy if exists "clani mojih skupin" on clani;
drop policy if exists "izstop iz skupine" on clani;
create policy "moje skupine" on skupine for select to authenticated using (id in (select moje_skupine_id()));
create policy "clani mojih skupin" on clani for select to authenticated using (skupina_id in (select moje_skupine_id()));
create policy "izstop iz skupine" on clani for delete to authenticated using (uid = auth.uid());

create or replace function ustvari_skupino(p_ime text) returns skupine
language plpgsql security definer set search_path = public as $$
declare s skupine; k text;
begin
  if auth.uid() is null then raise exception 'Ni prijave'; end if;
  if (select count(*) from clani where uid = auth.uid()) >= 20 then raise exception 'Si že v 20 skupinah'; end if;
  loop
    k := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from skupine where koda = k);
  end loop;
  insert into skupine (ime, koda, ustvaril) values (btrim(p_ime), k, auth.uid()) returning * into s;
  insert into clani (skupina_id, uid) values (s.id, auth.uid());
  return s;
end $$;

create or replace function pridruzi_se(p_koda text) returns skupine
language plpgsql security definer set search_path = public as $$
declare s skupine;
begin
  if auth.uid() is null then raise exception 'Ni prijave'; end if;
  select * into s from skupine where koda = upper(btrim(p_koda));
  if not found then raise exception 'Skupina s to kodo ne obstaja'; end if;
  if (select count(*) from clani where skupina_id = s.id) >= 200 then raise exception 'Skupina je polna'; end if;
  insert into clani (skupina_id, uid) values (s.id, auth.uid()) on conflict do nothing;
  return s;
end $$;

-- člani skupine z vzdevki (samo za člane te skupine)
create or replace function clani_skupine(p_skupina uuid)
returns table (uid uuid, vzdevek text)
language sql stable security definer set search_path = public as $$
  select c.uid, btrim(p.vzdevek)
  from clani c left join profili p on p.uid = c.uid
  where c.skupina_id = p_skupina
    and exists (select 1 from clani m where m.skupina_id = p_skupina and m.uid = auth.uid());
$$;

revoke all on function ustvari_skupino(text), pridruzi_se(text), clani_skupine(uuid), moje_skupine_id() from public, anon;
grant execute on function ustvari_skupino(text), pridruzi_se(text), clani_skupine(uuid), moje_skupine_id() to authenticated;
