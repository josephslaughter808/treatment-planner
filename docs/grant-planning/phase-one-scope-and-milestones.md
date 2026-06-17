# Phase I Scope And Milestones

## Purpose

Phase I should prove that ClearPath can support patient-controlled interoffice and interdisciplinary record exchange without attempting to build the full production company.

The Phase I project should demonstrate the core product thesis:

1. Providers need records from other offices and disciplines.
2. Patients should control release of those records.
3. ClearPath can convert approved information into a consent-scoped JSON package.
4. Providers can review the package in a useful, auditable workflow.

## Phase I Product Scope

Phase I should focus on a working prototype for one primary use case:

A provider requests prior health information, the patient approves or limits the request, and ClearPath generates a structured package that the requesting provider can review.

Included Phase I capabilities:

- Provider creates a record request for a known patient.
- Provider selects requested sections and reason for request.
- Patient sees the request in an approval queue.
- Patient approves all, approves selected sections, denies, or revokes access.
- ClearPath generates a consent-scoped JSON package from approved sections.
- Provider views the approved package.
- ClearPath records audit events for request, approval, package generation, review, download, denial, and revocation.
- Prototype supports synthetic or de-identified records for validation.

Excluded from Phase I unless required by award terms:

- Direct production EHR writes
- Full production HIPAA launch with real PHI
- Full third-party penetration test
- SOC 2 or HITRUST readiness
- Large multi-office production pilot
- Billing, payments, and claims workflows
- Native mobile apps
- Fully automated vendor-specific integrations

## Technical Milestones

### Milestone 1: Product Direction And Requirements

Target window: Month 1

Deliverables:

- Final Phase I product requirements
- Record request workflow map
- Patient approval workflow map
- Consent package section list
- Prototype success criteria
- Synthetic patient record examples

Success criteria:

- A developer can build from the requirements without relying on oral explanation.
- The workflow clearly supports patient-mediated approval.
- The grant narrative can describe the prototype in simple terms.

### Milestone 2: Data Model And Prototype Architecture

Target window: Months 1-2

Deliverables:

- Record request data model
- Consent package data model alignment
- Audit event model
- JSON package schema updates if needed
- Technical architecture notes

Success criteria:

- Request state can move from draft to pending patient review, approved, denied, expired, completed, or revoked.
- Approved sections map cleanly into a ClearPath JSON package.
- Audit events are generated for meaningful actions.

### Milestone 3: Provider Request Flow

Target window: Months 2-4

Deliverables:

- Provider request creation screen
- Patient selection or patient lookup stub
- Requested records checklist
- Purpose of use and request note
- Outgoing request status view

Success criteria:

- A provider can create a request using realistic clinical language.
- The request is understandable to both provider and patient.
- The request status can be tracked.

### Milestone 4: Patient Approval Flow

Target window: Months 3-5

Deliverables:

- Patient approvals page
- Request details screen
- Approve all, approve selected, deny, and revoke actions
- Plain-language consent summary
- Approval confirmation state

Success criteria:

- A patient can understand who is asking, what they want, why they want it, and what will be shared.
- Patient can limit the release by section.
- Consent action creates a durable audit record.

### Milestone 5: Package Generation And Provider Review

Target window: Months 5-7

Deliverables:

- Consent-scoped ClearPath JSON package generation
- Provider package review page
- Human-readable package summary
- Download/export prototype
- Package checksum or integrity marker

Success criteria:

- The package only includes approved sections.
- Provider can review the package without needing to understand JSON.
- JSON remains the internal hub language for future translators.

### Milestone 6: Validation, Security Review, And Phase II Plan

Target window: Months 7-9 or 10-12, depending on award period

Deliverables:

- Stakeholder feedback summary
- Prototype usability findings
- Security architecture review
- HIPAA/privacy workflow review
- Phase II roadmap and budget refinement
- Final Phase I report draft

Success criteria:

- Stakeholders confirm the workflow addresses a real interoffice communication problem.
- Known security and privacy risks are documented.
- Phase II plan explains how ClearPath moves from prototype to secure pilot.

## Phase I Outcome

At the end of Phase I, ClearPath should be able to show a credible working prototype and evidence that the approach is useful, technically feasible, and commercially promising.
