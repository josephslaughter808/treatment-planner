# ClearPath Planned Research Inventory

## Purpose

This document is the master checklist of research planned for ClearPath.

It is designed to answer four practical questions:

1. What must ClearPath learn before applying for or completing NIH Phase I funding?
2. What evidence must be collected to show that the platform is useful, feasible, understandable, secure, and commercially viable?
3. Which research can be completed with synthetic data during Phase I?
4. Which research should wait until Phase II legal, security, and clinical-pilot requirements are satisfied?

The companion [NIH Phase I Research Plan](./nih-phase-one-research-plan.md) explains how this work can be framed as Specific Aims, methods, milestones, and go/no-go criteria. This inventory is the operational list used to plan and track the work.

## Current Research Boundary

ClearPath is an interdisciplinary healthcare communication and record-exchange platform. Research must not assume that the product belongs to one medical specialty.

Phase I should primarily use:

- Synthetic patient records
- Synthetic record requests
- Prototype interfaces
- Staff simulations
- Interviews and usability studies conducted under the appropriate human-subjects determination
- File-based interoperability examples rather than live EHR connections

Phase I should not depend on:

- Real PHI
- Production EHR access
- Direct writes into clinical systems
- Live clinical decision-making
- A full production HIPAA environment
- Large clinical outcome trials

## Status Key

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed
- `[?]` Requires an external decision, partner, attorney, IRB, or program officer
- `[II]` Planned primarily for Phase II

## Research Track 1: Grant And Program Fit

### NIH Institute And Program Research

- [~] Identify the strongest NIH institute or center for the application. Preliminary recommendation: NLM, pending program staff confirmation.
- [x] Compare NLM, NIBIB, AHRQ, and other relevant federal funding paths.
- [ ] Identify the exact active Notice of Funding Opportunity.
- [ ] Confirm whether the opportunity accepts Phase I SBIR, STTR, Fast-Track, or another mechanism.
- [ ] Confirm award ceiling, project period, due dates, and eligibility rules.
- [ ] Confirm whether the founder may serve as Principal Investigator under the selected mechanism.
- [ ] Confirm employment requirements for the Principal Investigator.
- [ ] Confirm whether the proposed founder salary and technical-lead costs are allowable.
- [ ] Determine whether indirect costs are permitted and how they should be calculated.
- [ ] Identify required registrations, including SAM.gov, UEI, Grants.gov, eRA Commons, and SBA registrations.
- [ ] Review application page limits and required attachments.
- [ ] Identify institute-specific review criteria or preferences.
- [?] Discuss product fit and Phase I boundaries with the NIH program officer.
- [?] Ask whether the proposed interviews and usability studies are responsive to the funding opportunity.
- [?] Ask whether synthetic-data technical testing is sufficient for Phase I feasibility.

Expected evidence:

- Funding opportunity comparison table
- Selected program and written rationale
- Program officer discussion notes
- Eligibility and registration checklist
- Submission calendar
- Final application requirements list

Completion standard:

- One funding mechanism is selected and the research plan is demonstrably responsive to it.

## Research Track 2: Literature And Evidence Review

### Record Exchange Problem Review

- [ ] Review published research on delays in obtaining outside medical records.
- [ ] Review research on incomplete or missing records during referrals and care transitions.
- [ ] Review evidence concerning administrative burden for medical records staff.
- [ ] Review evidence on patients acting as intermediaries between disconnected organizations.
- [ ] Review research on duplicate tests, delayed treatment, and care fragmentation associated with missing information.
- [ ] Review evidence about exchange barriers affecting small and independent practices.
- [ ] Review disparities in digital access and health-information exchange.

### Consent And Patient-Control Review

- [ ] Review research on patient understanding of medical-record authorization forms.
- [ ] Review research on broad authorization versus granular or section-level authorization.
- [ ] Review research on consent fatigue, cognitive burden, and dark-pattern risk.
- [ ] Review research on patient trust in electronic health-information exchange.
- [ ] Review research on revocation, expiration, and ongoing consent management.
- [ ] Review special consent concerns involving behavioral health, substance-use, reproductive, genetic, and other sensitive information.
- [ ] Review health-literacy and plain-language standards relevant to authorization screens.
- [ ] Review accessibility research affecting consent comprehension.

