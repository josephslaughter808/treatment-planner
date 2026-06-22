# ClearPath Current Project Summary And Roadmap

## Purpose

This document is the working source of truth for ClearPath after reviewing the earlier project transcripts and the current repository state.

It is meant to help align:

- Grant planning
- Product direction
- Developer handoff
- Legal and compliance conversations
- Advisor conversations
- Phase I and Phase II planning

ClearPath has evolved through several related product ideas. The current grant-facing direction should combine the strongest parts into one clear product:

ClearPath is a patient-controlled interoffice and interdisciplinary medical communication platform. Providers can request records from other offices or care settings, the patient controls approval, ClearPath generates a consent-scoped JSON record package, and the receiving provider reviews the approved package with a full audit trail.

## Current Product Positioning

ClearPath should not be positioned as:

- A single-specialty application
- A dental application
- A treatment education site
- A patient portal replacement
- A vendor-specific EHR integration
- A generic document upload tool

ClearPath should be positioned as:

A patient-mediated health information exchange layer for providers, offices, and patients who need safer, faster, and more auditable record sharing across disciplines.

The product should support primary care, specialty medicine, surgery, emergency care, behavioral health, rehabilitation, pharmacy, laboratory, imaging, and other care contexts over time. No individual discipline should define the product architecture, navigation, data model, grant narrative, or demonstration.

The first practical use cases should demonstrate communication across disciplines:

- Primary care records requested by a specialist
- Hospital discharge information requested by a rehabilitation provider
- Medication, allergy, and condition history requested before a procedure
- Laboratory or imaging results requested by a treating clinician
- Behavioral health information released with section-level patient control
- Patient-controlled release of older records

The grant narrative should remain discipline-neutral:

ClearPath reduces fragmented care by letting providers request and receive patient-approved information across offices, disciplines, and systems.

## Core Product Thesis

Healthcare communication is fragmented because records live in separate systems, offices use different software, and patients often become the messenger between providers.

ClearPath solves this by making the patient the permission center.

The core workflow is:

1. A provider or office needs outside records.
2. The provider creates a record request in ClearPath.
3. The patient receives the request.
4. The patient sees who is asking, what they want, and why.
5. The patient approves, limits, denies, or later revokes access.
6. ClearPath creates a consent-scoped package containing only approved data.
7. The requesting provider reviews the approved package.
8. ClearPath logs request, approval, package generation, review, download, and revocation events.

This product model supports both human-readable review and future technical interoperability.

## Internal Data Language

The internal hub language should be ClearPath JSON.

This does not mean ClearPath ignores healthcare standards. It means ClearPath needs one canonical internal representation that can translate into many external formats.

The intended architecture is:

```text
Database records and encrypted snapshots
  -> ClearPath canonical health model
  -> ClearPath JSON package
  -> consent scope
  -> translator adapter
  -> receiving format or workflow
```

Supported and planned output/input formats include:

- ClearPath JSON
- PDF
- CSV
- FHIR JSON
- FHIR Bulk Data / NDJSON
- HL7 v2
- C-CDA / CDA / CCD
- Direct Secure Messaging
- SFTP file drops
- Webhooks and event feeds
- X12 EDI
- NCPDP SCRIPT
- DICOM and DICOM SR
- NEMSIS
- OASIS
- MDS
- QRDA
- IHE XDS.b
- HL7 v3
- FHIR XML/RDF
- OMOP CDM
- openEHR
- SQL / ODBC / JDBC exports
- Proprietary vendor SDKs and flat files

The first working targets should stay practical and vendor-neutral:

- ClearPath JSON
- PDF
- CSV
- Human-readable package review

FHIR, HL7, C-CDA, vendor-specific adapters, and other standards should come after the package pattern is stable.

## Product History From Earlier Work

The project began as a provider-led diagnosis and treatment explainer.

Original concept:

- Provider uploads imaging or enters diagnosis.
- The app explains diagnosis and treatment to the patient.
- AI might help explain what was seen and how it is treated.
- Goal was improved understanding and case acceptance.

