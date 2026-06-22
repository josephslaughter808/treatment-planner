create table if not exists public.record_requests (
  id uuid primary key default gen_random_uuid(),
  patient_identity_id uuid not null references public.patient_identities(id) on delete cascade,
  requesting_practice_id uuid not null references public.practices(id) on delete cascade,
  requesting_user_id uuid references public.app_users(id) on delete set null,
  requesting_provider_id uuid references public.providers(id) on delete set null,
  source_practice_id uuid references public.practices(id) on delete set null,
  source_organization_name text not null,
  source_department text,
  source_contact_name text,
  source_email text,
  source_phone text,
  source_fax text,
  source_address text,
  purpose_of_use text not null default 'treatment' check (
    purpose_of_use in ('treatment', 'payment', 'operations', 'patient-request', 'care-coordination', 'other')
  ),
  purpose_detail text,
  clinical_reason text not null,
  urgency text not null default 'routine' check (urgency in ('routine', 'urgent')),
  due_at timestamptz,
  expires_at timestamptz not null,
  status text not null default 'draft' check (
    status in (
      'draft',
      'pending-patient-approval',
      'approved',
      'partially-approved',
      'denied',
      'revoked',
      'expired',
      'awaiting-source-organization',
      'source-organization-responded',
      'ready-for-review',
      'reviewed',
      'completed',
      'cancelled'
    )
  ),
  patient_decision text not null default 'pending' check (
    patient_decision in ('pending', 'approved', 'partially-approved', 'denied', 'revoked')
  ),
  patient_decision_at timestamptz,
  patient_decision_note text,
  consent_package_id text,
  clearpath_package_id text references public.clearpath_packages(package_id) on delete set null,
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_at is null or due_at <= expires_at)
);

create table if not exists public.record_request_sections (
  id uuid primary key default gen_random_uuid(),
  record_request_id uuid not null references public.record_requests(id) on delete cascade,
  section_key text not null,
  requested boolean not null default true,
  patient_decision text not null default 'pending' check (patient_decision in ('pending', 'approved', 'denied')),
  request_note text,
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (record_request_id, section_key)
);

