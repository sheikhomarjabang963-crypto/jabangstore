-- Minimal stand-ins for Supabase-provided objects, so a backup restores into plain PostgreSQL for testing.
-- Not used for a real Supabase restore (a new Supabase project already provides these).
create schema if not exists auth;
create schema if not exists storage;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
end $$;
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select null::text $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
create or replace function auth.email() returns text language sql stable as $$ select null::text $$;
-- Used by storage.objects policies (product photo folders). Same contract as Supabase's helper.
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
  select string_to_array(name, '/') $$;