### Interoperability Review

- [ ] Review current FHIR, US Core, C-CDA, Direct Messaging, TEFCA, and related exchange approaches relevant to the project.
- [ ] Review limitations of PDF, fax, portal download, and manual upload workflows.
- [ ] Review provenance and data-lineage requirements for exchanged records.
- [ ] Review terminology and coding systems needed for future structured exchange.
- [ ] Review patient-mediated exchange and consumer-access models.
- [ ] Identify what ClearPath JSON adds and where established standards must remain authoritative.

Expected evidence:

- Literature-search strategy
- Evidence table with citations and study quality notes
- Summary of known problems and research gaps
- Prior-research rigor assessment
- Bibliography for the NIH application
- List of claims that the current evidence does and does not support

Completion standard:

- The application can explain the importance of the problem, limitations of prior work, and the precise gap ClearPath intends to address.

## Research Track 3: Stakeholder And Problem Validation

### Patients And Caregivers

- [ ] Interview patients who have requested or transported records between organizations.
- [ ] Interview caregivers who coordinate records for children, older adults, or dependents.
- [ ] Learn how patients currently receive, understand, approve, and track record requests.
- [ ] Identify points where patients feel uninformed, pressured, or unable to control disclosure.
- [ ] Identify concerns about sensitive information and unintended sharing.
- [ ] Identify preferred notification, identity-verification, and support methods.
- [ ] Learn what would increase or reduce trust in ClearPath.

### Clinicians

- [ ] Interview primary care clinicians.
- [ ] Interview at least two types of specialists.
- [ ] Interview clinicians involved in care transitions or rehabilitation.
- [ ] Identify the outside records most frequently needed.
- [ ] Identify minimum information needed to make a request clinically meaningful.
- [ ] Identify consequences of late, incomplete, duplicated, or irrelevant records.
- [ ] Determine how clinicians judge provenance and reliability.
- [ ] Determine what information belongs in a human-readable review screen.

### Administrative And Records Staff

- [ ] Interview health information management or medical-records personnel.
- [ ] Interview office managers, referral coordinators, and front-office staff.
- [ ] Map current request intake, authorization, follow-up, fulfillment, and closure steps.
- [ ] Measure approximate staff time and number of handoffs in the existing process.
- [ ] Identify common request rejection reasons.
- [ ] Identify common missing fields and communication failures.
- [ ] Identify how staff determine request status today.
- [ ] Identify adoption barriers, training needs, and escalation paths.

### Advisors And Decision-Makers

- [ ] Interview an interoperability specialist.
- [ ] Interview a clinical informatics specialist.
- [ ] Interview a privacy or health-information attorney.
- [ ] Interview a healthcare security architect.
- [ ] Interview practice or health-system technology purchasers.
- [ ] Interview potential pilot-site leadership.

Suggested Phase I sample:

- 8-10 patients or caregivers
- 8-10 clinicians
- 8-10 records or office staff
- 4-6 technical, privacy, or business experts

Expected evidence:

- Recruitment matrix
- Interview guide
- Interview notes or approved recordings
- Participant characteristics summary
- Thematic codebook
- Findings report
- Ranked problem list
- Ranked product requirements
- Quotations approved for de-identified use

Completion standard:

- Participants across at least three disciplines confirm a shared, important record-exchange problem and identify a common core workflow.

## Research Track 4: Current-State Workflow Mapping

### Workflows To Map

- [ ] Specialist requests records from primary care.
- [ ] Primary care requests records from a specialist.
- [ ] Rehabilitation or post-acute provider requests hospital discharge information.
- [ ] Clinician requests laboratory results from an outside organization.
- [ ] Clinician requests imaging reports and related documents.
- [ ] Patient requests personal records for onward sharing.
- [ ] Patient approves only selected record categories.
- [ ] Patient denies a request.
- [ ] Patient revokes an authorization after approval.
- [ ] Source organization reports that no responsive record exists.
- [ ] Source organization fulfills only part of a request.
- [ ] Request expires before fulfillment.
- [ ] Request is sent to the wrong organization.
- [ ] Patient identity cannot be matched confidently.