The product then shifted:

- Providers should not manually write explanations.
- Providers should only select diagnosis and treatment options.
- Education should be preset, carefully authored, patient-friendly, and reusable.
- Equal treatment options should be presented fairly as equal options.
- Diagnosis pages and treatment pages should be separate because one treatment can apply to many diagnoses.
- Education should include videos, diagrams, carefully worded sections, and optional consent forms.
- Practices should be able to customize default pages and consent forms.

The product then expanded into patient and provider workflows:

- Patient app should be mobile-first.
- Provider app should be desktop-first.
- Provider side should not feel like a mobile app.
- Provider side should focus on patient database, diagnoses, treatment packages, care library, provider management, and practice settings.
- Patient side should hold portable medical profile, emergency card, family/dependent profiles, QR/share code, and approval workflows.

The product then narrowed temporarily for a controlled Phase One pilot:

- Medical history
- Medications
- Allergies
- Emergency contact
- Insurance
- Provider check-in review
- Saved check-in history

The newest strategic direction broadens the app again:

- ClearPath should be a government-grant-ready interoffice medical communication platform.
- Doctors/offices should request older records from other offices.
- Patient approval should control what is released.
- ClearPath JSON should become the hub language.
- Translator adapters should allow input/output to many systems and standards.

## Current Repository State

The current repository is connected to GitHub:

```text
https://github.com/josephslaughter808/treatment-planner.git
```

The local branch is `main` and has been aligned with `origin/main`.

Recent important commits include:

- `dd44fad Add grant planning strategy docs`
- `1a2fe94 Add grant planning budget proposal`
- `1766fc2 Add clearpath packages migration`
- `d6258f6 Complete package schema and persistence foundation`
- `0ec8165 Wire ClearPath package exports`
- `387bcb4 Add day one translator hub architecture`
- `9f30e0b Add ClearPath translation roadmap`
- `0f9cb5c Add software exchange research matrix`
- `1dee451 Add grant readiness data model specs`

Known local note:

- `design-examples/` is still untracked and has intentionally not been committed.

## Current App Capabilities

Current codebase includes:

- Next.js app
- Patient-facing surfaces
- Provider-facing surfaces
- Login/signup flow
- Patient vault/profile flow
- Share/QR/access code concepts
- Provider check-in pages
- Provider patient database view
- Diagnosis and treatment page/library components
- Integration hub prototype
- Supabase schema and migration files
- ClearPath package builder
- Translator adapters
- Package API
- Grant and architecture documentation

Important files and areas:

- `lib/clearpath-package.ts`
- `lib/translators/`
- `app/api/packages/route.ts`
- `components/patient-share-view.tsx`
- `components/provider-patient-database-view.tsx`
- `components/intake-checkin-view.tsx`
- `lib/patient-vault.ts`
- `lib/persistence.ts`
- `lib/field-encryption.ts`
- `lib/software-sync.ts`
- `supabase/schema.sql`
- `supabase/migrations/20260615000100_add_clearpath_packages.sql`
- `docs/grant-planning/`
- `docs/grant-readiness/`
- `docs/hub-architecture/`

## Current Technical Foundation

### ClearPath Package

The app has a versioned `ClearPathPackage` model.

It includes:

- Package ID
- Package version
- Format
- Generated timestamp
- Person/patient identity
- Consent scope
- Clinical sections
- Provenance/source fields
- Validation
- Translator result contract

Current package version:

```text
1.0.0
```

### Translators

Initial translator adapters exist for:

- CSV export
- PDF-source text
- Open Dental reviewed-import preview

The Open Dental adapter is a legacy prototype artifact. It is not part of the current product focus or Phase I success criteria. None of the current adapters perform direct EHR writes.

The first integration principle is:

Reviewed import first, direct write later.

### Package API

The app has a protected `/api/packages` route that can:

