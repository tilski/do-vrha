-- Baza za igro »Do vrha?«
-- Zaženi enkrat v Supabase: Dashboard › SQL Editor › New query › prilepi vse › Run.
-- Lahko jo zaženeš večkrat – obstoječih podatkov ne briše.

-- ============ VPRAŠANJA ============

create table if not exists kategorije (
  id   text primary key,              -- npr. 'kraji-slo'
  ime  text not null                  -- npr. 'Kraji v Sloveniji'
);

create table if not exists vprasanja (
  id            text primary key,     -- npr. 'kraji-slo-mesto'
  kategorija_id text not null references kategorije(id) on update cascade on delete cascade,
  vprasanje     text not null,
  namig         text not null,
  slovenija     boolean not null default false,  -- true = vprašanje o Sloveniji
  odstrani      text[] not null default '{}',    -- besede, ki se odrežejo z začetka/konca odgovora (npr. 'reka')
  vrstni_red    integer not null,                -- določa dnevni izbor; novim vprašanjem daj višjo številko
  aktivno       boolean not null default true    -- false = vprašanje se ne pojavlja v igri
);
create index if not exists vprasanja_red on vprasanja (vrstni_red);

create table if not exists odgovori (
  id           bigint generated always as identity primary key,
  vprasanje_id text not null references vprasanja(id) on update cascade on delete cascade,
  rang         integer not null,                 -- 1 = najpogostejši odgovor; višje = redkejši
  odgovor      text not null,                    -- kako se odgovor prikaže, npr. 'Novo mesto'
  sopomenke    text[] not null default '{}',     -- drugi sprejeti zapisi, npr. {'NM'}
  unique (vprasanje_id, odgovor)
);
create index if not exists odgovori_vprasanje on odgovori (vprasanje_id, rang);

-- ============ ODIGRANE IGRE ============

create table if not exists igre (
  datum        date not null,
  uid          uuid not null default auth.uid(),
  vm           integer not null default 0,       -- pridobljeni višinski metri
  odgovori     jsonb not null default '{}',      -- { "<vprasanje_id>": "<odgovor>" }
  koncano      boolean not null default false,
  posodobljeno timestamptz not null default now(),
  primary key (datum, uid)
);

-- ============ DOVOLJENJA (Row Level Security) ============
-- Vprašanja lahko vsi berejo, spreminjaš jih samo ti (v Dashboardu ali s service_role ključem).
-- Igre lahko vsi berejo (za izračun redkosti odgovorov), vsak igralec pa piše samo svojo.

alter table kategorije enable row level security;
alter table vprasanja  enable row level security;
alter table odgovori   enable row level security;
alter table igre       enable row level security;

drop policy if exists "branje" on kategorije;
drop policy if exists "branje" on vprasanja;
drop policy if exists "branje" on odgovori;
drop policy if exists "branje" on igre;
drop policy if exists "svoja igra - vpis" on igre;
drop policy if exists "svoja igra - posodobitev" on igre;

create policy "branje" on kategorije for select using (true);
create policy "branje" on vprasanja  for select using (true);
create policy "branje" on odgovori   for select using (true);
create policy "branje" on igre       for select using (true);
create policy "svoja igra - vpis" on igre for insert to authenticated with check (uid = auth.uid());
create policy "svoja igra - posodobitev" on igre for update to authenticated using (uid = auth.uid()) with check (uid = auth.uid());

-- ============ ZGREŠENI ODGOVORI ============
-- Vnosi, ki jih igra ni našla na seznamu (in ni predlagala podobnega) – da vidiš, kaj manjka.
-- Igralci lahko samo vpisujejo; bere jih le service_role (npm run zgreseni).

create table if not exists zgreseni (
  id           bigint generated always as identity primary key,
  vprasanje_id text not null,
  vnos         text not null check (char_length(vnos) <= 80),
  datum        date not null default current_date,
  uid          uuid not null default auth.uid(),
  ustvarjeno   timestamptz not null default now()
);
create index if not exists zgreseni_vprasanje on zgreseni (vprasanje_id);
alter table zgreseni enable row level security;
drop policy if exists "zgreseni - vpis" on zgreseni;
create policy "zgreseni - vpis" on zgreseni for insert to authenticated with check (uid = auth.uid());
