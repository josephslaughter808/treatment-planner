# ClearPath Care

A Next.js app for a first-launch medical check-in workflow. The launch scope is focused on reusable patient medical history, medications, allergies, insurance updates, and office confirmation records.

## First launch scope

- Patient health profile for medical conditions, medications, allergies, and insurance.
- Provider check-in screen for confirming history and insurance before visits.
- Office check-in records tied to practice and patient identity.
- Supabase Auth, database, RLS, and private storage scaffolding.
- Application-level encryption for sensitive patient vault snapshots and office check-in notes.

## Supabase foundation

This repo now includes:

- `.env.example` for required Supabase environment variables
- `supabase/schema.sql` with tables for practices, users, patients, vaults, share links, check-ins, audit logs, and later treatment-planning records
- `app/api/patient-vault/route.ts` for saving patient medical history and insurance profiles
- `app/api/check-ins/route.ts` for saving office check-in confirmations
- `lib/persistence.ts` and `lib/supabase.ts` for server-side persistence helpers
- `lib/field-encryption.ts` for AES-256-GCM field encryption before sensitive snapshots are stored

If Supabase credentials are not configured yet, the app stays usable and returns a clear message instead of crashing.

## Encryption

Set `CLEARPATH_FIELD_ENCRYPTION_KEY` before using this with real patient information. Generate a key with:

```bash
openssl rand -base64 32
```

Store it as:

```bash
CLEARPATH_FIELD_ENCRYPTION_KEY=base64:generated-value
CLEARPATH_REQUIRE_FIELD_ENCRYPTION=true
```

The app encrypts patient vault JSON snapshots and office check-in notes before writing them to Supabase. Existing plaintext development rows still read correctly during migration.

## Next build steps

1. Configure production Supabase Auth and environment variables.
2. Verify RLS policies against real provider and patient accounts.
3. Add a provider-facing check-in queue and patient resend/invite workflow.
4. Add audit log writes for vault reads, vault updates, and office confirmations.
5. Run a small office pilot before re-enabling diagnosis and treatment education flows.

## Run locally

```bash
npm install
npm run dev
```