- Generate ClearPath JSON from patient vault data
- Validate generated packages
- Return ClearPath JSON
- Return CSV
- Return PDF-source text
- Return the legacy Open Dental preview while that adapter remains in the repository
- Create checksums
- Store package records
- Support package revocation

### Supabase Package Table

The migration creates a `clearpath_packages` table with fields for:

- Package ID
- Patient identity
- Practice ID
- Creator
- Package version
- Package format
- Output format
- Purpose of use
- Recipient information
- Status
- SHA-256 checksum
- Package snapshot
- Translated snapshot
- Validation snapshot
- Expiration
- Revocation
- Created timestamp

Row-level security is enabled and scoped to patient or practice access.

### Security Foundation

Earlier work added or planned:

- Auth-aware API protection
- Supabase Auth token handling
- Server-side signed file access route
- Audit logging helper
- Row-level security direction
- AES-256-GCM field encryption for sensitive vault/check-in data
- Private file access direction

Important limitation:

This is not yet a full HIPAA-ready production system. It is a strong prototype/security foundation.

## Current Documentation Foundation

Grant planning docs:

- `docs/grant-planning/phase-one-budget-proposal.md`
- `docs/grant-planning/phase-one-scope-and-milestones.md`
- `docs/grant-planning/phase-two-roadmap.md`
- `docs/grant-planning/staffing-plan.md`
- `docs/grant-planning/grant-manager-questions.md`
- `docs/grant-planning/compliance-and-security-roadmap.md`
- `docs/grant-planning/pilot-and-user-discovery-plan.md`
- `docs/grant-planning/commercialization-plan.md`

Grant readiness docs:

- `docs/grant-readiness/canonical-health-record-model.md`
- `docs/grant-readiness/consent-package-spec.md`
- `docs/grant-readiness/patient-health-information-software-map.md`
- `docs/grant-readiness/patient-health-information-software-exchange-matrix.md`

Hub architecture docs:

- `docs/hub-architecture/day-one-translator-architecture.md`
- `docs/hub-architecture/clearpath-package.schema.json`
- `docs/hub-architecture/sample-clearpath-package.json`
- `docs/hub-architecture/package-api-smoke-tests.md`

## Grant-Facing Product Description

ClearPath is a patient-controlled health communication and record exchange platform for interoffice and interdisciplinary care.

It allows providers to request patient records from another office or care setting, routes the request through patient approval, creates a consent-scoped record package, and gives the receiving provider a reviewed and auditable package.

The system uses a canonical ClearPath JSON package internally, allowing future translators to support FHIR, HL7, C-CDA, PDF, CSV, and other formats without rebuilding the product for every system.

## Grant Program Fit

Best likely grant paths:

1. AHRQ Digital Healthcare Research
2. AHRQ Digital Healthcare Safety / health services research
3. NIH/NLM SBIR Phase I
4. NIH/NIBIB SBIR Phase I
5. HRSA/rural health or underserved care grants if the proposal is targeted to rural clinics, FQHCs, or small offices

The best language for grant conversations:

ClearPath is a patient-controlled interoffice health information exchange prototype that improves care coordination, consent clarity, provider communication, and auditability for small and interdisciplinary care settings.

The project should not be pitched as:

- A dental app
- An AI diagnosis app
- A replacement EHR
- A direct-write integration tool

## Phase I Budget Summary

Current proposed Phase I budget:

| Category | Budget |
| --- | ---: |
| Founder / PI salary plus fringe and payroll burden | $80,000 |
| Lead developer / technical lead | $130,000 |
| HIPAA and privacy legal consult | $10,000 |
| Security architecture review | $7,500 |
| Clinical and interoperability advisor | $12,500 |
| UX and workflow research | $12,500 |
| Cloud, development tools, and prototype infrastructure | $10,000 |
| Grant administration, accounting, payroll, and insurance | $10,000 |
| Pilot/demo/user discovery expenses | $7,500 |
| Indirect and operating reserve | $20,000 |
| **Total** | **$300,000** |

