-- Metri in način (Polž … Helikopter) za vsak odgovor posebej, da se rezultat na drugi napravi prikaže enako.
-- Zaženi enkrat v Supabase: SQL Editor › New query › prilepi › Run.
alter table igre add column if not exists podrobnosti jsonb not null default '{}';