### Information To Capture For Each Workflow

- [ ] Trigger for the request
- [ ] Actors and responsibilities
- [ ] Required request fields
- [ ] Authorization requirements
- [ ] Communication channels used
- [ ] Number of handoffs
- [ ] Expected and actual completion time
- [ ] Failure points
- [ ] Escalation process
- [ ] Information-security risks
- [ ] Patient confusion points
- [ ] Source-organization burden
- [ ] Receiving-provider review process
- [ ] Definition of completion

Expected evidence:

- Current-state journey maps
- Swimlane diagrams
- Failure-mode inventory
- Cross-workflow requirements matrix
- Baseline time and effort estimates
- Future-state ClearPath workflow maps

Completion standard:

- At least three interdisciplinary workflows can use one core model without a specialty-specific redesign.

## Research Track 5: Record Category And Data-Minimization Research

- [ ] Determine which record categories are commonly requested across disciplines.
- [ ] Define clear boundaries between conditions, medications, allergies, procedures, laboratory results, imaging reports, treatment notes, provider notes, discharge summaries, and care plans.
- [ ] Identify categories that patients are likely to confuse.
- [ ] Identify categories that may contain mixed or sensitive content.
- [ ] Determine whether category-level authorization is sufficiently precise for Phase I.
- [ ] Determine when item-level authorization may be needed.
- [ ] Identify the minimum necessary information for each test scenario.
- [ ] Define how unrequested information is excluded.
- [ ] Define how attachments containing multiple categories are handled.
- [ ] Define how unavailable, incomplete, or uncertain information is represented.
- [ ] Define how corrected or superseded information is represented.
- [ ] Determine what metadata must accompany every record item.

Expected evidence:

- Record-category taxonomy
- Definitions and examples
- Sensitive-content risk matrix
- Minimum-necessary rules
- Category-to-JSON mapping
- Category-to-human-readable-summary mapping

Completion standard:

- Patients and professionals can distinguish the categories reliably enough to support section-level authorization.

## Research Track 6: Authorization And Consent Comprehension

### Language Research

- [ ] Test the phrase used for the patient action: authorize, approve, allow, release, or share.
- [ ] Test how the purpose of a request should be explained.
- [ ] Test how the requesting and source organizations should be identified.
- [ ] Test explanation of expiration.
- [ ] Test explanation of revocation.
- [ ] Test explanation of partial approval.
- [ ] Test explanation of what happens after approval.
- [ ] Test explanation of what happens after denial.
- [ ] Test warning language for sensitive categories.
- [ ] Test confirmation summaries before submission.

### Comprehension Questions

- [ ] Can the patient identify who is requesting information?
- [ ] Can the patient identify the source organization?
- [ ] Can the patient explain why information is requested?
- [ ] Can the patient identify what will be shared?
- [ ] Can the patient identify what will not be shared?
- [ ] Can the patient find the expiration date?
- [ ] Can the patient explain revocation accurately?
- [ ] Can the patient distinguish approval from acknowledgment?
- [ ] Can the patient recognize when a request includes a sensitive category?

### Interface Variants To Compare

- [ ] Summary-first authorization
- [ ] Category-first authorization
- [ ] Guided step-by-step authorization
- [ ] All-at-once review
- [ ] Final teach-back confirmation
- [ ] Plain-language summary with expandable technical details

Expected evidence:

- Plain-language terminology guide
- Authorization comprehension instrument
- Results by question and participant characteristic
- Error taxonomy
- Revised consent interface
- Final authorization confirmation design

Completion standard:

- At least 80% pass the complete comprehension measure and at least 90% make the section choices required by their assigned scenario, with no unresolved design issue likely to cause unintended sharing.

## Research Track 7: Technical Feasibility

### Request Lifecycle