The $80,000 founder/PI salary is feasible if justified as project labor:

- Grant execution
- Workflow design
- Provider/patient discovery
- Advisor coordination
- Acceptance testing
- Reporting
- Phase II planning

## Phase I Boundary

Phase I should not try to build the whole company.

Phase I should prove:

- The workflow is useful.
- The technical pattern works.
- Patient-mediated consent is understandable.
- ClearPath JSON can package approved data.
- Providers can review the package.
- Audit logging can track key actions.
- There is a credible path to Phase II pilots and commercialization.

Phase I should use:

- Synthetic data
- De-identified examples
- Prototype users
- Usability interviews
- Security architecture review
- HIPAA workflow/legal consult

Phase I should avoid unless required:

- Real PHI pilot
- Full penetration test
- Full SOC 2/HITRUST readiness
- Direct EHR writes
- Broad production launch
- Enterprise integration contracts

## Phase II Boundary

Phase II should fund:

- Production hardening
- Real PHI readiness
- Formal HIPAA security risk analysis
- BAAs and privacy/security policies
- Third-party penetration test
- Controlled pilot deployments
- Multi-office request/response workflow
- Source office response workflow
- FHIR/C-CDA/HL7 translator work
- Real interoperability pilots
- Commercialization preparation

## Main Product Work Remaining

### 1. Product Direction Lock

Create a single source-of-truth product direction doc for:

- Interoffice record requests
- Patient approvals
- Consent-scoped packages
- Provider review
- Source office response
- Audit trail
- Translator roadmap
- Grant narrative

This document should guide developers and grant reviewers.

### 2. Record Request Data Model

Add first-class request tables:

- `record_requests`
- `record_request_sections`
- `record_request_events`
- `record_request_documents`
- `record_request_messages`

Required request fields:

- Request ID
- Patient ID
- Requesting practice ID
- Requesting provider/user ID
- Source office or source organization
- Requested sections
- Purpose of use
- Reason/note
- Urgency
- Due date
- Expiration
- Status
- Patient decision
- Consent package ID
- Created timestamp
- Updated timestamp

Suggested statuses:

- `draft`
- `pending_patient_approval`
- `approved`
- `partially_approved`
- `denied`
- `revoked`
- `expired`
- `awaiting_source_office`
- `source_office_responded`
- `ready_for_review`
- `reviewed`
- `completed`

### 3. Provider Request Flow

Build a provider-facing workflow to:

- Select patient
- Create record request
- Choose requested sections
- Add reason for request
- Select source office or enter external office details
- Set urgency/due date
- Send request for patient approval
- Track request status

Requested sections should include:

- Demographics
- Conditions/problems
- Medications
- Allergies
- Surgeries/hospitalizations
- Labs
- Imaging reports
- Treatment notes
- Provider notes
- Clearance letters
- Insurance
- Emergency contact
- Care team
- Accessibility needs
- Documents

### 4. Patient Approval Flow

Build patient-facing approvals page:

- Pending requests
- Requesting provider/office
- Source office or requested context
- Reason for request
- Requested sections
- Expiration
- Plain-language consent explanation
- Approve all
- Approve selected sections
- Deny
- Revoke after approval
- Approval history

Patient approval should generate or activate a consent package.

### 5. Provider Inbox/Outbox

Build provider request dashboard:

- Sent requests
- Pending patient approval
- Approved requests
- Denied requests
- Expired requests
- Awaiting source office
- Ready for review
- Completed requests

The inbox/outbox should become the operational center for interoffice communication.

### 6. Source Office Response Workflow

This can start as a simulated/prototype workflow in Phase I.

Source office should eventually be able to:

- View approved request
- Upload documents
- Add structured summary
- Attach PDF/image/lab/imaging report
- Mark no record available
- Mark request complete

For Phase I, source office response can use synthetic documents and controlled demo data.

### 7. Package Review Flow

