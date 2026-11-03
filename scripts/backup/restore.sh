#!/usr/bin/env bash
# Restores one backup into a TARGET database. Refuses the live database, and requires explicit confirmation.
# Usage: restore.sh <backup.dump.enc> <backup.manifest.json>
# Required: BACKUP_PASSPHRASE, TARGET_DB_URL, RESTORE_CONFIRM=I_UNDERSTAND_THIS_REPLACES_DATA
# Safety: TARGET_DB_URL must not equal SUPABASE_BACKUP_DB_URL. Use a NEW, EMPTY Supabase project (its auth and
# storage schemas are already there and are left alone) or a fresh PostgreSQL database.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "$here/lib.sh"

[ $# -eq 2 ] || { echo "Usage: $0 <backup.dump.enc> <backup.manifest.json>" >&2; exit 2; }
require_env BACKUP_PASSPHRASE TARGET_DB_URL
if [ "${RESTORE_CONFIRM:-}" != "I_UNDERSTAND_THIS_REPLACES_DATA" ]; then
  echo "Refusing to restore: set RESTORE_CONFIRM=I_UNDERSTAND_THIS_REPLACES_DATA to continue." >&2; exit 2
fi
if [ -n "${SUPABASE_BACKUP_DB_URL:-}" ] && [ "$TARGET_DB_URL" = "$SUPABASE_BACKUP_DB_URL" ]; then
  echo "Refusing to restore into the live database." >&2; exit 2
fi
enc="$1"; manifest="$2"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# Verify first: a damaged or wrong-passphrase backup must never be restored.
BACKUP_PASSPHRASE="$BACKUP_PASSPHRASE" bash "$here/verify-backup.sh" "$enc" "$manifest" >/dev/null
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in "$enc" -out "$work/restore.dump"
# No --clean: nothing that already exists is dropped. Any existing object makes the restore stop (--exit-on-error).
make_restore_list "$work/restore.dump" "$work/restore.list"
pg_restore --no-owner --no-acl --exit-on-error -L "$work/restore.list" --dbname="$TARGET_DB_URL" "$work/restore.dump"
echo "Restored $(basename "$enc") into $(redact_url "$TARGET_DB_URL"). Check the row counts in $manifest against the new project."