- [~] Define request statuses and transitions.
- [~] Define record-request, section, event, document, and message schemas.
- [ ] Verify every allowed status transition.
- [ ] Verify that invalid transitions are rejected.
- [ ] Test duplicate request behavior.
- [ ] Test request expiration.
- [ ] Test cancellation.
- [ ] Test patient denial.
- [ ] Test partial approval.
- [ ] Test revocation before and after package generation.
- [ ] Test partial source response.
- [ ] Test source completion and provider review.

### Package Generation

- [~] Define the ClearPath canonical JSON package.
- [ ] Define a formal machine-readable JSON Schema.
- [ ] Generate packages for all-approved requests.
- [ ] Generate packages for partially approved requests.
- [ ] Verify denied sections are absent.
- [ ] Verify unrequested sections are absent.
- [ ] Verify package expiration is represented.
- [ ] Verify consent scope remains linked to package output.
- [ ] Verify deterministic behavior for identical approved input.
- [ ] Verify human-readable output matches JSON content.
- [ ] Verify package checksums detect alteration.
- [ ] Verify a revoked authorization changes package availability appropriately.

### Reliability And Failure Handling

- [ ] Test missing required fields.
- [ ] Test malformed dates and identifiers.
- [ ] Test unavailable source records.
- [ ] Test duplicate documents.
- [ ] Test unsupported file types.
- [ ] Test large documents within defined limits.
- [ ] Test interrupted uploads.
- [ ] Test retry and idempotency behavior.
- [ ] Test concurrent updates.
- [ ] Test stale authorization state.
- [ ] Test audit behavior when an operation fails.

Expected evidence:

- Technical test protocol
- Synthetic test corpus
- Automated test suite
- Pass/fail report
- Defect and remediation log
- Package-validation report
- Authorization-fidelity report

Completion standard:

- Final test suite meets all prespecified authorization, access, audit, integrity, and package-validity thresholds.

## Research Track 8: Synthetic Data And Scenario Design

- [ ] Define a synthetic-patient generation method.
- [ ] Create patients representing varied ages and care histories.
- [ ] Include multiple disciplines and organizations.
- [ ] Include simple and complex medication histories.
- [ ] Include allergies, conditions, procedures, imaging, laboratory, discharge, and care-plan examples.
- [ ] Include conflicting and corrected records.
- [ ] Include missing information.
- [ ] Include mixed-source provenance.
- [ ] Include sensitive-category examples without copying real patient records.
- [ ] Create expected authorization and package outputs for every case.
- [ ] Have a clinical advisor review scenario realism.
- [ ] Confirm that no synthetic fixture was derived from identifiable patient material.

Minimum proposed test corpus:

- 300 end-to-end request cases
- 100 partial-approval cases
- 50 expiration or revocation cases
- 50 unauthorized-access or invalid-transition cases
- At least three interdisciplinary workflow families

Expected evidence:

- Synthetic-data generation specification
- Scenario library
- Expected-results manifest
- Clinical realism review
- Data provenance statement

Completion standard:

- The test corpus covers ordinary, boundary, failure, privacy, and adversarial conditions without using real PHI.

## Research Track 9: Security And Privacy

### Threat Modeling

- [ ] Create a complete data-flow diagram.
- [ ] Identify trust boundaries.
- [ ] Identify stored, transmitted, and displayed sensitive information.
- [ ] Model unauthorized patient access.
- [ ] Model unauthorized provider access.
- [ ] Model cross-organization data leakage.
- [ ] Model account takeover.
- [ ] Model malicious or accidental document upload.
- [ ] Model package alteration.
- [ ] Model replay of expired or revoked access.
- [ ] Model excessive logging of sensitive information.
- [ ] Model insider misuse.
- [ ] Rank threats by likelihood and impact.

### Access-Control Research

- [~] Define patient, provider, staff, administrator, and system roles.
- [~] Define organization-scoped row access.
- [ ] Define controlled patient-decision APIs.
- [ ] Verify least-privilege permissions.
- [ ] Verify unrelated organizations cannot discover requests.
- [ ] Verify source organizations cannot alter requesting-organization metadata.
- [ ] Verify patients cannot alter provider-authored request metadata.
- [ ] Verify audit events cannot be silently rewritten.
- [ ] Verify expired and revoked access is enforced.

