-- AI preverjanje novih odgovorov (Supabase › SQL Editor › Run). Varno za ponovni zagon.
-- Kaj doda:
--   odgovori.vir       'rocno' (iz datotek, npm run baza) ali 'ai' (sprejela funkcija preveri-odgovor)
--   odgovori.potrjeno  false za AI odgovor, dokler ga nočni pregled ne potrdi (vpliva na začetno redkost)
--   ai_presoje         vsak vnos, ki ga je AI že presodil – isti vnos se ne pošlje AI-ju dvakrat
--   ai_sopomenke       sopomenke, ki jih je dodal AI (da jih npm run baza ne izbriše)
--   ai_zacni / ai_zapisi   atomarno: zaklep vnosa, zapis ocene, novega odgovora ali sopomenke
-- Iger se nič od tega ne dotika; redkosti samo prek odgovori.potrjeno.

alter table odgovori add column if not exists vir text not null default 'rocno';
alter table odgovori add column if not exists dodano timestamptz not null default now();
-- Nepotrjen AI odgovor dobi v igri nevtralno začetno redkost (ne najredkejše), dokler ga nočni pregled ne potrdi
-- (npm run ai-odgovori -- --oznaci). Odgovori iz datotek so vedno potrjeni.
alter table odgovori add column if not exists potrjeno boolean not null default true;

create table if not exists ai_presoje (
  vprasanje_id text not null,
  kljuc        text not null,                    -- poenoten vnos (enako kot norm() v igri)
  vnos         text not null,
  stanje       text not null default 'v_teku' check (stanje in ('v_teku','sprejeto','zavrnjeno')),
  odgovor      text,                             -- kanonski odgovor, h kateremu spada (če sprejeto)
  vrsta        text check (vrsta in ('nov','sopomenka')),
  razlog       text,
  uid          uuid,
  ustvarjeno   timestamptz not null default now(),
  posodobljeno timestamptz not null default now(),
  pregledano   boolean not null default false,  -- nočni pregled je presojo že videl
  primary key (vprasanje_id, kljuc)
);
create index if not exists ai_presoje_uid on ai_presoje (uid, ustvarjeno);
create index if not exists ai_presoje_pregled on ai_presoje (pregledano) where not pregledano;

create table if not exists ai_sopomenke (
  vprasanje_id text not null,
  odgovor      text not null,
  sopomenka    text not null,
  ustvarjeno   timestamptz not null default now(),
  primary key (vprasanje_id, odgovor, sopomenka)
);

-- Samo strežniška funkcija (service role) sme brati in pisati; igralci nimajo dostopa.
alter table ai_presoje   enable row level security;
alter table ai_sopomenke enable row level security;

-- Zaklene vnos za presojo. Vrne 'nov' (kličeš AI), 'v_teku' (nekdo drug ga ravno preverja)
-- ali 'koncano' (presoja že obstaja). Zastarel zaklep (> 30 s, npr. padla funkcija) se prevzame.
create or replace function ai_zacni(p_vid text, p_kljuc text, p_vnos text, p_uid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare s text;
begin
  insert into ai_presoje (vprasanje_id, kljuc, vnos, uid) values (p_vid, p_kljuc, p_vnos, p_uid)
  on conflict do nothing;
  if found then return 'nov'; end if;
  update ai_presoje set posodobljeno = now(), uid = p_uid, vnos = p_vnos
   where vprasanje_id = p_vid and kljuc = p_kljuc and stanje = 'v_teku' and posodobljeno < now() - interval '30 seconds';
  if found then return 'nov'; end if;
  select stanje into s from ai_presoje where vprasanje_id = p_vid and kljuc = p_kljuc;
  return case when s = 'v_teku' then 'v_teku' else 'koncano' end;
end $$;

-- Zapiše presojo v eni transakciji. Pri 'nov' doda odgovor (vir 'ai', na konec seznama),
-- pri obeh vrstah doda igralčev zapis kot sopomenko, če se razlikuje od odgovora.
-- Če odgovor s tem zapisom že obstaja, ga ne podvoji (on conflict).
create or replace function ai_zapisi(p_vid text, p_kljuc text, p_stanje text, p_odgovor text,
                                     p_vrsta text, p_sopomenka text, p_razlog text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_stanje = 'sprejeto' then
    if p_vrsta = 'nov' then
      insert into odgovori (vprasanje_id, rang, odgovor, sopomenke, vir, potrjeno)
      values (p_vid, coalesce((select max(rang) from odgovori where vprasanje_id = p_vid), 0) + 1, p_odgovor, '{}', 'ai', false)
      on conflict (vprasanje_id, odgovor) do nothing;
    end if;
    if p_sopomenka is not null and p_sopomenka <> '' then
      insert into ai_sopomenke (vprasanje_id, odgovor, sopomenka) values (p_vid, p_odgovor, p_sopomenka)
      on conflict do nothing;
      update odgovori set sopomenke = array_append(sopomenke, p_sopomenka)
       where vprasanje_id = p_vid and odgovor = p_odgovor and not (p_sopomenka = any(sopomenke));
    end if;
  end if;
  update ai_presoje set stanje = p_stanje, odgovor = p_odgovor, vrsta = p_vrsta, razlog = p_razlog, posodobljeno = now()
   where vprasanje_id = p_vid and kljuc = p_kljuc;
end $$;

-- Ob napaki AI sprosti zaklep, da se vnos lahko preveri pozneje.
create or replace function ai_sprosti(p_vid text, p_kljuc text) returns void
language sql security definer set search_path = public as $$
  delete from ai_presoje where vprasanje_id = p_vid and kljuc = p_kljuc and stanje = 'v_teku';
$$;

revoke all on function ai_zacni(text,text,text,uuid) from public, anon, authenticated;
revoke all on function ai_zapisi(text,text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function ai_sprosti(text,text) from public, anon, authenticated;
grant execute on function ai_zacni(text,text,text,uuid) to service_role;
grant execute on function ai_zapisi(text,text,text,text,text,text,text) to service_role;
grant execute on function ai_sprosti(text,text) to service_role;
