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
  clearances_snapshot jsonb not null default '[]'::jsonb,
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

alter table public.practices add column if not exists updated_at timestamptz not null default now();
alter table public.providers add column if not exists updated_at timestamptz not null default now();
alter table public.patients add column if not exists updated_at timestamptz not null default now();
alter table public.practice_patients add column if not exists updated_at timestamptz not null default now();
alter table public.patient_vaults add column if not exists office_connections_snapshot jsonb not null default '[]'::jsonb;
alter table public.practice_overrides add column if not exists design_config jsonb not null default '{}'::jsonb;
alter table public.practice_overrides add column if not exists general_asset_ids jsonb not null default '[]'::jsonb;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_auth_user_id uuid,
  actor_app_user_id uuid references public.app_users(id) on delete set null,
  actor_email text,
  actor_role text,
  practice_id uuid references public.practices(id) on delete set null,
  patient_identity_id uuid references public.patient_identities(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_practices_updated_at on public.practices;
create trigger set_practices_updated_at before update on public.practices
for each row execute function public.set_updated_at();

drop trigger if exists set_providers_updated_at on public.providers;
create trigger set_providers_updated_at before update on public.providers
for each row execute function public.set_updated_at();

drop trigger if exists set_app_users_updated_at on public.app_users;
create trigger set_app_users_updated_at before update on public.app_users
for each row execute function public.set_updated_at();

drop trigger if exists set_patient_identities_updated_at on public.patient_identities;
create trigger set_patient_identities_updated_at before update on public.patient_identities
for each row execute function public.set_updated_at();

drop trigger if exists set_patient_vaults_updated_at on public.patient_vaults;
create trigger set_patient_vaults_updated_at before update on public.patient_vaults
for each row execute function public.set_updated_at();

drop trigger if exists set_patients_updated_at on public.patients;
create trigger set_patients_updated_at before update on public.patients
for each row execute function public.set_updated_at();

drop trigger if exists set_practice_patients_updated_at on public.practice_patients;
create trigger set_practice_patients_updated_at before update on public.practice_patients
for each row execute function public.set_updated_at();

drop trigger if exists set_practice_overrides_updated_at on public.practice_overrides;
create trigger set_practice_overrides_updated_at before update on public.practice_overrides
for each row execute function public.set_updated_at();

create or replace function public.current_practice_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select practice_id from public.app_users where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.app_users where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.current_provider_practice_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select practice_id
  from public.app_users
  where auth_user_id = auth.uid()
    and role in ('admin', 'front-desk', 'provider')
  limit 1
$$;

create or replace function public.current_patient_identity_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.patient_identities
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1
$$;

alter table public.practices enable row level security;
alter table public.providers enable row level security;
alter table public.app_users enable row level security;
alter table public.patient_identities enable row level security;
alter table public.patient_vaults enable row level security;
alter table public.practice_patients enable row level security;
alter table public.patients enable row level security;
alter table public.practice_overrides enable row level security;
alter table public.cases enable row level security;
alter table public.case_treatment_options enable row level security;
alter table public.case_access_links enable row level security;
alter table public.patient_share_links enable row level security;
alter table public.office_check_ins enable row level security;
alter table public.education_packages enable row level security;
alter table public.case_files enable row level security;
alter table public.consent_documents enable row level security;
alter table public.consent_signatures enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists practices_same_practice on public.practices;
create policy practices_same_practice on public.practices
for select using (id = public.current_provider_practice_id());

drop policy if exists providers_same_practice on public.providers;
create policy providers_same_practice on public.providers
for select using (practice_id = public.current_provider_practice_id());

drop policy if exists app_users_same_practice on public.app_users;
create policy app_users_same_practice on public.app_users
for select using (practice_id = public.current_provider_practice_id() or auth_user_id = auth.uid());

drop policy if exists app_users_self_update on public.app_users;
create policy app_users_self_update on public.app_users
for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

drop policy if exists patient_identities_patient_or_practice on public.patient_identities;
create policy patient_identities_patient_or_practice on public.patient_identities
for select using (
  id = public.current_patient_identity_id()
  or exists (
    select 1 from public.practice_patients pp
    where pp.patient_identity_id = patient_identities.id
      and pp.practice_id = public.current_provider_practice_id()
  )
);

drop policy if exists patient_vaults_patient_or_practice on public.patient_vaults;
create policy patient_vaults_patient_or_practice on public.patient_vaults
for select using (
  patient_identity_id = public.current_patient_identity_id()
  or exists (
    select 1 from public.practice_patients pp
    where pp.patient_identity_id = patient_vaults.patient_identity_id
      and pp.practice_id = public.current_provider_practice_id()
  )
);

drop policy if exists patient_vaults_patient_update on public.patient_vaults;
create policy patient_vaults_patient_update on public.patient_vaults
for update using (patient_identity_id = public.current_patient_identity_id())
with check (patient_identity_id = public.current_patient_identity_id());

drop policy if exists practice_patients_same_practice on public.practice_patients;
create policy practice_patients_same_practice on public.practice_patients
for select using (practice_id = public.current_provider_practice_id());

drop policy if exists patients_same_practice on public.patients;
create policy patients_same_practice on public.patients
for select using (practice_id = public.current_provider_practice_id());

drop policy if exists practice_overrides_same_practice on public.practice_overrides;
create policy practice_overrides_same_practice on public.practice_overrides
for select using (practice_id = public.current_provider_practice_id());

drop policy if exists cases_same_practice on public.cases;
create policy cases_same_practice on public.cases
for select using (practice_id = public.current_provider_practice_id());

drop policy if exists case_treatment_options_same_practice on public.case_treatment_options;
create policy case_treatment_options_same_practice on public.case_treatment_options
for select using (
  exists (
    select 1 from public.cases c
    where c.id = case_treatment_options.case_id
      and c.practice_id = public.current_provider_practice_id()
  )
);

drop policy if exists patient_share_links_scoped on public.patient_share_links;
create policy patient_share_links_scoped on public.patient_share_links
for select using (
  patient_identity_id = public.current_patient_identity_id()
  or practice_id = public.current_provider_practice_id()
);

drop policy if exists office_check_ins_scoped on public.office_check_ins;
create policy office_check_ins_scoped on public.office_check_ins
for select using (
  practice_id = public.current_provider_practice_id()
  or patient_identity_id = public.current_patient_identity_id()
);

drop policy if exists education_packages_same_practice on public.education_packages;
create policy education_packages_same_practice on public.education_packages
for select using (
  exists (
    select 1 from public.cases c
    where c.id = education_packages.case_id
      and c.practice_id = public.current_provider_practice_id()
  )
);

drop policy if exists case_files_same_practice on public.case_files;
create policy case_files_same_practice on public.case_files
for select using (
  exists (
    select 1 from public.cases c
    where c.id = case_files.case_id
      and c.practice_id = public.current_provider_practice_id()
  )
);

drop policy if exists consent_documents_scoped on public.consent_documents;
create policy consent_documents_scoped on public.consent_documents
for select using (practice_id is null or practice_id = public.current_provider_practice_id());

drop policy if exists consent_signatures_same_practice on public.consent_signatures;
create policy consent_signatures_same_practice on public.consent_signatures
for select using (
  exists (
    select 1 from public.cases c
    where c.id = consent_signatures.case_id
      and c.practice_id = public.current_provider_practice_id()
  )
);

drop policy if exists audit_logs_same_practice on public.audit_logs;
create policy audit_logs_same_practice on public.audit_logs
for select using (practice_id = public.current_provider_practice_id());

drop policy if exists case_files_private_read on storage.objects;
create policy case_files_private_read on storage.objects
for select using (
  bucket_id = 'case-files'
  and exists (
    select 1
    from public.case_files cf
    join public.cases c on c.id = cf.case_id
    where cf.storage_bucket = storage.objects.bucket_id
      and cf.storage_path = storage.objects.name
      and c.practice_id = public.current_provider_practice_id()
  )
);