### HIPAA And Privacy Planning

- [?] Obtain legal analysis of ClearPath's likely role under HIPAA.
- [?] Determine when ClearPath would be a business associate.
- [?] Review authorization versus treatment-disclosure assumptions.
- [?] Review minimum-necessary requirements and exceptions.
- [?] Review state-law variation and specially protected information.
- [?] Review 42 CFR Part 2 applicability.
- [?] Review BAA requirements.
- [?] Review retention and deletion obligations.
- [?] Review breach-response obligations.
- [?] Review patient access, amendment, and accounting implications.

### Architecture Review

- [ ] Review encryption in transit and at rest.
- [ ] Review field-level encryption design.
- [ ] Review secrets and key management.
- [ ] Review authentication and session handling.
- [ ] Review audit-log design.
- [ ] Review backup and recovery assumptions.
- [ ] Review development and research environment separation.
- [ ] Conduct an external security architecture review.
- [II] Conduct formal production security risk analysis.
- [II] Conduct third-party penetration testing before a real-PHI pilot.

Expected evidence:

- Threat model
- Access-control matrix
- Privacy legal memorandum or consultation summary
- Security architecture report
- Risk register
- Remediation plan
- Phase II security requirements

Completion standard:

- No unresolved critical architecture risk remains, and a credible legal and technical path to a Phase II real-PHI pilot is documented.

## Research Track 10: Interoperability And Data Provenance

### Canonical Model Research

- [~] Define the ClearPath JSON package structure.
- [ ] Define required identifiers and timestamps.
- [ ] Define provenance for every clinical item and document.
- [ ] Define source-organization and source-system representation.
- [ ] Define verification, correction, and supersession metadata.
- [ ] Define schema versioning and backward compatibility.
- [ ] Define unknown, unavailable, and not-applicable values.
- [ ] Define package-level and item-level validation rules.

### Standards Mapping

- [ ] Map the canonical model to relevant FHIR resources.
- [ ] Map core document exchange to C-CDA where appropriate.
- [ ] Evaluate Direct Secure Messaging for Phase II transport.
- [ ] Evaluate TEFCA and QHIN implications for future strategy.
- [ ] Evaluate terminology needs such as SNOMED CT, LOINC, RxNorm, and ICD mappings.
- [ ] Define what information should remain unstructured.
- [ ] Identify licensing or implementation constraints.

### Translation Testing

- [ ] Verify ClearPath JSON export.
- [ ] Verify human-readable PDF-source output.
- [ ] Verify CSV export for appropriate structured content.
- [ ] Create file-based FHIR test fixtures.
- [ ] Create file-based C-CDA test fixtures.
- [ ] Compare translated content against canonical source data.
- [ ] Measure information loss, warnings, and unmapped fields.
- [ ] Define reviewed-import behavior and prohibit silent overwrite.

Expected evidence:

- Canonical data dictionary
- JSON Schema
- Standards mapping document
- Translation test report
- Provenance specification
- Versioning policy
- Phase II integration priority list

Completion standard:

- ClearPath can demonstrate that authorized information remains traceable and understandable through the canonical package and selected file-based translations.

## Research Track 11: Usability And Human Factors

### Provider And Staff Usability

- [ ] Test patient selection.
- [ ] Test request creation.
- [ ] Test category selection.
- [ ] Test source-organization entry.
- [ ] Test purpose and clinical-reason entry.
- [ ] Test request submission.
- [ ] Test status tracking.
- [ ] Test recognition of partial approval.
- [ ] Test package review.
- [ ] Test provenance interpretation.
- [ ] Test denied, revoked, and expired states.
- [ ] Test audit-history discovery.

### Patient Usability

- [ ] Test request notification comprehension.
- [ ] Test requester and source identification.
- [ ] Test approve-all behavior.
- [ ] Test partial approval.
- [ ] Test denial.
- [ ] Test expiration comprehension.
- [ ] Test revocation discovery and comprehension.
- [ ] Test authorization-history review.
- [ ] Test error recovery.

