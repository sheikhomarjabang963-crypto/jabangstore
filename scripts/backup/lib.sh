#!/usr/bin/env bash
# Shared helpers for the JabangStore database backup. Never prints secrets or full connection strings.
set -euo pipefail

# Schemas that hold business data. Supabase-internal schemas (realtime, vault, graphql, ...) are not backed up:
# they are managed by Supabase and are recreated automatically on a new project.
BACKUP_SCHEMAS=(public auth storage)

redact_url() {
  # Shows host and database only, e.g. db.xxxx.supabase.co/postgres
  echo "$1" | sed -E 's#^[a-z]+://[^@]*@##; s#\?.*$##'
}

# Prints the SQL that counts rows in every table of the backed-up schemas (public, auth, storage and the
# jabang_backup_* schemas created by earlier manual backups).
row_count_sql() {
  local db_url="$1"
  psql "$db_url" -X -A -t -q -v ON_ERROR_STOP=1 -c "
    select coalesce(string_agg(
      format('select %L as table_name, count(*)::bigint as row_count from %I.%I', schemaname || '.' || tablename, schemaname, tablename),
      ' union all ' order by schemaname, tablename), 'select ''none'' as table_name, 0::bigint as row_count')
    from pg_tables
    where schemaname in ('public','auth','storage') or schemaname like 'jabang\_backup\_%';"
}

# Writes a JSON object {table: count, ...} to stdout for the given database.
row_counts_json() {
  local db_url="$1" sql
  sql="$(row_count_sql "$db_url")"
  psql "$db_url" -X -A -t -q -v ON_ERROR_STOP=1 -c "
    select coalesce(json_object_agg(table_name, row_count order by table_name), '{}'::json)
    from ( $sql ) counts;"
}

sha256_of() {
  sha256sum "$1" | awk '{print $1}'
}

require_env() {
  local name
  for name in "$@"; do
    if [ -z "${!name:-}" ]; then
      echo "ERROR: required environment variable $name is not set" >&2
      exit 1
    fi
  done
}

# Writes a restore list (TOC) for a dump to $2, without the CREATE SCHEMA entries for public (created by default in
# every database) and the Supabase-managed auth and storage schemas. Recreating them would fail.
make_restore_list() {
  local dump="$1" out="$2"
  # Functions inside auth and storage belong to Supabase and are skipped too: restoring them would overwrite Supabase's own.
  pg_restore --list "$dump" | grep -v -E ' SCHEMA - (public|auth|storage)( |$)' | grep -v -E ' FUNCTION (auth|storage) ' > "$out"
}

# pg_dump and pg_restore refuse to work with a server newer than themselves. The JabangStore database runs on
# PostgreSQL 17, so the client tools must be version 17 or newer. This pure check is tested on its own.
client_can_serve() {
  # usage: client_can_serve <client_major> <server_major>   (exit 0 when the client is new enough)
  [ "$1" -ge "$2" ]
}

check_client_version() {
  # usage: check_client_version <db_url>. Fails early with a clear message instead of a dump error.
  local db_url="$1" client server
  client="$(pg_dump --version | grep -oE '[0-9]+' | head -1)"
  server="$(psql "$db_url" -X -A -t -q -v ON_ERROR_STOP=1 -c "select current_setting('server_version_num')::int / 10000")"
  if ! client_can_serve "$client" "$server"; then
    echo "ERROR: pg_dump $client cannot back up a PostgreSQL $server database. Install postgresql-client-$server." >&2
    return 1
  fi
  echo "Client check: pg_dump $client, server PostgreSQL $server"
}
