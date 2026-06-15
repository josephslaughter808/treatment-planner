create table if not exists public.clearpath_packages (
  package_id text primary key,
  patient_identity_id uuid not null references public.patient_identities(id) on delete cascade,
  practice_id uuid references public.practices(id) on delete set null,
  created_by_auth_user_id uuid,
  created_by_app_user_id uuid references public.app_users(id) on delete set null,
  package_version text not null,
  package_format text not null default 'clearpath-json',
  output_format text not null default 'clearpath-json',
  purpose_of_use text not null,
  recipient_type text not null,
  recipient_id text,
  recipient_name text,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  checksum_sha256 text not null,
  package_snapshot jsonb not null default '{}'::jsonb,
  translated_snapshot jsonb not null default '{}'::jsonb,
  validation_snapshot jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by_auth_user_id uuid,
  revocation_reason text,
  created_at timestamptz not null default now()
);

alter table public.clearpath_packages enable row level security;

drop policy if exists clearpath_packages_scoped on public.clearpath_packages;
create policy clearpath_packages_scoped on public.clearpath_packages
for select using (
  patient_identity_id = public.current_patient_identity_id()
  or practice_id = public.current_provider_practice_id()
);

drop policy if exists clearpath_packages_patient_insert on public.clearpath_packages;
create policy clearpath_packages_patient_insert on public.clearpath_packages
for insert with check (
  patient_identity_id = public.current_patient_identity_id()
  or practice_id = public.current_provider_practice_id()
);

drop policy if exists clearpath_packages_patient_or_practice_update on public.clearpath_packages;
create policy clearpath_packages_patient_or_practice_update on public.clearpath_packages
for update using (
  patient_identity_id = public.current_patient_identity_id()
  or practice_id = public.current_provider_practice_id()
) with check (
  patient_identity_id = public.current_patient_identity_id()
  or practice_id = public.current_provider_practice_id()
);
