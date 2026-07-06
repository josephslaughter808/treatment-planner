# ClearPath JSON And FHIR Positioning

## Working Purpose

This document explains how ClearPath's internal JSON model should be positioned relative to existing healthcare interoperability standards, especially HL7 FHIR, for the NLM SBIR application.

The key message is simple:

ClearPath JSON is not intended to replace FHIR. ClearPath JSON is the internal consent, provenance, workflow, and package-control model. FHIR is an important external interoperability standard that ClearPath should map to and from where appropriate.

## Why This Document Exists

NLM program feedback specifically noted that reviewers will likely want to understand how ClearPath relates to existing standards such as HL7 FHIR and what novel capabilities ClearPath provides.

That means the grant application should avoid saying:

"ClearPath uses JSON so it can talk to every system."

That statement is too broad and technically weak.

Instead, the application should say:

"ClearPath uses a structured internal JSON package to bind clinical content to patient authorization, consent scope, provenance, audit events, status, and package integrity. The Phase I project will define how this internal package maps to existing standards, including HL7 FHIR resources, while evaluating novel patient-mediated and consent-aware exchange workflows."

## Working Definitions

### ClearPath JSON

ClearPath JSON is the internal canonical package format used to represent:

- Requested clinical sections
- Patient authorization decisions
- Approved, denied, expired, and revoked scope
- Clinical content included in the package
- Source organization and author attribution
- Patient-entered, provider-entered, imported, and provider-verified status
- Active, managed, resolved, historical, uncertain, and outdated condition states
- Package creation time, expiration, version, and integrity metadata
- Audit events across request, approval, package generation, review, and revocation

### HL7 FHIR

FHIR is an established healthcare interoperability standard that represents clinical and administrative data using resources such as Patient, Practitioner, Organization, Condition, MedicationStatement, AllergyIntolerance, Procedure, DiagnosticReport, DocumentReference, Consent, Provenance, AuditEvent, Bundle, and others.

FHIR should be treated as a key interoperability target and vocabulary for mapping, not as something ClearPath competes against.

## Recommended Grant Positioning

ClearPath should be framed as a standards-aware informatics layer that adds:

- Patient-mediated authorization workflow.
- Consent-scoped package generation.
- Human-readable patient and clinician review.
- Strong provenance and verification labeling for mixed-source data.
- Workflow state tracking across disconnected offices.
- Package-level auditability and integrity.
- A practical bridge from patient-facing review to clinician-facing exchange.

ClearPath should not claim that its JSON alone creates interoperability. Interoperability requires schemas, semantics, terminology, validation, mappings, governance, security, workflow adoption, and testing.

## What Is Novel

The novelty is not "JSON for medical records."

The novelty is the way ClearPath combines:

1. Provider-initiated record requests.
2. Patient-mediated approval, limitation, denial, and revocation.
3. Consent scope attached directly to package contents.
4. Provenance and verification status attached to individual clinical items.
5. Patient-facing review tools that support correction requests and clearer self-understanding.
6. Clinician-facing package review that shows source, status, and authorization context.
7. Synthetic testing for authorization fidelity and over-disclosure prevention.
8. A standards-aware mapping strategy to FHIR rather than a standards-avoidant custom format.

## Why Not Use Only FHIR Internally?

FHIR is powerful, but ClearPath's Phase I problem includes workflow and package-control concepts that go beyond simply storing clinical facts:

- What exactly did the requesting provider ask for?
- What did the patient approve?
- What did the patient deny?
- What was outside the scope of authorization?
- When does authorization expire?
- Was authorization revoked after package generation?
- Which package version was reviewed?
- Which item was patient-entered versus provider-verified?
- Which source organization supplied the item?
- Which items are current versus historical or resolved?
- What did the generated package include or exclude?
- Can the package be audited and checked for alteration?

FHIR has resources that relate to many of these concepts, especially Consent, Provenance, AuditEvent, Bundle, and DocumentReference. The Phase I research question is how to combine those standard concepts with ClearPath's patient-mediated workflow in a way that is usable, enforceable, and clinically meaningful.

## Proposed Phase I Mapping Scope

Phase I should map ClearPath fields to selected FHIR resources at a planning/prototype level. It does not need to implement full production FHIR integration unless the final NOFO or advisors require it.