### Measures

- [ ] Critical-task completion rate
- [ ] Time on task
- [ ] Moderator interventions
- [ ] Critical and noncritical error counts
- [ ] Section-selection accuracy
- [ ] Authorization comprehension score
- [ ] Package-interpretation accuracy
- [ ] Standardized usability score
- [ ] Trust and perceived-control rating
- [ ] Expected staff burden

Suggested sample:

- 12-15 patients or caregivers
- 12-15 clinicians
- 12-15 records, referral, or office staff

Expected evidence:

- Usability protocol
- Task scripts
- Moderator guide
- Results dataset
- Error-severity report
- Interface revision log
- Final usability findings

Completion standard:

- At least 85% critical-task completion, at least 90% assigned section-selection accuracy, acceptable comprehension and usability scores, and no unresolved authorization-safety issue.

## Research Track 12: Accessibility, Health Literacy, And Equity

- [ ] Test plain-language reading level.
- [ ] Test keyboard-only navigation.
- [ ] Test screen-reader labeling and reading order.
- [ ] Test color contrast and non-color status indicators.
- [ ] Test zoom and text resizing.
- [ ] Test mobile patient workflows.
- [ ] Test participants with lower digital confidence.
- [ ] Include older adults where appropriate.
- [ ] Include caregivers and dependent-management scenarios.
- [ ] Evaluate language-access and translation needs.
- [ ] Evaluate disability accommodation needs.
- [ ] Evaluate access for users without reliable smartphones or broadband.
- [ ] Identify whether identity-verification requirements create unequal barriers.
- [ ] Review whether granular consent design increases burden for some users.

Expected evidence:

- Accessibility test report
- Health-literacy review
- Equity risk assessment
- Accommodation requirements
- Language-access roadmap
- Inclusive recruitment plan

Completion standard:

- The core patient authorization flow can be used without excluding intended users based on common accessibility, literacy, or device constraints.

## Research Track 13: Clinical Safety And Information Quality

- [ ] Define ClearPath's clinical-use boundary.
- [ ] Confirm the prototype does not diagnose, recommend treatment, or replace clinical judgment.
- [ ] Define how unverified patient-entered information is labeled.
- [ ] Define how provider-reviewed information is labeled.
- [ ] Define how source provenance is displayed.
- [ ] Define how missing and outdated information is communicated.
- [ ] Test whether clinicians can recognize incomplete packages.
- [ ] Test whether users mistake authorization for clinical validation.
- [ ] Test whether human-readable summaries omit material context.
- [ ] Define correction and dispute workflows.
- [ ] Define handling of conflicting records.
- [ ] Identify situations requiring warnings or workflow blocks.
- [ ] Conduct clinical-advisor review of all synthetic scenarios.

Expected evidence:

- Clinical safety boundary document
- Information-quality rules
- Warning and labeling requirements
- Clinical review findings
- Safety-related defect log

Completion standard:

- Representative users correctly understand source, verification status, authorization scope, and completeness limitations.

## Research Track 14: Human Subjects And Research Governance

- [?] Determine whether stakeholder interviews constitute human-subjects research.
- [?] Determine whether usability testing constitutes human-subjects research.
- [?] Obtain an IRB or qualified institutional determination before recruitment.
- [ ] Prepare protocol and research questions.
- [ ] Prepare inclusion and exclusion criteria.
- [ ] Prepare recruitment materials.
- [ ] Prepare informed-consent materials.
- [ ] Prepare participant-compensation plan.
- [ ] Prepare privacy and recording procedures.
- [ ] Prepare data-management and sharing plan.
- [ ] Prepare adverse-event or participant-distress procedures if applicable.
- [ ] Define study IDs and identity separation.
- [ ] Define research-data retention and destruction.
- [ ] Define protocol-deviation handling.
- [ ] Train research personnel.
- [ ] Maintain enrollment and consent records.
- [ ] Document exclusions, withdrawals, and missing data.

