# ClearPath Care Prototype

A Next.js prototype for a provider-controlled treatment education platform where the office selects diagnoses and treatment options, while ClearPath resolves the patient-facing explanation, media, and consent package.

## What this build now supports

- Provider-side selection of practice, specialty, diagnosis, and one or more treatment options
- Preset diagnosis education, treatment comparison cards, videos, diagrams, and consent bundle previews
- Practice-specific override editing for diagnosis info pages and consent intros
- Case persistence scaffolding for patients, cases, selected options, package snapshots, and uploaded files
- Supabase schema and storage model for a real backend

## Supabase foundation

This repo now includes:

- `.env.example` for required Supabase environment variables
- `supabase/schema.sql` with tables for practices, providers, patients, cases, packages, overrides, files, and consents
- `app/api/cases/route.ts` for saving cases and file metadata
- `app/api/practice-overrides/route.ts` for saving office-specific education defaults
- `lib/persistence.ts` and `lib/supabase.ts` for server-side persistence helpers

If Supabase credentials are not configured yet, the app stays usable and returns a clear message instead of crashing.

## Next build steps

1. Add real Supabase auth and tie providers to authenticated users.
2. Replace the in-code starter catalog with database-backed diagnosis, treatment, media, and consent records.
3. Add patient delivery flows, signed consent capture, and package delivery history.
4. Add admin tools for editing videos, diagrams, and versioned office templates.
5. Add stricter medical safety review around any future AI-powered question experience.

## Run locally

```bash
npm install
npm run dev
```