| ClearPath Concept | Likely FHIR Relationship | Phase I Position |
| --- | --- | --- |
| Patient identity | Patient | Map core demographic fields. |
| Provider identity | Practitioner, PractitionerRole | Map requester and source-provider fields. |
| Organization | Organization | Map requesting and source organizations. |
| Condition/diagnosis | Condition | Map diagnosis, status, onset/date, recorder, and verification where possible. |
| Medication | MedicationStatement, MedicationRequest | Map medication history and active medication context. |
| Allergy | AllergyIntolerance | Map allergy and reaction fields. |
| Procedure/treatment | Procedure, ServiceRequest, CarePlan | Map completed and planned interventions where feasible. |
| Documents/images | DocumentReference, DiagnosticReport, Media | Map attached reports and references. |
| Consent scope | Consent | Map patient authorization where feasible; preserve ClearPath-specific section-level scope. |
| Provenance | Provenance | Map source and attribution where feasible. |
| Audit trail | AuditEvent | Map key lifecycle events where feasible. |
| Package | Bundle, Composition, DocumentReference | Explore best representation for a generated package. |
| Human-readable summary | Composition or generated narrative | Keep ClearPath summary as user-facing output, with standards-aware metadata. |

## ClearPath-Specific Fields To Preserve

Some ClearPath fields may not map cleanly to one FHIR field without profiles, extensions, or implementation-guide decisions. Phase I should preserve them in the ClearPath JSON package while documenting the mapping strategy.

Important ClearPath-specific fields include:

- `requestPurpose`
- `requestedSections`
- `approvedSections`
- `deniedSections`
- `authorizationDecision`
- `authorizationExpiration`
- `revocationTimestamp`
- `patientDecisionRationale`
- `packageScopeHash`
- `packageIntegrityHash`
- `sourceTrustLabel`
- `patientAcknowledged`
- `providerVerified`
- `clinicalStatusGroup`
- `reviewedByRecipient`
- `recipientReviewTimestamp`

These fields are central to ClearPath's research thesis because they connect consent, provenance, status, and workflow state to the data package.

## Language To Use In The Application

Recommended wording:

"ClearPath will use a standards-aware internal JSON package to bind clinical data to patient authorization scope, provenance, workflow state, audit history, and package integrity. During Phase I, the project will define and test this package model using synthetic interdisciplinary scenarios and will document mappings to relevant HL7 FHIR resources. This strategy allows ClearPath to evaluate novel patient-mediated consent and provenance functions while remaining compatible with existing interoperability standards."

## Language To Avoid

Avoid:

- "JSON lets us connect to every coding language."
- "ClearPath replaces FHIR."
- "FHIR is too complicated, so we use our own format."
- "The app will integrate with all EHRs in Phase I."
- "HIPAA compliance proves the platform is innovative."

Better:

- "ClearPath is standards-aware and FHIR-positioned."
- "The internal package model focuses on consent scope, provenance, auditability, and patient-mediated workflow."
- "Production EHR integration is a Phase II or later objective after Phase I model validation."

## Phase I Research Questions

1. Can ClearPath JSON represent consent scope, provenance, audit events, and clinical content in one package without ambiguity?
2. Can the model map core clinical content to FHIR resources while preserving ClearPath-specific consent and workflow metadata?
3. Can patient-mediated authorization decisions be enforced deterministically during package generation?
4. Can clinicians understand source, status, and scope labels in the generated package?
5. What data elements require FHIR profiles, extensions, or implementation-guide work in Phase II?

## Phase II Direction

If Phase I is successful, Phase II can expand from prototype package generation to deeper standards implementation:

- Build FHIR import/export endpoints.
- Create or align with FHIR profiles for ClearPath consent/provenance concepts.
- Test against real-world clinical data with pilot partners.
- Explore TEFCA/QHIN-aligned workflows where appropriate.
- Add terminology binding for SNOMED CT, LOINC, RxNorm, ICD-10-CM, CPT, and other controlled vocabularies.
- Validate clinician review and patient authorization workflows in live or near-live environments.

## Bottom Line

ClearPath JSON is the research vehicle for a consent-aware, provenance-preserving package model. FHIR is the standards ecosystem ClearPath must respect, map to, and eventually integrate with. The SBIR application should make both points clearly.
