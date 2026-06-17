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
| Founder / PI salary plus fringe and payroll burden | $80,000 | Supports full-time or near full-time project leadership, grant execution, provider and patient discovery, workflow design, acceptance testing, vendor coordination, and Phase II planning. |
| Lead developer / technical lead | $130,000 | Funds a senior full-stack developer or technical lead to build the record request workflow, patient approval flow, consent-scoped package generation, provider review screens, audit trail, test coverage, and prototype hardening. |
| HIPAA and privacy legal consult | $10,000 | Covers project-specific review of HIPAA/privacy assumptions, consent language, patient authorization workflow, BAA template planning, and data-sharing risk areas. |
| Security architecture review | $7,500 | Funds threat modeling, secure architecture review, access-control review, and a remediation plan suitable for a Phase I prototype. Full penetration testing should be planned for Phase II before production use with real PHI. |
| Clinical and interoperability advisor | $12,500 | Supports part-time guidance on clinical record request workflows, interoffice communication, FHIR/HL7/C-CDA/PDF/CSV exchange paths, and provider usability. |
| UX and workflow research | $12,500 | Funds interviews, prototype walkthroughs, workflow validation, and usability feedback with patients, providers, and office staff. |
| Cloud, development tools, and prototype infrastructure | $10,000 | Covers hosting, database, logging, monitoring, domain, design, testing, and developer tooling for a secure prototype environment. |
| Grant administration, accounting, payroll, and insurance | $10,000 | Supports grant bookkeeping, payroll processing, basic business insurance, award administration, and financial reporting. |
| Pilot/demo/user discovery expenses | $7,500 | Supports local office visits, demo preparation, stakeholder meetings, and research participant or site-related expenses where allowable. |
| Indirect and operating reserve | $20,000 | Provides a controlled reserve for allowable indirect costs, small operating needs, and budget variability during Phase I. |
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

## Budget Justification Notes

The founder/PI salary should be justified as project labor. The founder is responsible for project direction, grant execution, milestone management, user discovery, workflow validation, vendor coordination, and Phase II planning.

The lead developer budget is the largest technical cost because Phase I success depends on building a credible prototype that demonstrates patient-mediated record request, consent, exchange, and audit workflows.

Legal and security spending is intentionally limited in Phase I. The goal is to design the prototype correctly, document risks, and prepare for production compliance work in Phase II. Full penetration testing and production HIPAA implementation should occur before ClearPath handles real PHI at pilot scale.

## Grant Manager Question

Ask the grant manager:

> Can Phase I use synthetic or de-identified records and include a HIPAA workflow consult plus security architecture review, with full penetration testing and production HIPAA implementation budgeted for Phase II before handling real PHI?
