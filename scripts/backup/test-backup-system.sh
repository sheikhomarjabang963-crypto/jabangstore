#!/usr/bin/env bash
# Tests the backup system end to end against a TEST database (never the live one).
# Usage: TEST_SOURCE_DB_URL=... TEST_RESTORE_DB_URL=... bash scripts/backup/test-backup-system.sh
# TEST_RESTORE_DB_URL must be an empty database. Source must be a copy with the JabangStore schema.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
source "$here/lib.sh"
require_env TEST_SOURCE_DB_URL TEST_RESTORE_DB_URL
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
pass=0; fail=0
ok()   { echo "  PASS: $1"; pass=$((pass+1)); }
bad()  { echo "  FAIL: $1"; fail=$((fail+1)); }
export BACKUP_PASSPHRASE="test-passphrase-$(date +%s)-not-a-real-secret"

echo "0. Client and server versions are compatible"
client_can_serve 17 17 && client_can_serve 18 17 && ok "client 17 serves server 17" || bad "matching versions rejected"
! client_can_serve 16 17 && ok "client 16 is refused for a 17 server" || bad "client 16 accepted for a 17 server"
client_can_serve 17 16 && ok "newer client serves an older server" || bad "newer client refused"

echo "1. Create a backup from the test source"
SUPABASE_BACKUP_DB_URL="$TEST_SOURCE_DB_URL" BACKUP_OUT_DIR="$work/out" bash "$here/nightly-backup.sh" >"$work/b.log" 2>&1 \
  && ok "backup runs" || { bad "backup failed"; cat "$work/b.log"; }
enc="$(ls "$work"/out/*.dump.enc)"; man="$(ls "$work"/out/*.manifest.json)"
grep -q "$BACKUP_PASSPHRASE" "$work/b.log" "$man" && bad "passphrase leaked into logs or manifest" || ok "no secret in logs or manifest"
python3 -c "import json,sys;d=json.load(open(sys.argv[1]));assert d['row_counts'].get('public.sales') is not None" "$man" \
  && ok "manifest lists row counts for business tables" || bad "manifest missing row counts"
! grep -q "CREATE TABLE" "$enc" && ok "backup file is encrypted (no readable SQL)" || bad "backup file is readable"

echo "2. Verify: checksums, decryption and archive"
BACKUP_PASSPHRASE="$BACKUP_PASSPHRASE" bash "$here/verify-backup.sh" "$enc" "$man" >"$work/v1.log" 2>&1 \
  && ok "verification passes on a good backup" || { bad "verification failed on good backup"; cat "$work/v1.log"; }

echo "3. Full restore into an empty database, row counts compared with the manifest"
BACKUP_PASSPHRASE="$BACKUP_PASSPHRASE" RESTORE_TEST_DB_URL="$TEST_RESTORE_DB_URL" SUPABASE_BACKUP_DB_URL="$TEST_SOURCE_DB_URL" \
  bash "$here/verify-backup.sh" "$enc" "$man" >"$work/v2.log" 2>&1 \
  && ok "restore test passes and every row count matches" || { bad "restore test failed"; cat "$work/v2.log"; }

echo "4. Failure cases must be caught"
wrong="$work/wrong.log"
BACKUP_PASSPHRASE="not-the-right-passphrase" bash "$here/verify-backup.sh" "$enc" "$man" >"$wrong" 2>&1 \
  && bad "wrong passphrase was accepted" || ok "wrong passphrase is rejected"
tampered="$work/tampered.dump.enc"; cp "$enc" "$tampered"
printf 'X' | dd of="$tampered" bs=1 seek=200 conv=notrunc 2>/dev/null
BACKUP_PASSPHRASE="$BACKUP_PASSPHRASE" bash "$here/verify-backup.sh" "$tampered" "$man" >/dev/null 2>&1 \
  && bad "tampered backup was accepted" || ok "a damaged backup file is rejected"
manifest_bad="$work/manifest_bad.json"
python3 -c "import json,sys;d=json.load(open(sys.argv[1]));d['row_counts']['public.sales']+=1;json.dump(d,open(sys.argv[2],'w'))" "$man" "$manifest_bad"
BACKUP_PASSPHRASE="$BACKUP_PASSPHRASE" RESTORE_TEST_DB_URL="$TEST_RESTORE_DB_URL" SUPABASE_BACKUP_DB_URL="$TEST_SOURCE_DB_URL" \
  bash "$here/verify-backup.sh" "$enc" "$manifest_bad" >/dev/null 2>&1 \
  && bad "a wrong row count in the manifest was not caught" || ok "a row-count mismatch is caught"

echo "5. Restore guards"
BACKUP_PASSPHRASE="$BACKUP_PASSPHRASE" TARGET_DB_URL="$TEST_RESTORE_DB_URL" bash "$here/restore.sh" "$enc" "$man" >/dev/null 2>&1 \
  && bad "restore ran without confirmation" || ok "restore refuses without RESTORE_CONFIRM"
BACKUP_PASSPHRASE="$BACKUP_PASSPHRASE" TARGET_DB_URL="$TEST_SOURCE_DB_URL" SUPABASE_BACKUP_DB_URL="$TEST_SOURCE_DB_URL" RESTORE_CONFIRM=I_UNDERSTAND_THIS_REPLACES_DATA \
  bash "$here/restore.sh" "$enc" "$man" >/dev/null 2>&1 \
  && bad "restore ran into the live database" || ok "restore refuses the live database"

echo
echo "Result: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
