#!/usr/bin/env bash
# Verifies one backup: checksums, decryption, archive readability and, when RESTORE_TEST_DB_URL is set, a full restore
# into that database with every table's row count compared to the manifest.
# Usage: verify-backup.sh <backup.dump.enc> <backup.manifest.json>
# Required: BACKUP_PASSPHRASE. Optional: RESTORE_TEST_DB_URL (must be an EMPTY, non-production database).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "$here/lib.sh"

[ $# -eq 2 ] || { echo "Usage: $0 <backup.dump.enc> <backup.manifest.json>" >&2; exit 2; }
require_env BACKUP_PASSPHRASE
enc="$1"; manifest="$2"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

json_field() { python3 -c "import json,sys;print(json.load(open(sys.argv[1]))[sys.argv[2]])" "$manifest" "$1"; }

echo "[1/5] Encrypted file checksum"
[ "$(sha256_of "$enc")" = "$(json_field encrypted_sha256)" ] || { echo "FAIL: encrypted file does not match the manifest" >&2; exit 1; }

echo "[2/5] Decrypting (a wrong passphrase fails here)"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in "$enc" -out "$work/restore.dump" \
  || { echo "FAIL: decryption failed (wrong passphrase or damaged file)" >&2; exit 1; }

echo "[3/5] Decrypted dump checksum"
[ "$(sha256_of "$work/restore.dump")" = "$(json_field dump_sha256)" ] || { echo "FAIL: dump checksum mismatch" >&2; exit 1; }

echo "[4/5] Archive is readable"
pg_restore --list "$work/restore.dump" > "$work/toc.txt" || { echo "FAIL: pg_restore cannot read the archive" >&2; exit 1; }
echo "      $(grep -c ' TABLE DATA ' "$work/toc.txt") tables with data, $(wc -l < "$work/toc.txt") archive entries"

if [ -z "${RESTORE_TEST_DB_URL:-}" ]; then
  echo "[5/5] Restore test skipped (RESTORE_TEST_DB_URL not set)"
  echo "VERIFIED (checksums and archive only): $(basename "$enc")"
  exit 0
fi

echo "[5/5] Full restore into the test database, then row-count comparison"
if [ -n "${SUPABASE_BACKUP_DB_URL:-}" ] && [ "$RESTORE_TEST_DB_URL" = "$SUPABASE_BACKUP_DB_URL" ]; then
  echo "FAIL: the restore test database must not be the live database" >&2; exit 1
fi
# Stub Supabase-only objects that business functions refer to, so the restore can run in plain PostgreSQL.
psql "$RESTORE_TEST_DB_URL" -X -q -v ON_ERROR_STOP=1 -f "$here/restore-stubs.sql" >/dev/null
make_restore_list "$work/restore.dump" "$work/restore.list"
pg_restore --no-owner --no-acl --exit-on-error -L "$work/restore.list" --dbname="$RESTORE_TEST_DB_URL" "$work/restore.dump"

expected="$(python3 -c "import json,sys;print(json.dumps(json.load(open(sys.argv[1]))['row_counts'], sort_keys=True))" "$manifest")"
actual="$(row_counts_json "$RESTORE_TEST_DB_URL" | python3 -c "import json,sys;print(json.dumps(json.load(sys.stdin), sort_keys=True))")"
# Tables created by the stubs are not in the backup: only compare tables that the manifest lists.
mismatch="$(python3 - "$expected" "$actual" <<'PY'
import json, sys
exp, act = json.loads(sys.argv[1]), json.loads(sys.argv[2])
bad = {t: (n, act.get(t)) for t, n in exp.items() if act.get(t) != n}
print(json.dumps(bad))
PY
)"
if [ "$mismatch" != "{}" ]; then
  echo "FAIL: restored row counts differ from the manifest: $mismatch" >&2; exit 1
fi
echo "VERIFIED (restore + row counts): $(basename "$enc") — $(python3 -c "import json,sys;d=json.load(open(sys.argv[1]));print(len(d['row_counts']),'tables,',sum(d['row_counts'].values()),'rows')" "$manifest")"
