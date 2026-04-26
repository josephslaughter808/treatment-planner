create extension if not exists pgcrypto;

create table if not exists public.practices (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  default_package_source text not null default 'library' check (default_package_source in ('library', 'custom')),
  brand_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  auth_user_id uuid,
  full_name text not null,
  email text,
  role text not null default 'provider',
  created_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  practice_id uuid references public.practices(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'front-desk' check (role in ('admin', 'front-desk', 'provider')),
  title text,
  phone text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patient_identities (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patient_vaults (
  id uuid primary key default gen_random_uuid(),
  patient_identity_id uuid not null unique references public.patient_identities(id) on delete cascade,
  phone text,
  member_id text unique,
  wallet_code text unique,
  insurance_snapshot jsonb not null default '{}'::jsonb,
  conditions_snapshot jsonb not null default '[]'::jsonb,
  medications_snapshot jsonb not null default '[]'::jsonb,
  allergies_snapshot jsonb not null default '[]'::jsonb,
  emergency_contact_snapshot jsonb not null default '{}'::jsonb,
  emergency_disclosure_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.practice_patients (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_identity_id uuid not null references public.patient_identities(id) on delete cascade,
  local_chart_label text,
  created_at timestamptz not null default now(),
  unique (practice_id, patient_identity_id)
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_identity_id uuid references public.patient_identities(id) on delete set null,
  full_name text not null,
  email text,
  date_of_birth date,
  created_at timestamptz not null default now()
);

create unique index if not exists patients_practice_email_idx
on public.patients (practice_id, email);

create table if not exists public.media_assets (
  id text primary key,
  title text not null,
  asset_type text not null,
  description text not null,
  duration text,
  created_at timestamptz not null default now()
);

create table if not exists public.consent_documents (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references public.practices(id) on delete cascade,
  diagnosis_id text not null,
  treatment_option_id text,
  title text not null,
  intro text,
  sections jsonb not null default '[]'::jsonb,
  source text not null default 'library' check (source in ('library', 'custom')),
  version integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.practice_overrides (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  diagnosis_id text not null,
  info_page_title text not null,
  info_page_intro text not null,
  consent_intro text,
  preferred_media_asset_ids jsonb not null default '[]'::jsonb,
  consent_document_id uuid references public.consent_documents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (practice_id, diagnosis_id)
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  provider_label text,
  specialty_id text not null,
  diagnosis_id text not null,
  tooth_label text,
  package_source text not null,
  package_version_id text not null,
  package_snapshot jsonb not null default '{}'::jsonb,
  imaging_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.case_treatment_options (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  treatment_option_id text not null,
  option_group text,
  is_presented_as_equal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.case_access_links (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  patient_identity_id uuid references public.patient_identities(id) on delete set null,
  access_code text not null,
  expires_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.patient_share_links (
  id uuid primary key default gen_random_uuid(),
  patient_identity_id uuid not null references public.patient_identities(id) on delete cascade,
  practice_id uuid references public.practices(id) on delete cascade,
  access_code text not null unique,
  expires_at timestamptz,
  status text not null default 'active' check (status in ('active', 'used', 'revoked', 'expired')),
  created_at timestamptz not null default now()
);

create table if not exists public.office_check_ins (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_identity_id uuid references public.patient_identities(id) on delete set null,
  patient_email text not null,
  member_id text,
  status text not null check (status in ('new-share', 'confirmed-no-changes', 'updated')),
  insurance_confirmed boolean not null default false,
  history_confirmed boolean not null default false,
  medication_confirmed boolean not null default false,
  notes text,
  created_by_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.education_packages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  diagnosis_id text not null,
  treatment_option_ids jsonb not null default '[]'::jsonb,
  package_source text not null,
  practice_override_id uuid references public.practice_overrides(id) on delete set null,
  package_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.case_files (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  original_name text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.consent_signatures (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  consent_document_id uuid references public.consent_documents(id) on delete set null,
  signer_name text not null,
  signer_role text not null default 'patient',
  signed_at timestamptz not null default now(),
  signature_metadata jsonb not null default '{}'::jsonb
);

insert into storage.buckets (id, name, public)
values ('case-files', 'case-files', false)
on conflict (id) do nothing;