Approved requests should generate a package:

- ClearPath JSON
- Human-readable summary
- PDF export
- CSV export where appropriate

Provider should be able to:

- Review package
- See what patient approved
- See provenance/source
- Download/export package
- Mark reviewed

### 8. Import Review Queue

Future work should include:

- Upload ClearPath JSON
- Upload CSV
- Upload PDF/document
- Parse what can be parsed
- Put imported data into a review queue
- Let patient/provider accept or reject each item
- Never silently overwrite existing profile data
- Record provenance on accepted items

### 9. Audit Trail Expansion

Audit events should include:

- Request created
- Request edited
- Request sent
- Patient viewed request
- Patient approved all
- Patient approved selected sections
- Patient denied
- Patient revoked
- Package generated
- Package viewed
- Package downloaded
- Source office viewed request
- Source office uploaded document
- Source office completed request
- Provider marked package reviewed
- Request expired

Audit metadata should include:

- Actor ID
- Actor role
- Practice ID
- Patient ID
- Request ID
- Package ID
- Action
- Timestamp
- Non-sensitive context

### 10. Grant Demo Flow

The first grant demo should show:

1. Provider logs in.
2. Provider opens a patient.
3. Provider requests older records from another office.
4. Patient receives request.
5. Patient approves only selected sections.
6. ClearPath generates consent-scoped JSON.
7. Provider sees human-readable package.
8. Provider downloads a human-readable PDF or structured data export.
9. Audit trail shows every step.

Suggested demo story:

A neurology practice requests prior diagnoses, medication history, allergies, imaging reports, and recent laboratory results from a patient's primary care office. The patient approves the relevant sections but withholds an unrelated sensitive section. ClearPath creates the consent-scoped package, records the decision, and makes the approved information available for clinical review.

## Design Direction

The old transcript confirms several design preferences.

Patient-facing education pages:

- Mobile-first
- No heavy card formatting
- Editorial/travel-page feel
- Beautiful but educational
- Warm cream backgrounds
- Teal/blue-green accents
- Large media areas
- Separate diagnosis and treatment pages
- Treatment pages reusable across diagnoses

Provider surfaces:

- Desktop-first
- Should feel like an office operations tool
- Should not be optimized for mobile
- If opened on phone, provider workspace can show desktop-only message
- Provider home should be patient database or request dashboard
- Provider should manage patients, care library, providers, settings, and integrations

Current grant product surfaces should prioritize utility over visual flourish:

- Provider request dashboard
- Patient approval page
- Package review page
- Audit history

## Recommended App Navigation

Patient app:

- Health Profile
- Requests / Approvals
- Share
- Family / Dependents
- Documents
- Emergency Card
- Account

Provider app:

- Requests
- Patients
- Packages
- Care Library
- Providers
- Practice Settings
- Integrations

Phase I can simplify this to:

- Provider: Requests, Patients, Packages, Settings
- Patient: Profile, Approvals, Share, Account

## Technical Implementation Plan

### Step 1: Create Product Direction Doc

Add:

```text
docs/grant-planning/interoffice-communication-product-direction.md
```

Content:

- Current positioning
- Core workflow
- Personas
- Phase I boundaries
- Phase II boundaries
- Screens needed
- Technical concepts
- Grant narrative language

### Step 2: Add Record Request Types

Create TypeScript types in a new file:

```text
lib/record-requests.ts
```

Include:

- `RecordRequest`
- `RecordRequestStatus`
- `RecordRequestSection`
- `RecordRequestDecision`
- `RecordRequestEvent`
- `RecordRequestDocument`

### Step 3: Add Database Schema

Update:

```text
supabase/schema.sql
supabase/migrations/
```

Add tables:

- `record_requests`
- `record_request_sections`
- `record_request_events`
- `record_request_documents`
- `record_request_messages`

Add RLS:

- Requesting practice can see requests it created.
- Patient can see requests for their identity.
- Source practice can see requests sent to it after patient approval, if applicable.
- Only authorized actors can update status.