Expected evidence:

- Formal IRB or institutional determination
- Approved protocol and participant materials
- Research operations manual
- Data-management plan
- Training records
- Study documentation archive

Completion standard:

- No participant research begins until the required determination or approval is documented.

## Research Track 15: Commercialization And Adoption

### Buyer And Customer Research

- [ ] Identify likely initial customer segments.
- [ ] Determine who experiences the problem and who controls purchasing.
- [ ] Interview independent practices, specialty groups, and care-transition organizations.
- [ ] Estimate current administrative cost of record-request workflows.
- [ ] Identify willingness to pay.
- [ ] Compare subscription, per-request, and organization-based pricing.
- [ ] Identify procurement, contracting, BAA, and security-review requirements.
- [ ] Identify minimum product capabilities required for purchase.
- [ ] Identify integration expectations.
- [ ] Identify implementation and training expectations.
- [ ] Identify sales-cycle length and decision-makers.

### Competitive Research

- [ ] Identify direct competitors.
- [ ] Identify EHR-native alternatives.
- [ ] Identify HIE, release-of-information, patient-access, referral, and document-exchange alternatives.
- [ ] Compare authorization control, interoperability, auditability, price, and customer focus.
- [ ] Identify ClearPath's defensible differentiation.
- [ ] Identify patent, trademark, licensing, or freedom-to-operate questions requiring counsel.

### Adoption Research

- [ ] Measure perceived usefulness.
- [ ] Measure perceived workflow burden.
- [ ] Identify trust barriers.
- [ ] Identify implementation barriers.
- [ ] Identify reasons organizations would reject a pilot.
- [ ] Identify evidence required for a purchasing decision.
- [ ] Obtain pilot-interest letters.

Expected evidence:

- Market segmentation report
- Competitive landscape
- Buyer interview findings
- Preliminary pricing hypothesis
- Adoption barrier matrix
- Commercialization milestones
- Pilot letters of support or interest

Completion standard:

- A defined initial market exists, likely buyers confirm the problem, and at least two organizations express documented interest in a Phase II pilot.

## Research Track 16: Phase II Pilot Design

- [II] Select two or more pilot organizations from different disciplines.
- [II] Define real-world use cases and enrollment limits.
- [II] Complete legal agreements and BAAs.
- [II] Complete production HIPAA security risk analysis.
- [II] Complete penetration testing and remediation.
- [II] Complete production monitoring and incident-response setup.
- [II] Complete live integration validation.
- [II] Rehearse the workflow with synthetic records at each site.
- [II] Define request completion-time measures.
- [II] Define staff-time and administrative-burden measures.
- [II] Define patient approval, partial-approval, denial, and revocation measures.
- [II] Define package completeness and provider-satisfaction measures.
- [II] Define implementation fidelity.
- [II] Define support and escalation procedures.
- [II] Monitor safety, privacy, and workflow incidents.
- [II] Compare pilot outcomes against baseline workflows.

Expected evidence:

- Phase II protocol
- Site agreements
- Security-readiness package
- Implementation plan
- Baseline measurements
- Pilot outcome report
- Commercial-scale requirements

Completion standard:

- Phase II can evaluate real-world workflow performance without exposing participants or organizations to unaddressed legal, privacy, or security risk.

## Research Track 17: Analysis And Reporting

- [ ] Prespecify primary outcomes.
- [ ] Prespecify secondary and exploratory outcomes.
- [ ] Finalize sample-size rationale.
- [ ] Define missing-data handling.
- [ ] Define quantitative analysis methods.
- [ ] Define qualitative coding methods.
- [ ] Use a second reviewer for a meaningful subset of qualitative data.
- [ ] Distinguish critical authorization errors from ordinary usability errors.
- [ ] Preserve failed technical cases for regression testing.
- [ ] Maintain a research decision log.
- [ ] Maintain a product revision log tied to evidence.
- [ ] Document deviations from the research plan.
- [ ] Produce an Aim 1 workflow report.
- [ ] Produce an Aim 2 technical feasibility report.
- [ ] Produce an Aim 3 usability and comprehension report.
- [ ] Produce the final Phase I feasibility report.
- [ ] Document the Phase II go/no-go decision.
- [ ] Prepare publications or presentations where appropriate.

