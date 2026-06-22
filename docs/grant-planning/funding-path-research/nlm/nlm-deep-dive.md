# NLM Deep Dive

## Review Date

June 20, 2026

## Executive Summary

The National Library of Medicine is the best current NIH institute for ClearPath. NLM supports biomedical informatics research and commercialization, including software platforms, human-centered informatics, biomedical data infrastructure, and tools that make health information useful and trustworthy.

ClearPath should be framed as a research-driven informatics platform, not as an ordinary records-request portal. The scientific problem is how to represent, authorize, exchange, track, and safely interpret longitudinal health information across unaffiliated organizations while preserving patient control, provenance, minimum-necessary disclosure, and usable clinical context.

## Current Opportunity

### NIH Parent SBIR: `PA-27-100`

- Mechanism: SBIR Phase I `R43`, Phase II `R44`, and Fast-Track where accepted by the participating institute
- Status: active
- Release date: May 28, 2026
- Expiration: April 6, 2027
- Clinical trial: optional under the parent announcement, subject to institute acceptance
- Applicant: eligible United States small business
- Cost sharing: not required

Standard NIH small-business due dates are generally September 5, January 5, and April 5. A date falling on a weekend or federal holiday moves under NIH rules. The exact opportunity record must be checked before submission.

### NIH Parent STTR: `PA-27-102`

STTR is available when a qualified United States research institution will perform at least 30% of the R&D and the small business at least 40%. NLM participation must be confirmed in the current participating-organization table.

STTR may be useful if a university research partner will own a major scientific role. SBIR is operationally simpler when ClearPath can perform at least 67% of Phase I research itself.

## Mission Fit

NLM's current small-business interests include:

- Biomedical informatics methods, tools, and software platforms
- Trustworthy use of biomedical data
- Biomedical data infrastructure that operates at scale
- Human-centered informatics
- Sustainable reference resources and platform science
- Commercialization of useful informatics technology

ClearPath maps to those interests through:

- A canonical, structured exchange package using JSON and healthcare standards
- Patient-mediated authorization of specific records and data classes
- Provenance and chain-of-custody representation
- Cross-organization request and approval state management
- Usability and comprehension research for patients, clinicians, and records staff
- Safety controls for over-disclosure, under-disclosure, stale information, and identity mismatch
- Interoperability with FHIR, USCDI-aligned data, documents, and legacy interfaces

## Phase I Research Scope

A competitive Phase I should test feasibility and reduce technical and scientific uncertainty. Appropriate aims could include:

1. Design and validate a computable authorization and provenance model for patient-directed interoffice record exchange.
2. Build and test a standards-based prototype that can ingest heterogeneous source records and produce a traceable canonical package.
3. Evaluate whether patients and clinical-office users can accurately understand, approve, transmit, and verify requests without unsafe disclosure or workflow failure.

Ordinary feature completion, routine cloud deployment, marketing, sales, and general operations are not research aims.

## Eligibility And Founder PI

For NIH SBIR, the company must generally:

- Be organized for profit in the United States
- Have a United States place of business
- Have no more than 500 employees including affiliates
- Meet qualifying United States ownership and control rules
- Perform the work in the United States unless a rare exception is approved

The SBIR principal investigator must legally reside in the United States and have the expertise and resources to direct the work. At award and during the project, more than 50% of the PI's employment must be with the small business.

The founder may serve as PI if these requirements and scientific capability expectations are met. A founder without a research record should add strong informatics, human-factors, clinical, and statistical collaborators and discuss leadership structure with NLM.

## Workshare

- SBIR Phase I: the small business normally performs at least 67% of research or analytical effort.
- SBIR Phase II: the small business normally performs at least 50%.
- STTR: the small business performs at least 40%, and one qualified research institution at least 30%.

Subcontractors should provide specialized work, not function as the actual applicant while ClearPath only administers the award.

## Budget, Salary, And Indirect Costs

The exact parent-announcement budget rules govern. Current SBA guideline amounts are commonly referenced around $323,090 for Phase I and $2,153,927 for Phase II, but institute topic waivers and announcement-specific limits control.

Founder salary and technical-lead salary can be allowable when:

- The work is necessary for the research
- Effort is documented and reasonable
- Compensation is consistent with company practice and market conditions
- The budget does not charge business development or unrelated operations to the award

NIH does not negotiate an indirect-cost rate for Phase I. Under the current application guide, a small business generally may request an F&A rate up to 40% of total direct costs without further negotiation, subject to the announcement and agency review. A higher rate requires support and may trigger negotiation. The rate is not an automatic allowance; costs still must be allowable and consistently treated.

## Project Length And Phase Structure

- Phase I is commonly 6 to 12 months and generally may not exceed two years.
- Phase II is commonly two years and generally may not exceed three years.
- Fast-Track combines Phase I and Phase II review but raises the evidence and planning burden.

For ClearPath, a 12-month Phase I is more credible than trying to complete nationwide deployment. Phase I should end with validated feasibility data, a working prototype, partner evidence, and a Phase II study plan.

## Required Registrations

Begin at least six weeks before the deadline:

- Legal business formation and tax information
- SAM.gov registration and UEI
- Grants.gov organization registration
- eRA Commons organization registration and PI account
- SBA Company Registry and SBC Control ID
- Login and role verification for the authorized organization representative

SAM must remain active through submission and award.

## Application Components

Expect the Forms I SBIR/STTR package to require, among other items:

- Project summary and public-health relevance
- Specific Aims
- Research Strategy
- Bibliography
- Facilities and resources
- Equipment
- Biosketches and support information
- Budget and justification
- Commercialization Plan when required by phase/mechanism
- Human-subjects and clinical-trial information when applicable
- Data-management and sharing plan when applicable
- Letters of support and subaward documents
- Authentication, rigor, inclusion, and resource-sharing sections as applicable

Page limits and attachments must be taken from the live opportunity and application guide, not copied from an older application.

## Review Logic

Reviewers will look for:

- Significance of the interoperability and patient-safety problem
- Innovation beyond existing portals, HIEs, release-of-information vendors, and FHIR APIs
- A rigorous, feasible approach with measurable milestones
- A capable team and suitable environment
- Commercial potential and defensible market entry
- Protection of human participants and health data

## NLM-Specific Cautions

- NLM does not accept budget-cap waiver requests under its current small-business considerations.
- NLM does not participate in Phase IIB or the Commercialization Readiness Pilot.
- A product-development narrative without a research contribution will be weak.
- HIPAA compliance alone is not innovation or proof of safety.
- A generic claim that JSON connects every language is not technically sufficient; the proposal must specify schemas, semantics, terminology, validation, versioning, and mappings.

## Contact Questions

1. Does NLM view patient-controlled, cross-organization authorization and provenance as within its current informatics priorities?
2. Is SBIR or STTR preferable given the anticipated university role?
3. Would a 12-month Phase I near the SBA guideline amount be acceptable without a waiver?
4. Which review panel is most likely, and what expertise should the team add?
5. Does the planned user study count as a clinical trial under NIH's definition?
6. Are there institute expectations for FHIR, USCDI, TEFCA, or open research artifacts?

## Recommendation

Advance NLM first. Build a one-page Specific Aims draft, a one-page commercial summary, a milestone table, and a concise team plan before requesting program feedback.