create table if not exists public.record_request_events (
  id uuid primary key default gen_random_uuid(),
  record_request_id uuid not null references public.record_requests(id) on delete cascade,
  actor_auth_user_id uuid,
  actor_app_user_id uuid references public.app_users(id) on delete set null,
  actor_role text,
  event_type text not null,
  from_status text,
  to_status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.record_request_documents (
  id uuid primary key default gen_random_uuid(),
  record_request_id uuid not null references public.record_requests(id) on delete cascade,
  uploaded_by_auth_user_id uuid,
  uploaded_by_app_user_id uuid references public.app_users(id) on delete set null,
  section_key text,
  storage_bucket text not null,
  storage_path text not null,
  original_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  checksum_sha256 text,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table if not exists public.record_request_messages (
  id uuid primary key default gen_random_uuid(),
  record_request_id uuid not null references public.record_requests(id) on delete cascade,
  sender_auth_user_id uuid,
  sender_app_user_id uuid references public.app_users(id) on delete set null,
  sender_role text,
  message_body text not null,
  created_at timestamptz not null default now()
);

create index if not exists record_requests_patient_idx
on public.record_requests (patient_identity_id, created_at desc);

create index if not exists record_requests_requesting_practice_status_idx
on public.record_requests (requesting_practice_id, status, created_at desc);

create index if not exists record_requests_source_practice_status_idx
on public.record_requests (source_practice_id, status, created_at desc);

create index if not exists record_request_events_request_idx
on public.record_request_events (record_request_id, created_at);

drop trigger if exists set_record_requests_updated_at on public.record_requests;
create trigger set_record_requests_updated_at before update on public.record_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_record_request_sections_updated_at on public.record_request_sections;
create trigger set_record_request_sections_updated_at before update on public.record_request_sections
for each row execute function public.set_updated_at();

alter table public.record_requests enable row level security;
alter table public.record_request_sections enable row level security;
alter table public.record_request_events enable row level security;
alter table public.record_request_documents enable row level security;
alter table public.record_request_messages enable row level security;

drop policy if exists record_requests_scoped_select on public.record_requests;
create policy record_requests_scoped_select on public.record_requests
for select using (
  patient_identity_id = public.current_patient_identity_id()
  or requesting_practice_id = public.current_provider_practice_id()
  or source_practice_id = public.current_provider_practice_id()
);

drop policy if exists record_requests_requesting_practice_insert on public.record_requests;
create policy record_requests_requesting_practice_insert on public.record_requests
for insert with check (
  requesting_practice_id = public.current_provider_practice_id()
);

drop policy if exists record_requests_scoped_update on public.record_requests;
create policy record_requests_scoped_update on public.record_requests
for update using (
  requesting_practice_id = public.current_provider_practice_id()
  or source_practice_id = public.current_provider_practice_id()
) with check (
  requesting_practice_id = public.current_provider_practice_id()
  or source_practice_id = public.current_provider_practice_id()
);

drop policy if exists record_request_sections_scoped_select on public.record_request_sections;
create policy record_request_sections_scoped_select on public.record_request_sections
for select using (
  exists (
    select 1 from public.record_requests request
    where request.id = record_request_sections.record_request_id
      and (
        request.patient_identity_id = public.current_patient_identity_id()
        or request.requesting_practice_id = public.current_provider_practice_id()
        or request.source_practice_id = public.current_provider_practice_id()
      )
  )
);

drop policy if exists record_request_sections_practice_write on public.record_request_sections;
create policy record_request_sections_practice_write on public.record_request_sections
for all using (
  exists (
    select 1 from public.record_requests request
    where request.id = record_request_sections.record_request_id
      and (
        request.requesting_practice_id = public.current_provider_practice_id()
        or request.source_practice_id = public.current_provider_practice_id()
      )
  )
) with check (
  exists (
    select 1 from public.record_requests request
    where request.id = record_request_sections.record_request_id
      and (
        request.requesting_practice_id = public.current_provider_practice_id()
        or request.source_practice_id = public.current_provider_practice_id()
      )
  )
);

drop policy if exists record_request_events_scoped_select on public.record_request_events;
create policy record_request_events_scoped_select on public.record_request_events
for select using (
  exists (
    select 1 from public.record_requests request
    where request.id = record_request_events.record_request_id
      and (
        request.patient_identity_id = public.current_patient_identity_id()
        or request.requesting_practice_id = public.current_provider_practice_id()
        or request.source_practice_id = public.current_provider_practice_id()
      )
  )
);

drop policy if exists record_request_events_scoped_insert on public.record_request_events;
create policy record_request_events_scoped_insert on public.record_request_events
for insert with check (
  exists (
    select 1 from public.record_requests request
    where request.id = record_request_events.record_request_id
      and (
        request.patient_identity_id = public.current_patient_identity_id()
        or request.requesting_practice_id = public.current_provider_practice_id()
        or request.source_practice_id = public.current_provider_practice_id()
      )
  )
);

drop policy if exists record_request_documents_scoped_select on public.record_request_documents;
create policy record_request_documents_scoped_select on public.record_request_documents
for select using (
  exists (
    select 1 from public.record_requests request
    where request.id = record_request_documents.record_request_id
      and (
        request.patient_identity_id = public.current_patient_identity_id()
        or request.requesting_practice_id = public.current_provider_practice_id()
        or request.source_practice_id = public.current_provider_practice_id()
      )
  )
);

drop policy if exists record_request_documents_practice_write on public.record_request_documents;
create policy record_request_documents_practice_write on public.record_request_documents
for all using (
  exists (
    select 1 from public.record_requests request
    where request.id = record_request_documents.record_request_id
      and (
        request.requesting_practice_id = public.current_provider_practice_id()
        or request.source_practice_id = public.current_provider_practice_id()
      )
  )
) with check (
  exists (
    select 1 from public.record_requests request
    where request.id = record_request_documents.record_request_id
      and (
        request.requesting_practice_id = public.current_provider_practice_id()
        or request.source_practice_id = public.current_provider_practice_id()
      )
  )
);

drop policy if exists record_request_messages_scoped_all on public.record_request_messages;
create policy record_request_messages_scoped_all on public.record_request_messages
for all using (
  exists (
    select 1 from public.record_requests request
    where request.id = record_request_messages.record_request_id
      and (
        request.patient_identity_id = public.current_patient_identity_id()
        or request.requesting_practice_id = public.current_provider_practice_id()
        or request.source_practice_id = public.current_provider_practice_id()
      )
  )
) with check (
  exists (
    select 1 from public.record_requests request
    where request.id = record_request_messages.record_request_id
      and (
        request.patient_identity_id = public.current_patient_identity_id()
        or request.requesting_practice_id = public.current_provider_practice_id()
        or request.source_practice_id = public.current_provider_practice_id()
      )
  )
);
