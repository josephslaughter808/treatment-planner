# Staffing Plan

## Purpose

This document outlines the recommended Phase I staffing plan for ClearPath. The goal is to keep the Phase I team small, focused, and credible while covering product leadership, software development, compliance, security, clinical workflow, and user validation.

## Phase I Staffing Philosophy

Phase I should not overhire. The project needs one accountable founder/PI, one strong technical lead, and a small set of targeted advisors or consultants.

The staffing plan should support the core Phase I deliverable:

A working prototype that demonstrates patient-mediated interoffice record requests, consent-scoped JSON packages, provider review, and auditability.

## Core Roles

### Founder / Principal Investigator / Product And Clinical Workflow Lead

Budget: $90,000

Primary responsibilities:

- Lead Phase I execution.
- Own grant milestones and reporting.
- Define product direction and user workflows.
- Coordinate developer, legal, security, and advisor work.
- Conduct provider, patient, and office staff discovery.
- Translate clinical workflow needs into product requirements.
- Review prototype acceptance criteria.
- Prepare Phase II plan and commercialization narrative.

Rationale:

The founder/PI role is necessary because ClearPath is not only a coding project. The project requires workflow design, stakeholder discovery, grant management, and strategic direction.

### Lead Developer / Technical Lead

Budget: $125,000

Primary responsibilities:

- Lead technical architecture.
- Build record request, approval, package, and audit workflows.
- Maintain code quality and testability.
- Implement secure access patterns.
- Coordinate deployment and prototype infrastructure.
- Create technical documentation for Phase II handoff.
- Support demo and validation sessions.

Recommended profile:

- Senior full-stack developer
- Experience with TypeScript/React/Next.js or similar stack
- Comfortable with relational databases and API design
- Security-aware
- Able to make architecture decisions without heavy supervision
- Health-tech experience preferred, but not required if paired with advisors

Hiring note:

One strong senior developer is preferable to multiple junior developers during Phase I.

### HIPAA And Privacy Legal Consultant

Budget: $10,000

Primary responsibilities:

- Review privacy assumptions.
- Advise on patient authorization and consent language.
- Identify HIPAA risk areas.
- Draft or review BAA template direction.
- Advise on synthetic/de-identified Phase I testing.
- Flag issues that must be resolved before real PHI pilots.

Phase I expectation:

This is a focused consult, not a full legal department.

### Security Architecture Reviewer

Budget: $7,500

Primary responsibilities:

- Review technical architecture for security risk.
- Create a threat model.
- Review authentication, authorization, audit logging, and data access patterns.
- Recommend Phase I remediation.
- Define Phase II penetration testing scope.

Phase I expectation:

This is not a full penetration test. It is an architecture review and risk plan suitable for a synthetic-data prototype.

### Clinical And Interoperability Advisor

Budget: $12,500

Primary responsibilities:

- Advise on provider record request workflows.
- Review requested data categories.
- Help identify realistic office-to-office communication scenarios.
- Advise on FHIR, HL7, C-CDA, PDF, CSV, and reviewed-import paths.
- Help prioritize Phase II integration targets.

Recommended profile:

- Health IT, clinical operations, informatics, or interoperability experience
- Familiarity with EHR workflows
- Practical understanding of small-provider constraints

### UX And Workflow Research Support

Budget: $12,500

Primary responsibilities:

- Help plan interviews and prototype walkthroughs.
- Collect structured feedback from providers, patients, and office staff.
- Identify confusing consent language or workflow friction.
- Summarize findings for Phase I reporting.

Phase I expectation:

This can be part-time, consultant-based, or bundled with founder-led discovery if budget rules require.

### Grant Administration, Accounting, Payroll, And Insurance

Budget: $10,000

Primary responsibilities:

- Support grant bookkeeping.
- Set up payroll and contractor payment process.
- Track budget categories.
- Support financial reporting.
- Maintain basic business insurance and administrative readiness.

## Roles Deferred To Phase II

The following roles should likely wait until Phase II:

- Full-time compliance officer
- Dedicated security engineer
- Dedicated QA engineer
- Customer success/support hire
- Sales or business development hire
- Full-time designer
- Multiple additional developers
- EHR integration specialist

## Hiring Sequence

Recommended order:

1. Founder/PI formalizes project plan and grant milestones.
2. Hire lead developer or technical lead.
3. Engage HIPAA/privacy legal consultant early for workflow review.
4. Engage security reviewer after architecture is drafted but before prototype validation.
5. Add clinical/interoperability advisor once request categories and package model are ready.
6. Run UX/workflow research throughout prototype testing.

## Staffing Risks

Key risks:

- Hiring a junior developer who cannot lead architecture.
- Spending too much Phase I money on legal/security before the prototype exists.
- Underfunding founder time and losing project coordination.
- Waiting too long to get privacy and security guidance.
- Building technical features without enough provider and patient feedback.

## Recommendation

Keep the Phase I team lean. Fund the founder/PI and a strong technical lead first, then use specialists surgically for legal, security, clinical workflow, interoperability, and validation.
