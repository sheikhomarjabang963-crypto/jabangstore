#!/usr/bin/env bash
# Creates one encrypted, complete backup (schema and all records) and its manifest.
# Required environment: SUPABASE_BACKUP_DB_URL, BACKUP_PASSPHRASE.
# Optional: BACKUP_OUT_DIR (default: backups).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "$here/lib.sh"

require_env SUPABASE_BACKUP_DB_URL BACKUP_PASSPHRASE
out_dir="${BACKUP_OUT_DIR:-backups}"
mkdir -p "$out_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
base="jabangstore-$stamp"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

echo "Backup started $stamp from $(redact_url "$SUPABASE_BACKUP_DB_URL")"

schema_args=()
for s in "${BACKUP_SCHEMAS[@]}"; do schema_args+=(--schema="$s"); done
schema_args+=(--schema='jabang_backup_*')

check_client_version "$SUPABASE_BACKUP_DB_URL"

# 1. Full dump: structure and every record, compressed, without owners or access rights.
pg_dump "$SUPABASE_BACKUP_DB_URL" --format=custom --compress=9 --no-owner --no-acl \
  "${schema_args[@]}" --file="$work/$base.dump"
dump_sha="$(sha256_of "$work/$base.dump")"

# 2. Count rows per table, so a restore can be checked against the source.
counts="$(row_counts_json "$SUPABASE_BACKUP_DB_URL")"

# 3. Encrypt (AES-256, PBKDF2 with 600,000 iterations). The plain dump is deleted before the script ends.
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE \
  -in "$work/$base.dump" -out "$out_dir/$base.dump.enc"
enc_sha="$(sha256_of "$out_dir/$base.dump.enc")"

# 4. Manifest: no business data, only checksums, sizes and row counts.
pg_version="$(pg_dump --version | awk '{print $NF}')"
cat > "$out_dir/$base.manifest.json" <<JSON
{
  "backup": "$base",
  "created_utc": "$stamp",
  "source": "$(redact_url "$SUPABASE_BACKUP_DB_URL")",
  "pg_dump_version": "$pg_version",
  "schemas": ["public", "auth", "storage", "jabang_backup_*"],
  "dump_sha256": "$dump_sha",
  "encrypted_file": "$base.dump.enc",
  "encrypted_sha256": "$enc_sha",
  "encrypted_bytes": $(stat -c %s "$out_dir/$base.dump.enc"),
  "row_counts": $counts
}
JSON

echo "Backup written: $out_dir/$base.dump.enc ($(stat -c %s "$out_dir/$base.dump.enc") bytes)"
echo "Manifest: $out_dir/$base.manifest.json"
