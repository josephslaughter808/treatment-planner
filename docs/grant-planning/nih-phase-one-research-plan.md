# NIH Phase I Research Plan

## Working Purpose

This document converts the ClearPath product roadmap into a research and development plan suitable for discussion with an NIH program officer, grant manager, research advisor, or SBIR consultant.

It is a planning draft, not a completed NIH application. The final structure, page limits, institute fit, human-subjects designation, and required attachments must be checked against the specific Notice of Funding Opportunity (NOFO) used for submission.

## NIH Framing

NIH Phase I should not be presented as funding to finish an ordinary software product. The application should identify important technical and scientific uncertainties and show how Phase I research will determine whether the proposed approach is feasible.

The current NIH SBIR/STTR application guide asks Phase I applicants to:

- State the technical questions that will determine feasibility.
- Define the process or service ultimately being developed.
- Include clear, measurable milestones for each aim.
- Organize the Research Strategy under Significance, Innovation, and Approach.
- Explain methods, analysis, potential problems, alternative strategies, and benchmarks for success.
- Explain potential for a marketable product or service.

Official planning references:

- [NIH SBIR/STTR Application Guide](https://grants.nih.gov/grants/how-to-apply-application-guide/forms-i/sbir-sttr-forms-i.pdf)
- [NIH Human Subjects Research](https://grants.nih.gov/policy-and-compliance/policy-topics/human-subjects)
- [NIH Small Business Programs](https://seed.nih.gov/small-business-funding)

## Product Being Researched

ClearPath is a patient-controlled, interdisciplinary health information request and exchange platform.

The proposed service allows:

1. A healthcare organization to request specific records from another organization.
2. The patient to see who is requesting information, what is requested, and why.
3. The patient to approve all requested sections, approve selected sections, deny the request, or revoke authorization.
4. ClearPath to produce a consent-scoped canonical JSON package containing only authorized information.
5. Authorized staff to review a human-readable package and its provenance.
6. The system to create an auditable history of the request, decision, exchange, review, and revocation.

The Phase I prototype should be tested with synthetic records. It should not require production EHR connections or real protected health information (PHI).

## Central Research Question

Can a patient-controlled, section-level authorization workflow produce an accurate, understandable, efficient, and auditable method for exchanging selected health information across organizations and clinical disciplines?

## Central Hypothesis

A specialty-neutral request workflow combined with plain-language patient authorization and deterministic consent-scoped package generation will:

- Let patients accurately understand and control what is released.
- Let providers and staff complete common request and review tasks with limited training.
- Prevent unapproved record categories from appearing in generated packages.
- Preserve sufficient provenance and audit information for clinical and operational review.

Phase I is intended to establish feasibility, not to prove improved patient outcomes or nationwide interoperability.

## Technical Questions Phase I Must Answer

1. Can one request model represent common cross-disciplinary record requests without specialty-specific redesign?
2. Can patients correctly understand the requesting party, purpose, requested sections, expiration, and consequences of approval or denial?
3. Can patients reliably approve selected sections rather than being forced into an all-or-nothing release?
4. Can the system generate a package containing exactly the authorized sections and no unauthorized sections?
5. Can provenance, authorization scope, expiration, integrity, and audit events remain linked throughout the request lifecycle?
6. Can providers and records staff create, track, and review requests without excessive time or training?
7. Can the ClearPath JSON model support several clinical scenarios and produce useful human-readable output?
8. What workflow, privacy, trust, and adoption barriers must be solved before a Phase II live pilot?

## Proposed Specific Aims

### Aim 1: Define And Validate The Interdisciplinary Workflow Model

Develop and evaluate a specialty-neutral model for interoffice record requests, patient authorization, source-organization response, and provider review.

Research activities:

- Conduct semi-structured interviews with patients, caregivers, clinicians, records staff, office managers, and interoperability experts.
- Map current request workflows, delays, handoffs, failure points, and consent practices.
- Compare needs across at least three cross-disciplinary scenarios.
- Identify the minimum information required at each stage of a request.
- Test terminology and plain-language authorization explanations.
- Convert findings into workflow requirements, status definitions, and interface revisions.

Proposed scenarios:

- Specialist requests relevant primary care records.
- Rehabilitation provider requests hospital discharge records.
- Treating clinician requests laboratory and imaging reports from separate organizations.
- Patient restricts release of an unrelated sensitive category.

Primary feasibility questions:

- Does the model cover the major steps and exceptions reported by participants?
- Can participants understand each actor's responsibility?
- Are request status labels and authorization choices interpreted consistently?

Proposed participants:

- 8-10 patients or caregivers
- 8-10 clinicians across multiple disciplines
- 8-10 office, health information management, or records staff
- 4-6 health IT, privacy, or interoperability experts

Proposed total: approximately 28-36 participants.

Aim 1 milestones:

- At least three interdisciplinary workflows are documented.
- At least 80% of critical workflow requirements are shared across scenarios or supported through configurable fields.
- No critical workflow step requires a specialty-specific data model.
- The team produces a finalized request state model, record-category taxonomy, and plain-language terminology guide.
- Major disagreements and unresolved workflow risks are documented for Aim 2 and Phase II.

### Aim 2: Establish Technical Feasibility And Authorization Fidelity

Build and verify the working prototype using synthetic patient records and predetermined authorization scenarios.

Research activities:

- Implement the record-request data model and lifecycle.
- Implement provider request creation and status tracking.
- Implement patient approval, partial approval, denial, expiration, and revocation.
- Generate consent-scoped ClearPath JSON packages.
- Generate human-readable package summaries.
- Record provenance, timestamps, authorization scope, integrity checks, and audit events.
- Create automated synthetic test cases covering common and adversarial workflow conditions.
- Conduct a security architecture and threat-model review.

Synthetic test conditions should include:

- Approval of every requested section
- Approval of selected sections
- Denial of every section
- Revocation after approval
- Expired authorization
- Missing or unavailable source records
- Duplicate request submission
- Invalid status transition
- Attempted access by an unrelated organization
- Mixed-source documents with different provenance
- Package regeneration after a patient decision changes
- Corrupted or altered package payload

Primary technical outcomes:

- Authorization fidelity: whether generated packages contain exactly the allowed sections.
- Disclosure prevention: whether denied or unrequested sections are absent.
- Lifecycle correctness: whether only permitted status transitions occur.
- Audit completeness: whether required events are recorded in order.
- Package validity: whether output conforms to the ClearPath schema.
- Integrity verification: whether altered packages are detected.
- Access isolation: whether unauthorized roles and organizations are blocked.

Proposed technical test set:

- At least 300 synthetic end-to-end request cases
- At least 100 partial-approval cases
- At least 50 expiration or revocation cases
- At least 50 unauthorized-access or invalid-transition cases
- At least three interdisciplinary clinical scenarios

Aim 2 milestones:

- 100% of tested packages exclude sections the patient denied or did not authorize.
- At least 99% of valid synthetic requests generate schema-valid packages without manual correction.
- 100% of required lifecycle events are represented in the audit trail in the final test suite.
- 100% of altered test packages fail integrity verification.
- 100% of defined unauthorized-role test cases are rejected.
- No unresolved critical-risk finding remains after the Phase I security architecture review.

The 100% authorization and access-control thresholds are appropriate because accidental disclosure cannot be treated as an acceptable average usability error. Any failure should trigger root-cause analysis, correction, and full regression testing.

### Aim 3: Evaluate Usability, Comprehension, Trust, And Workflow Fit

Evaluate whether representative users can complete the core workflow and accurately understand the authorization and package-review experience.

Research activities:

- Conduct moderated task-based usability sessions using synthetic records.
- Ask providers or staff to create and track requests.
- Ask patients to interpret requests and make section-level authorization decisions.
- Ask providers or staff to review a generated package and identify its source, scope, and expiration.
- Measure task success, errors, completion time, comprehension, usability, and trust.
- Conduct short post-task interviews about adoption barriers and perceived risk.

Proposed usability participants:

- 12-15 patients or caregivers
- 12-15 clinicians
- 12-15 office, records, or care-coordination staff

Proposed total: approximately 36-45 participants. Some Aim 1 participants may return, but a portion should be new users who have not already learned the interface.

Patient tasks:

- Identify the requesting organization and provider.
- Explain why the information is being requested.
- Identify which record categories are requested.
- Approve every requested section.
- Approve only assigned sections in a scenario.
- Deny a request.
- Find the request expiration date.
- Locate the revocation control and explain its effect.

Provider and staff tasks:

- Create a request for a known patient.
- Select appropriate record categories.
- State the purpose and source organization.
- Find a pending request.
- Determine whether the patient approved all or selected sections.
- Review package provenance and authorization scope.
- Identify an expired, denied, or revoked request.
- Find the audit history.

Primary usability outcomes:

- Critical-task completion rate
- Section-selection accuracy
- Authorization comprehension score
- Median time on task
- Critical and noncritical error counts
- System Usability Scale or comparable standardized usability score
- Provider package-interpretation accuracy
- Patient trust and perceived control rating
- Staff-reported workflow fit and expected burden

Aim 3 milestones:

- At least 85% of participants complete each critical workflow without moderator intervention.
- At least 90% of patient participants select the sections required by the assigned scenario correctly.
- At least 80% of patient participants correctly answer the core authorization comprehension questions.
- At least 85% of provider and staff participants correctly identify package source, scope, status, and expiration.
- Mean System Usability Scale score is at least 75, or the selected validated instrument meets its prespecified acceptable threshold.
- No unresolved interface issue creates a reasonable risk of unintended authorization.
- The team documents a Phase II pilot protocol and a ranked list of required changes.

## Research Setting: Where The Work Will Occur

The application should name actual locations and partners once they are confirmed. A credible Phase I structure could use:

### Coordinating And Development Site

ClearPath's business or development location will coordinate:

- Protocol development
- Software development
- Synthetic-data generation
- Technical testing
- Data management
- Analysis
- Reporting

The application must provide the actual address, facilities, computing resources, security controls, and personnel available at this site.

### Simulated Clinical Workflow Sites

Recruit two or three partner organizations representing different disciplines. Phase I participation can consist of interviews and prototype simulations without connecting to production systems or using real patient records.

Preferred partner mix:

- One primary care organization
- One specialty practice
- One hospital-affiliated transition, rehabilitation, behavioral health, laboratory, or imaging setting

Letters of support should explain:

- Why the problem matters at that organization
- Which personnel may participate
- Whether the organization can support interviews or usability sessions
- That Phase I will use synthetic or approved de-identified examples
- Interest in considering a properly secured Phase II pilot

### Patient Research Setting

Patient and caregiver research can occur:

- Remotely through moderated sessions
- In a private room at a partner site
- Through a contracted usability research facility

The application should explain accessibility, privacy, recording procedures, compensation, consent, and secure handling of research data.

## Experimental Design

### Phase 1: Formative Discovery

Methods:

- Semi-structured interviews
- Current-state workflow mapping
- Critical-incident questions
- Terminology and consent-language review
- Thematic analysis

Outputs:

- Workflow maps
- Requirements matrix
- Record-category taxonomy
- Request-state model
- Risk and exception inventory
- Revised prototype requirements

### Phase 2: Prototype Construction And Verification

Methods:

- Iterative software development
- Schema validation
- Automated unit and integration tests
- Synthetic end-to-end request simulations
- Access-control tests
- Threat modeling
- External security architecture review

Outputs:

- Working prototype
- Synthetic test corpus
- Test results and defect log
- Authorization-fidelity report
- Threat model and remediation report

### Phase 3: Usability And Comprehension Evaluation

Methods:

- Moderated task-based sessions
- Think-aloud protocol where appropriate
- Structured comprehension questions
- Standardized usability questionnaire
- Post-session interview
- Interface revision between testing rounds

Suggested rounds:

- Round 1: 5-7 participants per user group
- Revision period
- Round 2: 7-8 participants per user group

This staged design lets the team correct severe usability problems before evaluating the revised workflow.

## Data Collection

Collect only data necessary to answer the research questions.

Possible research data:

- Participant role and broad practice characteristics
- General demographic variables needed to assess usability across intended users
- Task completion and error data
- Time on task
- Comprehension responses
- Usability and trust ratings
- Interview notes or recordings, if approved
- Coded qualitative themes
- Prototype event logs linked to study IDs rather than identities
- Synthetic request and package test results

Do not collect:

- Real medical records
- Patient chart numbers
- Unnecessary employer identifiers
- Screenshots containing real PHI
- Participant information unrelated to the research aims

## Analysis Plan

### Quantitative Analysis

Use descriptive statistics appropriate for a Phase I feasibility study:

- Counts and percentages for task completion and comprehension
- Means or medians for completion time and usability scores
- Confidence intervals for primary feasibility proportions where appropriate
- Error rates by user group and task
- Comparison of first and second usability rounds as exploratory evidence
- Technical pass/fail rates with exact failure investigation

The study is not intended to establish clinical effectiveness. Sample sizes should be justified for feasibility, usability problem discovery, and estimation rather than powered claims about health outcomes.

### Qualitative Analysis

- Develop a codebook tied to the research questions.
- Code interview and usability observations systematically.
- Use a second reviewer for a meaningful subset of transcripts or notes.
- Resolve coding disagreements and document changes to the codebook.
- Identify common themes, discipline-specific differences, safety concerns, and adoption barriers.
- Maintain an audit trail connecting findings to product revisions.

### Mixed-Methods Interpretation

Combine quantitative and qualitative findings. For example, a successful task-completion percentage should not conceal confusion that could cause unintended disclosure in real use.

## Rigor And Bias Controls

- Prespecify primary outcomes and success thresholds before final testing.
- Use standardized task scripts and synthetic scenarios.
- Include new participants in final testing to reduce learning effects.
- Recruit across more than one clinical discipline.
- Include participants with varied health literacy, accessibility needs, age, and comfort with technology.
- Separate critical authorization errors from ordinary interface errors.
- Record all exclusions and incomplete sessions.
- Preserve failed technical test cases and regression-test every correction.
- Distinguish exploratory findings from prespecified feasibility outcomes.
- Have someone other than the primary interface designer moderate or independently review a subset of sessions where practical.

## Human Subjects And IRB Planning

Interviews and usability studies may constitute human-subjects research when they are a systematic investigation involving living individuals and are designed to produce generalizable knowledge. Using synthetic medical records does not automatically make participant research exempt or non-human-subjects research.

Before recruitment:

1. Ask the selected NIH institute or program officer how the proposed work should be characterized.
2. Obtain a formal determination from an IRB or qualified institutional official.
3. Do not self-declare the project exempt.
4. Complete the NIH PHS Human Subjects and Clinical Trials Information requirements applicable to that determination.
5. Prepare consent, recruitment, privacy, compensation, and data-security materials.

The software can be developed and tested internally with synthetic data while this determination is pending, but no participant research should begin without the required determination or approval.

## Privacy And Security Research

Phase I should study security feasibility without claiming production HIPAA readiness.

Required activities:

- Data-flow diagram
- Threat model
- Role and organization access matrix
- Authorization-state transition review
- Logging and audit requirements
- Encryption and key-management architecture review
- Package-integrity testing
- Revocation and expiration behavior testing
- Unauthorized-access test cases
- Secure research-data handling plan
- External security architecture consultation

Full production penetration testing can remain a Phase II activity, but high-risk prototype functions must still receive automated security testing and architectural review in Phase I.

## Potential Problems And Alternative Strategies

### Recruitment Is Slow

Alternative:

- Use professional associations, patient advisory groups, remote research panels, and partner-site staff.
- Add recruitment sites while preserving the same eligibility criteria and protocol.

### Workflow Needs Differ By Discipline

Alternative:

- Keep a universal request core and represent variation through configurable categories, optional fields, and adapters.
- Do not fork the platform into separate specialty products unless research shows a true structural requirement.

### Patients Misunderstand Partial Authorization

Alternative:

- Test summary-first, section-first, and guided-review designs.
- Add a final teach-back screen showing exactly what will and will not be shared.
- Repeat testing after revision before declaring feasibility.

### Package Review Is Too Complex

Alternative:

- Separate the human-readable clinical summary from the machine-readable package.
- Use progressive disclosure for provenance and technical details.

### Technical Tests Reveal Unauthorized Disclosure

Alternative:

- Stop advancement of the affected workflow.
- Perform root-cause analysis, correct the scoping logic, and rerun the complete authorization regression suite.
- Treat any unresolved disclosure failure as a Phase I no-go result.

### EHR Integration Is Needed Earlier Than Expected

Alternative:

- Use file-based FHIR, C-CDA, PDF, or CSV fixtures.
- Validate translation and review behavior without direct production connectivity.
- Reserve vendor contracting and live integration for Phase II.

## Phase I Go/No-Go Criteria

ClearPath should proceed to a Phase II live-pilot proposal only if:

1. The universal workflow model supports at least three interdisciplinary scenarios.
2. All denied or unauthorized sections are excluded in the final technical test suite.
3. Access-control and integrity tests meet their prespecified thresholds.
4. Patients meet the section-selection and comprehension milestones.
5. Providers and staff meet critical-task and package-interpretation milestones.
6. No unresolved interface problem creates a meaningful risk of unintended authorization.
7. No unresolved critical security architecture risk remains.
8. At least two clinical organizations express documented interest in Phase II pilot participation.
9. A qualified legal/privacy review identifies a feasible path to a real-PHI pilot.

Failure of a safety-critical criterion should produce a redesign or no-go decision, not a relaxed threshold after results are known.

## Proposed 12-Month Research Timeline

### Months 1-2: Protocol And Research Setup

- Confirm NIH institute and NOFO fit.
- Finalize aims and outcomes.
- Confirm research sites and advisors.
- Prepare IRB or institutional determination materials.
- Create interview guides and synthetic scenarios.
- Finalize architecture and data-management plans.

### Months 2-4: Aim 1 Discovery

- Recruit stakeholder participants.
- Conduct interviews and workflow mapping.
- Analyze formative findings.
- Finalize request taxonomy and lifecycle.
- Revise prototype requirements.

### Months 3-7: Aim 2 Prototype And Technical Research

- Build request, authorization, package, and audit workflows.
- Create synthetic records and test cases.
- Execute technical verification.
- Conduct security architecture review.
- Correct defects and rerun regression tests.

### Months 7-9: Aim 3 Usability Round 1

- Conduct first usability round.
- Analyze critical errors and comprehension issues.
- Revise interface and language.

### Months 9-11: Aim 3 Usability Round 2

- Test revised prototype with new participants.
- Complete outcome analysis.
- Conduct adoption and Phase II readiness interviews.

### Month 12: Reporting And Phase II Planning

- Finalize feasibility results.
- Document go/no-go decisions.
- Prepare Phase II pilot protocol.
- Update commercialization and regulatory plans.
- Prepare publications, presentations, or grant reports as required.

## Expected Phase I Outputs

- Validated interdisciplinary request workflow
- Patient authorization terminology guide
- Record-request schema and status model
- Working synthetic-data prototype
- Consent-scoped ClearPath JSON specification
- Human-readable package-review design
- Synthetic test corpus
- Authorization-fidelity and access-control results
- Usability and comprehension findings
- Threat model and security architecture review
- Human-subjects or IRB determination and study documentation
- Phase II pilot protocol
- Partner letters or expressions of interest
- Updated commercialization plan

## Research Team Needed

Minimum roles:

- Founder/Principal Investigator: project leadership, stakeholder relationships, product direction, and grant reporting
- Technical lead: architecture, implementation, technical testing, and documentation
- Clinical workflow advisor: interdisciplinary workflow validity and clinical interpretation
- Human factors or UX researcher: protocol design, moderation, usability measurement, and analysis
- Biostatistics or research-methods advisor: outcomes, sample justification, and analysis review
- Privacy/HIPAA counsel or advisor: authorization and data-sharing review
- Security architect: threat modeling and architecture review
- Interoperability advisor: canonical model, provenance, FHIR/C-CDA strategy, and Phase II integration planning

One person may cover more than one part-time advisory role, but the application should show that the team can perform research, not only software development.

## Immediate Preparation Checklist

1. Confirm the intended NIH institute and funding announcement.
2. Ask the program officer whether this scope is responsive to the announcement.
3. Identify a research-methods or human-factors collaborator.
4. Recruit two or three discipline-diverse clinical partners.
5. Obtain letters of support.
6. Decide who will provide IRB review or a formal determination.
7. Finalize three specific aims and measurable milestones.
8. Create the synthetic scenario and test-case library.
9. Define the data-management and analysis plan.
10. Build the record-request prototype needed to run the research.

## Working One-Paragraph Research Summary

ClearPath will evaluate the feasibility of a patient-controlled, interdisciplinary health information request and exchange platform. Phase I research will first define a specialty-neutral workflow through interviews and workflow mapping with patients, clinicians, records staff, and interoperability experts. The project will then build and technically verify a synthetic-data prototype that routes record requests through section-level patient authorization and generates consent-scoped JSON and human-readable packages with provenance and audit history. Finally, task-based usability studies will evaluate authorization comprehension, section-selection accuracy, critical-task completion, package interpretation, trust, and workflow fit. Prespecified technical and usability milestones will determine whether ClearPath is ready for a Phase II secure pilot using real clinical partners and appropriately protected health information.
