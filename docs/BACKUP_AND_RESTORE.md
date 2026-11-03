# JabangStore database backup and restore

This documents the nightly backup of the live Supabase database. It protects business data. It does not deploy or change the website.

## What is backed up

Each night a full dump is taken of the database's `public`, `auth` and `storage` schemas, plus any `jabang_backup_*` schemas. The dump includes the **table structure and every record**, including businesses, users and staff memberships, branches and branch assignments, products, inventory and stock movements, sales and sale items, payments, customers, expenses, returns, refunds, audit logs and everything else in those schemas.

Not included, and why:
- **Product and staff photo files** stored in Supabase Storage. The database keeps only their records. The image files live in Supabase's file storage, which this backup does not copy. Download them from the Supabase dashboard (Storage) separately if you need them.
- **Supabase-internal schemas** (realtime, vault, graphql and similar). Supabase manages these itself.
- **Supabase-owned functions** inside `auth` and `storage`. A restore leaves them alone.

## Where backups are stored

- **GitHub Actions artifacts** of this repository, kept **35 days** (the requirement is 30). They are stored outside the Supabase database.
- Each artifact holds three files: the encrypted dump (`*.dump.enc`), a manifest (`*.manifest.json`) with checksums and per-table row counts, and nothing else. The manifest contains no business data.
- Encryption: AES-256, key derived from `BACKUP_PASSPHRASE` with PBKDF2 (600,000 iterations). Without the passphrase, a backup cannot be read.

For a second copy outside GitHub, download the artifact occasionally and keep it in a location you control (for example an encrypted drive). The workflow does not upload to other services.

## Schedule and reporting

- The workflow `.github/workflows/nightly-db-backup.yml` runs every day at **02:30 UTC**, and can be started by hand from the Actions tab.
- It has three jobs: **backup** (dump, encrypt, checksum), **restore-test** (restores the dump into an empty PostgreSQL and compares every table's row count with the manifest), and **report** (writes a summary and fails the run if either job failed).
- If a run fails, GitHub emails the repository's notification recipients. Open the run's summary to see which step failed.

## Setup (one-time, you must do this)

1. **Create the database connection string.** In the Supabase dashboard open the project, click **Connect**, and choose **Session pooler** (the direct connection uses IPv6, which GitHub runners cannot reach). Copy the URI, replace the password placeholder with your database password, and make sure it ends with `?sslmode=require`.
2. **Add the GitHub secrets.** In the repository go to **Settings → Secrets and variables → Actions → New repository secret** and add:
   - `SUPABASE_BACKUP_DB_URL` — the connection string from step 1.
   - `BACKUP_PASSPHRASE` — a long random passphrase (at least 32 characters). Store a copy in your password manager. **If it is lost, the backups cannot be decrypted.**
3. **Make sure Actions is allowed.** Settings → Actions → General → "Allow all actions" (or at least allow the actions used by this workflow).
4. **Run it once by hand:** Actions → "Nightly database backup" → Run workflow. Wait for all three jobs to pass. Until then, the backup is **not** operational.
5. **Confirm the run summary** shows "backup is complete and verified".

Security: the connection string uses the database owner's password, which can read and change everything. Keep it only in GitHub secrets. If it is ever exposed, reset the database password in Supabase and update the secret.

## Verifying a backup by hand

Download the artifact from the run, then (with `BACKUP_PASSPHRASE` set to your passphrase and PostgreSQL 16 client tools installed):

```
bash scripts/backup/verify-backup.sh jabangstore-<stamp>.dump.enc jabangstore-<stamp>.manifest.json
```

This checks the checksums, decrypts, and reads the archive. To also perform a full restore test, set `RESTORE_TEST_DB_URL` to an **empty, non-production** PostgreSQL database first. The script refuses to use the live database for this.

## Restoring

Restore into a **new, empty Supabase project** (never into the live one). Steps:

1. Create a new Supabase project and wait until it is ready.
2. Get its Session pooler connection string as in setup step 1, with the new project's password.
3. Download the artifact and make sure you have the passphrase and the manifest.
4. Run:

```
export BACKUP_PASSPHRASE='...'
export TARGET_DB_URL='postgresql://...new project...?sslmode=require'
export RESTORE_CONFIRM=I_UNDERSTAND_THIS_REPLACES_DATA
bash scripts/backup/restore.sh jabangstore-<stamp>.dump.enc jabangstore-<stamp>.manifest.json
```

The script verifies the backup first, refuses the live database, drops nothing, and stops on the first error. Then compare row counts in the new project against the manifest's `row_counts` (for example `select count(*) from public.sales`). Restore the photo files from your separate copy into the new project's Storage.

Restoring over the live database is not supported by these scripts on purpose. If you ever need that, it is a manual, deliberate operation.

## Retention

Artifacts are deleted automatically after 35 days. A backup is kept for at least 30 days, as required. To keep a backup longer, download it.

## Testing the system

Local test (against a copy of the database, never the live one):

```
TEST_SOURCE_DB_URL='postgresql://...copy...' TEST_RESTORE_DB_URL='postgresql://...empty database...' \
  bash scripts/backup/test-backup-system.sh
```

It checks: the backup runs, no secret appears in logs, the backup is encrypted, verification passes, a full restore matches every row count, a wrong passphrase is rejected, a damaged file is rejected, a wrong manifest count is caught, and restores refuse to run without confirmation or into the live database.

## Status

The scripts and workflow were tested locally against a PostgreSQL 16 copy of the JabangStore database (all checks pass). **The nightly backup is not operational until the two GitHub secrets are added and a run on GitHub has passed.** Until then, treat the database as unbacked up.