### Step 4: Add Persistence Helpers

Update or add:

```text
lib/persistence.ts
lib/record-request-persistence.ts
```

Functions:

- `createRecordRequest`
- `listProviderRecordRequests`
- `listPatientApprovalRequests`
- `approveRecordRequest`
- `denyRecordRequest`
- `revokeRecordRequest`
- `createRecordRequestEvent`
- `attachRecordRequestDocument`

### Step 5: Add API Routes

Create routes:

```text
app/api/record-requests/route.ts
app/api/record-requests/[requestId]/route.ts
app/api/record-requests/[requestId]/decision/route.ts
app/api/record-requests/[requestId]/package/route.ts
```

Responsibilities:

- Create request
- List requests
- Read request details
- Approve/deny/revoke
- Generate package from approved request

### Step 6: Add Provider UI

Create or update:

```text
components/provider-record-requests-view.tsx
app/requests/page.tsx
```

Features:

- Request dashboard
- Create request modal/page
- Patient selector
- Requested sections checklist
- Purpose and reason fields
- Request status list
- Package review entry point

### Step 7: Add Patient UI

Create or update:

```text
components/patient-approvals-view.tsx
app/approvals/page.tsx
```

Features:

- Pending approvals
- Request details
- Requested section controls
- Plain-language consent summary
- Approve all
- Approve selected
- Deny
- Revoke
- Approval history

### Step 8: Connect Approved Request To Package

Update:

```text
lib/clearpath-package.ts
app/api/packages/route.ts
```

Add support for:

- Building package from record request
- Filtering package sections by approval
- Setting package type to `record-request`
- Linking package to request ID
- Recording recipient and purpose of use

### Step 9: Add Package Review UI

Create or update:

```text
components/provider-package-review-view.tsx
app/packages/[packageId]/page.tsx
```

Features:

- Human-readable summary
- Consent scope
- Included/excluded sections
- Provenance
- Validation
- Download/export buttons
- Review acknowledgement

### Step 10: Add Smoke Tests

Add manual or automated checks for:

- Create request
- Patient approves selected sections
- Package excludes denied sections
- Provider can view approved package
- Provider cannot view denied package
- Audit events are written
- Revoked package cannot be newly accessed

## Suggested 8-Week Build Timeline

This is the realistic near-term build plan for a strong grant prototype.

### Week 1: Product Lock And Schema

Goals:

- Finalize interoffice communication source-of-truth doc.
- Define request statuses and data model.
- Add TypeScript types.
- Add Supabase schema and migration.
- Add initial request persistence helpers.

Deliverables:

- Product direction doc
- Record request schema
- Migration
- TypeScript models
- Basic API skeleton

### Week 2: Provider Request Creation

Goals:

- Build provider request dashboard.
- Build create-request workflow.
- Connect patient selection.
- Add requested section checklist.
- Add status tracking.

Deliverables:

- Provider Requests page
- Create request flow
- Request list/outbox
- Basic audit events

### Week 3: Patient Approvals

Goals:

- Build patient approvals page.
- Show request details.
- Add approve all, approve selected, deny.
- Create consent events.
- Add revocation action if approved.

Deliverables:

- Patient Approvals page
- Approval decision API
- Consent section selection
- Audit events for decisions

### Week 4: Package Generation From Requests

Goals:

- Connect approved requests to ClearPathPackage generation.
- Filter sections by approval.
- Store linked package.
- Show provider package review.

Deliverables:

- Request-linked package generation
- Package review page
- ClearPath JSON package for approved request
- Package validation

### Week 5: Provider Inbox/Outbox And Audit

Goals:

- Polish provider request operations.
- Add status tabs.
- Add audit history view.
- Add review acknowledgement.

Deliverables:

- Request inbox/outbox
- Audit timeline
- Review status
- Better empty/loading/error states

### Week 6: Source Office Prototype And Documents

Goals:

- Add source office response prototype.
- Allow synthetic document upload/attachment.
- Add document package view.

Deliverables:

- Source response workflow
- Attached records/documents
- Source office status
- Document review summary

### Week 7: Demo Flow And Grant Evidence

Goals:

- Create full synthetic demo.
- Prepare screenshots and narrative.
- Confirm package exports.
- Confirm audit trail.

Deliverables:

- End-to-end demo flow
- Demo patient
- Demo provider
- Demo record request
- Demo package
- Grant screenshot list

### Week 8: Hardening And Application Support

Goals:

- Fix demo friction.
- Improve security posture.
- Add smoke tests.
- Update grant docs.
- Prepare developer handoff and Phase II plan.

Deliverables:

- Smoke-test checklist
- Updated grant docs
- Technical handoff
- Phase II backlog
- Risk register

## Phase I Grant Timeline

The build above can create a strong prototype in about 8 weeks.

The full Phase I project should still be planned as 9-12 months because grant work includes more than coding.

Suggested Phase I timeline:

### Month 1

- Finalize grant scope
- Finalize product direction
- Hire lead developer
- Engage HIPAA/privacy legal consult
- Begin record request prototype

### Months 2-3

- Build provider request workflow
- Build patient approval workflow
- Build request-linked package generation
- Build provider package review
- Start stakeholder interviews

### Months 4-5

- Build audit trail views
- Build source office response prototype
- Build package export refinements
- Conduct usability testing
- Iterate consent language

### Months 6-7

- Complete security architecture review
- Complete HIPAA/privacy workflow review
- Tighten prototype
- Add smoke tests and demo data
- Document risks and Phase II requirements

### Months 8-9

- Summarize findings
- Prepare Phase I report
- Prepare Phase II roadmap
- Build commercialization evidence
- Gather letters of support or pilot interest

### Months 10-12, If Award Period Allows

- Deeper prototype hardening
- Additional stakeholder validation
- Grant application refinement
- Phase II budget and staffing plan

## Phase II Timeline

Suggested Phase II period:

18-24 months.

Major Phase II goals:

- Production-ready architecture
- Real PHI readiness
- Formal HIPAA security risk analysis
- BAAs and privacy/security policies
- Third-party penetration test
- Controlled pilot
- Multi-office request and response workflows
- FHIR/C-CDA/HL7 translator prototypes
- Integration research and vendor-specific mapping
- Commercial launch preparation

Suggested Phase II sequence:

### Months 1-3

- Hire expanded technical support
- Complete production architecture plan
- Start HIPAA risk analysis
- Select pilot sites
- Finalize pilot requirements

### Months 4-8

- Build production multi-office request workflow
- Harden access controls
- Add source office response workflow
- Add document exchange
- Add FHIR/PDF/CSV improvements

### Months 9-12

- Complete penetration test
- Remediate findings
- Finalize BAAs and pilot policies
- Train pilot users
- Run synthetic pilot rehearsal

### Months 13-18

- Controlled live pilot
- Monitor request completion time
- Track patient approval rates
- Track staff time saved
- Gather provider/patient feedback

### Months 19-24

- Summarize pilot outcomes
- Finalize pricing
- Prepare sales/customer materials
- Prepare Phase III or commercialization funding path

## Compliance And Security Path

Phase I should use synthetic or de-identified data unless the grant manager, legal counsel, and security reviewer all support using real PHI.

Phase I compliance work:

- HIPAA/privacy legal consult
- Consent workflow review
- BAA template direction
- Security architecture review
- Threat model
- Risk register
- No real PHI in grant materials
- No PHI in screenshots or support notes

Phase II compliance work:

- Formal HIPAA risk analysis
- Full policy set
- BAAs
- Vendor risk management
- Incident response
- Penetration testing
- Monitoring and alerting
- Production data retention/deletion policy

## Risk Register

### Product Risk: Scope Drift

Risk:

ClearPath could become too many products at once: check-in app, treatment education app, EHR integration app, patient portal, and grant platform.

