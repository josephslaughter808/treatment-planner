# NLM Program Officer Feedback Response Plan

## Date

July 6, 2026

## Context

Goutham Reddy, MD, MS responded to the ClearPath concept inquiry and indicated that the project appears potentially relevant to NLM's mission in several biomedical informatics areas, including patient-mediated health information exchange, clinical data interoperability, structured clinical information models, clinical workflow integration, data provenance, and usability of health information systems.

He also gave important framing guidance: the application should emphasize underlying informatics research and technical innovation rather than primarily presenting ClearPath as a software product. He specifically noted that reviewers will likely want to understand how the clinical information model relates to existing interoperability standards, such as HL7 FHIR, and what novel capabilities ClearPath provides.

This document converts that feedback into application-development tasks.

## Plain-Language Meaning

The program officer is not saying, "Build the app and ask NIH to pay for it."

He is saying:

"This may fit NLM, but the grant must explain the informatics research contribution. Show how ClearPath advances patient-mediated exchange, consent-aware sharing, interoperability, provenance, and usability. Explain how it relates to FHIR and existing standards."

That should guide every grant document.

## Main Strategic Shift

### Weak Framing

ClearPath is an app that lets patients share medical records with doctors.

### Strong NLM Framing

ClearPath is a consent-aware, provenance-preserving biomedical informatics platform that tests a patient-mediated model for structured clinical information exchange across disconnected care settings.

The prototype is how we test the model. The research contribution is the computable workflow, information model, authorization fidelity, provenance representation, standards mapping, and usability evidence.

## Application Changes Required

### 1. Rewrite Specific Aims Around Informatics Research

Status: started in `specific-aims-v1-nlm-sbir.md`.

Required changes:

- Lead with the informatics problem, not the product.
- Use "patient-mediated clinical information exchange" consistently.
- Emphasize consent-aware data sharing.
- Emphasize provenance and structured clinical information models.
- Include FHIR positioning in Aim 1.
- Include deterministic authorization testing in Aim 2.
- Include usability and workflow fit in Aim 3.

### 2. Define The Novel Technical Contribution

Working novelty statement:

ClearPath's novelty is a patient-mediated, consent-scoped exchange package that binds clinical content to authorization scope, provenance, status, audit events, and human-readable review in a workflow designed for disconnected interdisciplinary care settings.

This should be sharpened into one paragraph for:

- Specific Aims
- Research Strategy Innovation section
- Project Summary
- Program officer follow-up
- Future investor materials

### 3. Position ClearPath JSON Relative To FHIR

Status: started in `clearpath-fhir-and-json-positioning.md`.

Required changes:

- Stop describing JSON as the reason the platform can connect to every language.
- Explain that ClearPath JSON is the internal package and workflow model.
- Explain that FHIR is an existing interoperability standard ClearPath will map to and eventually integrate with.
- Identify relevant FHIR resources.
- Preserve ClearPath-specific consent/provenance/workflow fields.
- Avoid claiming full EHR integration in Phase I.

### 4. Rework The Phase I Research Plan

Target document: `nih-phase-one-research-plan.md`.

Needed revisions:

- Add the phrase "underlying informatics research and technical innovation" to the framing section.
- Add a subsection on program-officer feedback.
- Reframe the central research question around consent-aware patient-mediated exchange.
- Add a FHIR and standards-positioning section.
- Make sure each aim has measurable feasibility milestones.
- Keep Phase I focused on synthetic or de-identified data unless NLM or advisors recommend otherwise.

### 5. Update The Funding Path Research

Target document: `funding-path-research/nlm/nlm-deep-dive.md`.

Needed revisions:

- Add the July 6 NLM program feedback.
- Document Dr. Reddy as the current program contact for clinical informatics fit discussion.
- Keep NLM as the primary path.
- Note that the SBIR portfolio role is transitioning, so future contact routing may change.

### 6. Prepare A Follow-Up Package For NLM

Do not send immediately. Send after we revise Specific Aims.

Package should include:

- One-page Specific Aims draft
- Short FHIR/ClearPath JSON positioning summary
- Three focused questions

Potential follow-up questions:

1. Does this revised framing sufficiently emphasize informatics research rather than product development?
2. Is the ClearPath JSON/FHIR positioning appropriate for Phase I, or should the application include a deeper FHIR implementation component?
3. Should the Phase I user evaluation be framed as human factors/usability research, human subjects research, or potentially clinical-trial-related under NIH definitions?

## Grant Language Rules Going Forward

### Use These Phrases

- Biomedical informatics
- Patient-mediated health information exchange
- Consent-aware data sharing
- Consent-scoped package generation
- Structured clinical information model
- Clinical workflow integration
- Data provenance
- Source attribution
- Authorization fidelity
- Interdisciplinary care coordination
- Standards-aware mapping
- HL7 FHIR positioning
- Usability of health information systems

### Avoid These Phrases

- Medical app
- Records app
- Better patient portal
- JSON connects every language
- Universal EHR integration in Phase I
- HIPAA-compliant app as the main innovation
- Build the software
- Fully comprehensive medical passport without research framing

## Risk Register

| Risk | Why It Matters | Response |
| --- | --- | --- |
| Reviewers see ClearPath as routine software development. | SBIR requires research and technical innovation. | Lead with informatics model, standards positioning, authorization fidelity, and usability research. |
| Reviewers think ClearPath ignores FHIR. | Existing standards cannot be hand-waved. | Explicitly map ClearPath JSON to FHIR resources and explain internal vs external roles. |
| The novelty sounds like "medical records in JSON." | That is not enough. | Define novelty as consent/provenance/workflow binding and patient-mediated exchange. |
| The user study is too vague. | Reviewers need rigorous methods. | Define tasks, measures, thresholds, participants, and analysis. |
| Team lacks research credentials. | Reviewers judge investigator capability. | Add informatics, clinical, human-factors, privacy/security, and statistics advisors. |
| Phase I scope tries to do too much. | Overpromising weakens feasibility. | Use synthetic/de-identified data and defer production EHR integrations to Phase II. |
| Legal/HIPAA work consumes the proposal. | Compliance is necessary but not the research contribution. | Include security/privacy planning while keeping informatics research central. |

## Immediate To-Do List

- [x] Create a revised Specific Aims draft centered on informatics research.
- [x] Create a FHIR/ClearPath JSON positioning document.
- [x] Create this response plan.
- [ ] Revise `nih-phase-one-research-plan.md` with the new NLM framing.
- [ ] Revise `funding-path-research/nlm/nlm-deep-dive.md` with July 6 program feedback.
- [ ] Build a one-page NLM follow-up packet.
- [ ] Identify one informatics advisor candidate.
- [ ] Identify one clinician workflow advisor candidate.
- [ ] Identify one human-factors/usability advisor candidate.
- [ ] Identify one privacy/security advisor candidate.

## Recommended Next Move

Revise the broader NIH research plan next, then create a polished one-page Specific Aims PDF or Word document suitable for another NLM follow-up.