Expected evidence:

- Analysis plan
- Clean research dataset
- Qualitative codebook
- Statistical output
- Findings reports
- Decision and revision logs
- Final feasibility report

Completion standard:

- Every grant conclusion can be traced to a defined method, result, and retained research record.

## Research Materials To Create

- [ ] Literature-review protocol
- [ ] Evidence table
- [ ] Stakeholder recruitment matrix
- [ ] Interview guide
- [ ] Workflow-mapping template
- [ ] Participant screener
- [ ] Informed-consent form
- [ ] Moderator guide
- [ ] Patient usability task script
- [ ] Provider usability task script
- [ ] Staff usability task script
- [ ] Authorization comprehension questionnaire
- [ ] Trust and perceived-control questionnaire
- [ ] Standardized usability questionnaire
- [ ] Synthetic patient profiles
- [ ] Synthetic record-request scenarios
- [ ] Expected package-output manifests
- [ ] Technical test protocol
- [ ] Security threat model
- [ ] Access-control matrix
- [ ] Data dictionary
- [ ] JSON Schema
- [ ] Data-management and sharing plan
- [ ] Statistical analysis plan
- [ ] Qualitative codebook
- [ ] Research decision log
- [ ] Product revision log
- [ ] Phase II pilot protocol

## Proposed Research Sequence

### Before Submission

1. Select the funding opportunity and institute.
2. Complete focused literature and competitive reviews.
3. Speak with the program officer.
4. Recruit advisors and potential research partners.
5. Obtain letters of support.
6. Finalize aims, methods, milestones, facilities, and budget.
7. Decide the IRB or institutional-review path.

### Phase I Months 1-2

1. Finalize protocol and analysis plan.
2. Obtain required human-subjects determination or approval.
3. Build research materials and synthetic scenarios.
4. Finalize the security and data-management plans.

### Phase I Months 2-4

1. Conduct literature updates and stakeholder interviews.
2. Map current workflows.
3. Finalize categories, terminology, and prototype requirements.

### Phase I Months 3-7

1. Build the prototype.
2. Construct the synthetic test corpus.
3. Execute authorization, access, audit, integrity, and reliability tests.
4. Conduct security architecture review.

### Phase I Months 7-11

1. Conduct usability round one.
2. Correct critical problems.
3. Conduct usability round two with new participants.
4. Complete buyer and pilot-readiness interviews.

### Phase I Month 12

1. Analyze results.
2. Evaluate every go/no-go criterion.
3. Write the final feasibility report.
4. Finalize the Phase II pilot protocol and commercialization plan.

## Phase I Go/No-Go Evidence

ClearPath should advance to a Phase II real-world pilot proposal only when research supports all of the following:

- [ ] One universal workflow supports at least three interdisciplinary scenarios.
- [ ] Final technical tests show no disclosure of denied or unauthorized sections.
- [ ] Unauthorized-role and cross-organization access tests meet the prespecified threshold.
- [ ] Audit and integrity tests meet the prespecified threshold.
- [ ] Patients meet section-selection and comprehension thresholds.
- [ ] Providers and staff meet critical-task and package-interpretation thresholds.
- [ ] No unresolved interface issue creates a meaningful authorization risk.
- [ ] No unresolved critical security architecture issue remains.
- [ ] Privacy and legal advisors identify a feasible path to a live pilot.
- [ ] At least two organizations express documented Phase II pilot interest.
- [ ] The commercial research supports a credible initial customer and purchasing path.

## Evidence Register

For each completed research activity, record:

- Research activity ID
- Research question
- Responsible person
- Start and completion dates
- Participants or test cases
- Protocol or method version
- Data location
- Analysis location
- Main result
- Whether the milestone passed
- Product or grant decision produced
- Remaining limitations
- Follow-up required

This register should become the traceable record connecting research, product decisions, grant reporting, and Phase II planning.
