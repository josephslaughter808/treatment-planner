# Specific Aims V1 - NLM SBIR

## Working Status

Draft for program-officer discussion and internal grant planning.

This is not yet the final NIH Specific Aims page. It translates the ClearPath product concept into an informatics research proposal aligned with NLM feedback received July 6, 2026. The final version must be tightened to the selected NOFO page limits and reviewed by the scientific team before submission.

## Working Project Title

ClearPath Care: A Consent-Aware, Provenance-Preserving Informatics Platform for Patient-Mediated Clinical Information Exchange

## Overall Goal

The goal of this Phase I SBIR project is to establish the technical and workflow feasibility of a patient-mediated clinical information exchange model that allows providers to request outside health information, routes authorization through the patient, and generates a structured, consent-scoped, provenance-preserving clinical information package for interdisciplinary care.

## Central Problem

Clinical information remains fragmented across unaffiliated practices, hospitals, specialists, dental offices, urgent care centers, rehabilitation providers, behavioral health providers, and other care settings. Patients are often asked to remember and manually report diagnoses, procedures, medications, allergies, prior treatments, and outside records. Providers may lack timely access to clinically relevant history, while broad record-release workflows can over-disclose information, obscure provenance, or fail to present information in a usable format for the receiving clinician.

Existing interoperability standards and networks have improved exchange, but important gaps remain for patient-mediated, consent-scoped, cross-organization workflows. A provider may need a targeted subset of records from an outside office; the patient may need understandable control over what is shared; the receiving clinician may need to know who entered each item, when it was verified, what source system it came from, what consent allowed it to be shared, and whether information is current, historical, patient-reported, provider-reported, or imported.

## Central Hypothesis

A structured informatics model that combines patient-mediated authorization, section-level consent scope, clinical data provenance, status-aware health information, and standards-aware export mappings can improve the feasibility, understandability, and trustworthiness of interdisciplinary medical information exchange.

Phase I will test whether this model can be represented computationally, implemented in a working prototype, and understood by representative users using synthetic or de-identified data.

## Significance

ClearPath addresses a persistent biomedical informatics problem: how to make health information portable, trustworthy, consent-aware, and clinically usable when records are fragmented across multiple organizations and disciplines.

The proposed work is significant because it targets:

- Incomplete or delayed outside-record access during clinical care.
- Patient burden in reconstructing longitudinal medical history.
- Overbroad or all-or-nothing record release.
- Lack of transparent source attribution for mixed patient-entered, provider-entered, and imported data.
- Limited usability of raw records for interdisciplinary review.
- Need for computable authorization and audit metadata linked directly to the shared clinical package.

The project is not framed as routine software development. The research question is whether a patient-mediated, consent-aware, provenance-preserving informatics model can support clinically useful cross-organization exchange while preserving patient control and reviewability.

## Innovation

ClearPath's innovation is the combination of technical and workflow capabilities that are usually handled separately:

1. Provider-initiated, patient-mediated requests for outside clinical information.
2. Section-level and purpose-bound authorization rather than broad release.
3. A structured ClearPath JSON model that binds clinical content to consent scope, provenance, status, audit events, and package integrity metadata.
4. Standards-aware mapping to existing interoperability frameworks, especially HL7 FHIR, without treating the internal consent/provenance model as a replacement for FHIR.
5. Patient-facing review tools that help patients understand requested information and identify incomplete, outdated, or incorrectly attributed medical history.
6. Clinician-facing package review that distinguishes active, managed, historical, patient-reported, provider-verified, and imported information.
7. A workflow model that can support multiple disciplines without becoming specialty-specific.

## Specific Aim 1

Define and validate a consent-aware clinical information model for patient-mediated interdisciplinary exchange.

### Rationale

ClearPath must represent not only clinical data, but also request purpose, authorization scope, source attribution, verification status, data freshness, audit history, and package integrity. Existing standards such as HL7 FHIR provide important resources for representing and exchanging clinical data, but ClearPath's Phase I research must determine how to bind clinical content to patient authorization, provenance, workflow state, and human-readable review across disconnected offices.

### Approach

We will design the ClearPath clinical information model using synthetic interdisciplinary scenarios and map its core elements to relevant standards and concepts, including FHIR resources where appropriate. The model will include demographics, conditions, medications, allergies, procedures, treatments, documents, request metadata, consent scope, provenance, source organization, verification status, timestamps, expiration, revocation, and audit events.

We will conduct structured feedback sessions with patients, clinicians, records staff, and health-informatics advisors to evaluate whether the model captures the information needed for common interoffice requests and whether authorization language is understandable.

### Milestones

- Complete the ClearPath JSON schema for the Phase I exchange package.
- Produce a FHIR positioning and mapping table for core fields.
- Define consent-scope rules for approved, limited, denied, expired, and revoked requests.
- Define provenance labels for patient-entered, provider-entered, imported, and provider-verified data.
- Validate the model against at least three interdisciplinary clinical scenarios.
- Identify model gaps that must be resolved before Phase II.