Mitigation:

Use interoffice record request and consent-scoped package exchange as the core. Keep legacy specialty-specific check-in and treatment-education surfaces outside the current scope unless research later establishes a discipline-neutral need for them.

### Technical Risk: Direct EHR Writes Too Early

Risk:

Directly writing into any external EHR or practice-management system too early creates safety, liability, and integration complexity.

Mitigation:

Start with reviewed-import previews, PDF, CSV, and human confirmation.

### Compliance Risk: Real PHI Before Readiness

Risk:

Handling real PHI before legal/security controls are ready could create serious compliance exposure.

Mitigation:

Use synthetic/de-identified data in Phase I. Move real PHI to Phase II after risk analysis, BAAs, and security testing.

### Adoption Risk: Offices Resist New Software

Risk:

Small offices may not want another workflow.

Mitigation:

Focus on painful workflows: missing medical clearance, record chasing, outdated medication lists, and pre-surgical communication.

### Patient Trust Risk: Approval Confusion

Risk:

Patients may not understand what they are approving.

Mitigation:

Use plain-language approval screens, section-level choices, and clear revocation history.

### Integration Risk: Too Many Standards

Risk:

Trying to build FHIR, HL7, C-CDA, X12, DICOM, and vendor integrations at once could stall progress.

Mitigation:

Build ClearPath JSON first, then add translators one at a time.

## Immediate Next Actions

Recommended next work items:

- [x] Establish the interdisciplinary product direction in this source-of-truth roadmap.
- [x] Add the `record_requests` TypeScript model.
- [x] Add the database migration for record requests, sections, events, documents, and messages.
- [x] Draft the NIH Phase I research plan and measurable feasibility aims.
- [ ] Review and apply the record-request migration to the development Supabase project.
- [ ] Build the provider request dashboard and creation form.
- [ ] Build the patient approvals dashboard.
- [ ] Link approved requests to ClearPathPackage generation.
- [ ] Build the provider package review page.
- [ ] Add the audit timeline.
- [ ] Create the synthetic grant demonstration.
- [ ] Prepare the final grant manager call packet.

## Grant Manager Call Packet

Before speaking with the grant manager, prepare:

- One-sentence product description
- Phase I budget
- Phase I scope
- Phase II scope
- Synthetic-data plan
- Security/legal plan
- Questions about PI salary
- Questions about developer costs
- Questions about HIPAA legal review
- Questions about security architecture vs penetration testing
- Questions about whether usability interviews trigger human subjects/IRB requirements

Most important question:

Can Phase I use synthetic or de-identified records and include a HIPAA workflow consult plus security architecture review, with full penetration testing and production HIPAA implementation budgeted for Phase II before handling real PHI?

## One-Sentence Pitch

ClearPath is a patient-controlled interoffice health information exchange platform that lets providers request records, routes approval through the patient, creates a consent-scoped JSON package, and gives providers an auditable way to review and translate approved records across systems.

## Short Grant Pitch

ClearPath addresses fragmented care communication by creating a patient-mediated record request and exchange workflow. A provider can request prior records from another office or care setting, the patient can approve or limit access, and ClearPath generates a consent-scoped JSON package that can be reviewed by the requesting provider and translated into practical formats such as PDF, CSV, FHIR, HL7, C-CDA, or reviewed-import workflows. The Phase I project will validate the technical feasibility and usability of this workflow using synthetic or de-identified data, while preparing security, privacy, and commercialization plans for a Phase II real-world pilot.

## Working Definition Of Success

ClearPath is successful at the end of the next prototype phase if:

- A provider can request records from another office.
- A patient can understand and approve or limit the request.
- ClearPath creates a package containing only approved sections.
- The provider can review the package.
- The system records the approval and access history.
- The workflow can be demonstrated with synthetic data.
- The grant story is clear enough for advisors, developers, and grant reviewers to understand without needing the old chat transcripts.
