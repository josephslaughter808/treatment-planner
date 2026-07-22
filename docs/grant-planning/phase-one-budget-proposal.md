# ClearPath Phase I Budget Proposal

## Purpose

This document outlines a proposed $300,000 Phase I budget for ClearPath as a patient-controlled interoffice and interdisciplinary medical communication platform.

The Phase I project should prove feasibility, technical merit, and commercial potential for the core ClearPath workflow:

1. A provider requests records from another office or care setting.
2. The patient reviews the request.
3. The patient approves, limits, or denies access.
4. ClearPath generates a consent-scoped JSON record package.
5. The requesting provider reviews the approved package.
6. ClearPath records the access, review, and package history in an audit trail.

Phase I should use synthetic or de-identified records unless the award terms, legal review, security review, and pilot agreements support handling real protected health information.

## Proposed Phase I Budget

| Category | Budget | Purpose |
| --- | ---: | --- |
| Founder / PI salary plus fringe and payroll burden | $90,000 | Supports full-time or near full-time project leadership, grant execution, provider and patient discovery, workflow design, acceptance testing, vendor coordination, documentation, and Phase II planning. |
| Lead developer / technical lead | $125,000 | Funds a senior full-stack developer or technical lead to build the record request workflow, patient approval flow, consent-scoped package generation, provider review screens, audit trail, test coverage, and prototype hardening. |
| HIPAA and privacy legal consult | $10,000 | Covers project-specific review of HIPAA/privacy assumptions, consent language, patient authorization workflow, BAA template planning, and data-sharing risk areas. |
| Security architecture review | $7,500 | Funds threat modeling, secure architecture review, access-control review, and a remediation plan suitable for a Phase I prototype. Full penetration testing should be planned for Phase II before production use with real PHI. |
| Clinical and interoperability advisor | $12,500 | Supports part-time guidance on clinical record request workflows, interoffice communication, FHIR/HL7/C-CDA/PDF/CSV exchange paths, and provider usability. |
| UX and workflow research | $12,500 | Funds interviews, prototype walkthroughs, workflow validation, and usability feedback with patients, providers, and office staff. |
| Cloud, development tools, and prototype infrastructure | $10,000 | Covers hosting, database, logging, monitoring, domain, design, testing, and developer tooling for a secure prototype environment. |
| Grant administration, accounting, payroll, and insurance | $10,000 | Supports grant bookkeeping, payroll processing, basic business insurance, award administration, and financial reporting. |
| Pilot/demo/user discovery expenses | $7,500 | Supports local office visits, demo preparation, stakeholder meetings, and research participant or site-related expenses where allowable. |
| Indirect and operating reserve | $15,000 | Provides a controlled reserve for allowable indirect costs, small operating needs, and budget variability during Phase I. |
| **Total** | **$300,000** |  |

## Phase I Scope

The Phase I budget should focus on proving the core feasibility of ClearPath, not building the full production company.

Recommended Phase I deliverables:

- Working provider record request flow
- Patient request approval, denial, and scoped access selection
- Consent-scoped ClearPath JSON package generation
- Provider package review and download workflow
- Audit events for request creation, patient decision, package generation, provider review, and access revocation
- Prototype usability feedback from provider, office staff, and patient stakeholders
- Security architecture review and remediation plan
- HIPAA/privacy workflow review
- Phase II implementation and commercialization plan

## Phase II Items

The following items are better suited for Phase II unless the grant manager or award terms require them earlier:

- Full third-party penetration testing
- Production HIPAA implementation with real PHI
- SOC 2 or HITRUST readiness
- Production-grade cloud compliance program
- Direct EHR integrations beyond reviewed export/import prototypes
- Expanded clinical pilots with live patient records
- Large-scale security monitoring and incident response program
- Broader legal contracting for paying customers and partner networks

## Budget Justification

The requested Phase I budget is $300,000. Funds will support development and feasibility testing of ClearPath as a patient-mediated, consent-aware, provenance-preserving clinical information exchange model. The budget supports three aims: defining the ClearPath information model, building and technically testing the prototype, and evaluating usability and workflow fit with representative users. The budget does not include broad commercial launch, live protected health information deployment, full EHR integration, or full third-party penetration testing.

### Personnel

#### Founder / PI Salary Plus Fringe And Payroll Burden: $90,000

Funds are requested to support the founder's full-time or near full-time effort during Phase I. The founder will be responsible for overall project direction, grant execution, milestone management, workflow design, provider and patient discovery, advisor coordination, prototype acceptance testing, documentation, budget oversight, and Phase II planning.

This role directly supports all three aims. Aim 1 requires founder effort to define the workflow model, organize user and advisor feedback, and translate clinical workflow needs into model requirements. Aim 2 requires founder effort to review prototype behavior against the consent and provenance model. Aim 3 requires founder effort to coordinate usability and workflow testing and interpret findings for Phase II planning.