### Success Criteria

- The model captures all required fields for the selected Phase I scenarios.
- Review participants can distinguish source, verification status, and consent scope using the proposed labels.
- The team can explain which parts of the model align with FHIR and which parts represent ClearPath-specific consent/provenance workflow metadata.

## Specific Aim 2

Build and technically verify a prototype that generates consent-scoped, provenance-preserving clinical information packages.

### Rationale

The feasibility of ClearPath depends on whether the system can enforce patient authorization deterministically. A generated package must include only authorized information, exclude denied information, preserve source attribution, maintain auditability, and remain usable for receiving clinicians.

### Approach

We will build a Phase I prototype using synthetic or de-identified data. The prototype will support provider request creation, patient approval, partial approval, denial, expiration, revocation, package generation, human-readable review, and audit history. The generated package will use ClearPath JSON as the internal canonical representation and will include standards-aware export planning for FHIR-compatible integration.

Technical verification will use synthetic test cases covering full approval, partial approval, denial, revocation, expiration, invalid status transitions, unauthorized access attempts, altered packages, and mixed-source records.

### Milestones

- Implement provider request creation and tracking.
- Implement patient approval, limited approval, denial, expiration, and revocation.
- Generate a schema-valid ClearPath JSON package for approved requests.
- Generate a human-readable package summary.
- Preserve consent, provenance, audit, and integrity metadata through the package lifecycle.
- Build automated tests for authorization fidelity and invalid access conditions.

### Success Criteria

- 100% of tested packages exclude sections that were denied, expired, revoked, or not requested.
- 100% of required audit events are recorded in the final synthetic test suite.
- 100% of altered package payloads fail integrity verification.
- At least 99% of valid synthetic request scenarios generate schema-valid packages without manual correction.
- No unresolved critical authorization or access-control failure remains at Phase I close.

## Specific Aim 3

Evaluate usability, comprehension, trust, and workflow fit for patients, clinicians, and office staff.

### Rationale

Patient-mediated exchange fails if patients cannot understand what is being requested or if clinicians cannot efficiently interpret what was received. Phase I must evaluate whether the proposed workflow and information package are understandable, clinically useful, and operationally plausible.

### Approach

We will conduct moderated usability and workflow sessions using the prototype and synthetic scenarios. Patient participants will interpret requests, make authorization decisions, and review health information. Clinicians and office staff will create requests, track request status, review generated packages, and interpret source/provenance/consent labels.

Measures will include task success, decision accuracy, comprehension of authorization scope, package-review accuracy, completion time, perceived trust, perceived burden, and qualitative adoption barriers.

### Milestones

- Complete a patient task protocol and clinician/staff task protocol.
- Test patient understanding of request purpose, requested sections, expiration, revocation, and partial approval.
- Test clinician/staff understanding of package scope, source attribution, verification status, and audit trail.
- Identify workflow revisions needed for Phase II pilot readiness.
- Produce a Phase II pilot plan with refined measures and partner requirements.

### Success Criteria

- At least 80% of patient participants correctly identify the requester, purpose, and requested record categories.
- At least 80% of patient participants correctly complete an assigned limited-approval scenario.
- At least 80% of clinician/staff participants correctly identify package scope, provenance, and authorization status.
- Critical usability failures are classified, corrected where feasible, and carried into the Phase II design plan.

## Expected Phase I Outcomes

At the end of Phase I, ClearPath expects to produce:

- A validated consent-aware clinical information model.
- A ClearPath JSON exchange package specification with FHIR positioning.
- A working prototype for provider request, patient authorization, package generation, and package review.
- Synthetic test evidence for authorization fidelity, audit completeness, package integrity, and access controls.
- Usability and workflow findings from representative users.
- A refined Phase II plan for pilot testing with clinical partners.

## Program-Officer Feedback Incorporated

This draft incorporates NLM guidance to:

- Emphasize underlying informatics research and technical innovation.
- Avoid framing the project primarily as software-product development.
- Explain how the work advances patient-mediated information exchange, consent-aware data sharing, interoperability, data provenance, and clinical workflow integration.
- Clarify the relationship between ClearPath JSON and existing interoperability standards such as HL7 FHIR.

## Open Questions For NLM Or Advisors

1. Is this framing sufficiently research-centered for NLM SBIR review?
2. Should the primary novelty emphasize consent-aware exchange, provenance, clinical workflow integration, or the structured information model?
3. Is the proposed Phase I usability work likely to be considered human subjects research or a clinical trial under NIH definitions?
4. How detailed should the FHIR mapping be for Phase I versus Phase II?
5. Should the team pursue SBIR only, or consider STTR if an academic informatics partner joins the project?