The $90,000 request is justified as project labor tied to the proposed research activities, not as general founder support. The founder's effort must be documented through project records, timekeeping, milestone tracking, and grant reporting. Final salary, fringe, and payroll treatment should be confirmed against the selected NOFO, NIH salary limitations, company payroll structure, and accountant guidance.

#### Lead Developer / Technical Lead: $125,000

Funds are requested for a senior full-stack developer or technical lead. This person will build the provider request workflow, patient approval flow, limited approval, denial, expiration, revocation, consent-scoped package generation, provider review screens, audit trail, source and provenance labels, package integrity checks, test coverage, prototype reliability, and technical documentation.

This role is the largest technical cost because Phase I feasibility depends on whether the ClearPath model can be represented in working software and tested against synthetic scenarios. The technical lead primarily supports Aim 2, while also supporting Aim 1 by implementing the model and Aim 3 by preparing a usable prototype for patient, provider, and office staff evaluation.

### Consultants And Advisors

#### HIPAA And Privacy Legal Consult: $10,000

Funds are requested for limited HIPAA and privacy legal review. This work will include review of the consent workflow, patient authorization language, synthetic or de-identified data posture, future business associate agreement needs, privacy risks, and Phase II compliance requirements. Phase I is expected to use synthetic or de-identified data, so this cost is focused on responsible design and Phase II planning rather than full production compliance implementation.

#### Security Architecture Review: $7,500

Funds are requested for a Phase I security architecture review. This review will include threat modeling, access-control review, audit-logging review, data-flow review, and a remediation plan for the prototype. Full third-party penetration testing is expected to occur before real PHI pilot deployment in Phase II. The Phase I security review is included to identify privacy and security risks while the system is still being designed.

#### Clinical And Interoperability Advisor: $12,500

Funds are requested for a clinical informatics, interoperability, or FHIR advisor. This advisor will review the ClearPath JSON model, identify relevant HL7 FHIR resources, advise on standards positioning, review clinical workflow assumptions, and help ensure that the project is framed as informatics research rather than ordinary software development. This role supports Aim 1 and strengthens the technical credibility of the application.

#### UX And Workflow Research Support: $12,500

Funds are requested for usability and workflow research support. This may include a human-factors or usability advisor, task design, participant materials, comprehension measures, workflow testing, and analysis of user feedback. This role supports Aim 3 and is necessary because patient-mediated exchange will only work if patients, clinicians, and office staff can understand the request, consent choices, package review, and source labels.

### Other Direct Costs

#### Cloud, Development Tools, And Prototype Infrastructure: $10,000

Funds are requested for hosting, database services, development tools, monitoring, logging, testing tools, domain services, and prototype infrastructure. These costs are necessary to build, deploy, test, and document the Phase I prototype using synthetic or de-identified data.

#### Grant Administration, Accounting, Payroll, And Insurance: $10,000

Funds are requested for grant administration, accounting, payroll support, bookkeeping, basic business insurance, and financial reporting. These costs are necessary to manage award funds responsibly, track project labor, document allowable expenses, support required reporting, and maintain basic administrative controls for a new small business.

#### Pilot, Demo, And User Discovery Expenses: $7,500

Funds are requested for user discovery and prototype evaluation expenses. These may include participant incentives, scheduling support, local meetings, demo preparation, workflow walkthroughs, and research materials tied to Aim 1 and Aim 3. These costs support evaluation of whether patients, providers, and office staff can understand and use the ClearPath workflow.

#### Indirect And Operating Reserve: $15,000

Funds are requested for allowable indirect and operating costs that support the Phase I project but are not easily assigned to one direct cost category. These may include administrative overhead, communication tools, small operating needs, compliance-related overhead, and controlled budget variability during the project. The final indirect cost treatment should follow NIH small-business guidance, the selected NOFO, and accountant guidance.

### Costs Deferred To Phase II

Legal and security spending is intentionally limited in Phase I. The goal is to design the prototype correctly, document risks, and prepare for production compliance work in Phase II. Full production HIPAA implementation, full third-party penetration testing, SOC 2 or HITRUST readiness, production-grade cloud compliance, broad live EHR integration, and real-PHI clinical pilot deployment should occur before ClearPath handles real PHI at pilot scale and are better suited for Phase II unless the grant manager, award terms, legal counsel, or pilot partner requires them earlier.

## Grant Manager Question

Ask the grant manager:

> Can Phase I use synthetic or de-identified records and include a HIPAA workflow consult plus security architecture review, with full penetration testing and production HIPAA implementation budgeted for Phase II before handling real PHI?
