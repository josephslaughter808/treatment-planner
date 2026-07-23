# ClearPath New Chat Handoff Summary

## Purpose

This document is a handoff note for starting a new Codex or ChatGPT conversation without losing the project context. It summarizes what has happened, why key decisions were made, what is currently pending, and what the next chat should help with.

## Current Project Identity

ClearPath Care is no longer being treated as a dental software product. The project direction changed to an interdisciplinary medical communication platform focused on patient-mediated clinical information exchange.

The core idea is:

- A provider requests specific outside records from another office or care setting.
- The request is routed through the patient.
- The patient can approve all, approve selected sections, deny, revoke, or let the request expire.
- ClearPath generates a structured, consent-scoped clinical information package.
- The package preserves source, status, consent, provenance, audit history, and human-readable review.

The product should be described as an interoffice and interdisciplinary medical communication platform, not as a dental app, not as a replacement EHR, and not as an ordinary medical records app.

## Why This Matters

The founder story behind the project came from an emergency experience shortly after the founder's son was born. At three days old, the child became unresponsive and was rushed to the NICU. Instead of care beginning immediately, the family spent close to twenty minutes completing forms, consent paperwork, and medical history for a newborn whose records already existed elsewhere.

That experience became the emotional doorway into the broader problem:

- Medical records are scattered across offices, hospitals, disciplines, imaging centers, urgent care settings, and software systems.
- Patients are often expected to remember, locate, and explain medical information they may not fully understand or cannot easily access.
- Providers still rely on slow manual workflows, phone calls, faxes, portals, PDFs, and broad release requests.
- Current processes can overshare, undershare, or separate information from its source and authorization history.

The grant framing should use this story carefully. It is powerful, but the NIH application should quickly pivot from the personal story into the informatics problem: consent, provenance, workflow state, source attribution, interoperability, auditability, and usability.

## Primary Grant Strategy

The primary target is NIH/NLM SBIR Phase I.

NLM is the strongest current fit because the concept aligns with biomedical informatics, patient-mediated health information exchange, clinical data interoperability, structured clinical information models, clinical workflow integration, data provenance, and usability of health information systems.

Dr. Goutham Reddy from NLM responded positively to the concept but gave important guidance:

- Emphasize underlying informatics research and technical innovation.
- Do not frame the application as simply building a software product.
- Explain how ClearPath advances patient-mediated information exchange, consent-aware sharing, and interoperability.
- Explain how the ClearPath information model relates to existing standards, especially HL7 FHIR.
- Explain what novel capability ClearPath provides beyond routine app development.

The application should consistently use phrases such as:

- Patient-mediated health information exchange
- Consent-aware data sharing
- Consent-scoped package generation
- Provenance-preserving clinical information
- Structured clinical information model
- Clinical workflow integration
- Authorization fidelity
- Standards-aware mapping
- HL7 FHIR positioning
- Usability of health information systems

Avoid language such as:

- Medical app
- Records app
- Better patient portal
- JSON connects every language
- Universal EHR integration in Phase I
- HIPAA-compliant app as the main innovation

## Target Submission Timing

The team discussed whether the September 2026 NIH SBIR deadline is still possible. It may be technically possible, but it is a stretch because company and federal registrations can take weeks.

The working approach is:

- Work as if September is possible.
- Keep January 2027 as the safer fallback.
- Do not emotionally depend on September.
- Anything built for September is still useful for January.

The biggest risk for September is not writing. It is registration timing: LLC formation, EIN, SAM.gov, UEI, Grants.gov, eRA Commons, and SBA Company Registry.

## Business Formation Status

The founder applied for and received access to Texas SOSDirect.

The founder submitted a Texas LLC Certificate of Formation for:

ClearPath Care LLC

The filing was submitted through SOSDirect and is currently pending acceptance or rejection. The name may have some risk because Texas showed similar active entities, including names with Clear Path, Health Care, Healthcare Consulting, and Home Care. The founder still preferred ClearPath Care because it is stronger and more patient friendly than more technical alternatives.

Important:

- Do not apply for the EIN until Texas accepts/files the LLC.
- Once Texas accepts the formation, download and save the filed Certificate of Formation.
- Then apply for the EIN directly through the IRS.
- Then open the business bank account, likely through Chase.
- Then begin federal registrations.

The next registration sequence after LLC acceptance:

1. EIN through IRS.
2. Business bank account.
3. SAM.gov registration and UEI.
4. Grants.gov organization registration.
5. eRA Commons organization and PI account setup.
6. SBA Company Registry.

No SOSDirect login IDs, passwords, addresses, or payment details should be committed to the repo.

## Specific Aims Status

The Specific Aims page has been drafted by the founder with guidance. The user wants all grant documents going forward to be written or personally rewritten by them, with the assistant providing structure, guidance, and rough drafts.

The most recent Specific Aims draft was shortened to fit roughly one NIH page. It covers:

- Fragmented records across offices, disciplines, imaging centers, hospitals, and software systems.
- Manual workflows that burden patients and delay providers.
- The deeper issue that records need to move with permission, clear purpose, source history, and structure.
- ClearPath as a patient-mediated clinical information exchange platform.
- ClearPath JSON as an internal structured model.
- Mapping relevant data to HL7 FHIR.
- Central hypothesis around consent-aware, provenance-preserving exchange.
- Aim 1: define and validate the information model.
- Aim 2: build and technically test a consent-scoped package prototype.
- Aim 3: evaluate usability and workflow fit.

The user created a Word document at:

`docs/Specific Aims.docx`

That file was intentionally left untracked and was not committed unless the user later asks to add it.

## Research Strategy Status

A full rough Research Strategy draft was written in chat for the user to rewrite in their voice.

The required NIH structure is:

- Significance
- Innovation
- Approach

The draft included:

### Significance

- Short founder story about the NICU experience.
- Broader record fragmentation problem.
- Patient burden.
- Provider burden.
- Informatics gap: records need to move with meaning, source, consent, audit history, and workflow context.
- Existing systems help but do not solve patient-mediated, consent-scoped exchange across disconnected care settings.

### Innovation

- Not just another records app.
- Consent-scoped package generation.
- Provenance-preserving clinical information.
- ClearPath JSON plus HL7 FHIR positioning.
- Patient understandable review.
- Medical passport and 3D body map as supportive design features, not the central research claim.

### Approach

- Phase I uses synthetic or de-identified records.
- No live EHR integration required in Phase I.
- Aim 1 defines and validates the model.
- Aim 2 builds and technically tests the prototype.
- Aim 3 evaluates usability and workflow fit.
- Phase II handles production hardening, real PHI, deeper integrations, penetration testing, and pilots.

EMS and tap-to-transfer were discussed as future use cases. They should be mentioned carefully as future or Phase II/Phase III pathways, not Phase I deliverables. The core Phase I work is the underlying consent-scoped package model, not emergency deployment.

## Commercialization Plan Status

A full rough Commercialization Plan draft was written in chat for the user to review and rewrite.

Core commercialization framing:

- ClearPath is not replacing the EHR.
- It is a lightweight patient-mediated exchange layer between disconnected offices.
- Early buyers may include small and mid-sized provider offices, specialty clinics, urgent care groups, rehabilitation practices, behavioral health practices, primary care offices, and referral networks.
- Daily users may include patients, caregivers, providers, office staff, care coordinators, records staff, and administrators.

Commercial value:

- Providers get needed outside records faster.
- Patients have clearer control over what is shared.
- Offices reduce manual record chasing.
- Packages are consent-scoped and auditable.
- Source and verification status travel with the record package.

Likely starting revenue model:

- Practice subscription.
- Possible tiers by practice size, user count, location count, or request volume.
- Network or enterprise pricing later.

Competitive landscape:

- Patient portals
- EHR exchange tools
- Health information exchanges
- Fax/manual records processes
- Secure messaging
- Intake form tools
- Consumer health records

ClearPath's differentiation:

- Patient authorization is central.
- The package is consent-scoped.
- Source, status, provenance, and audit history are preserved.
- The internal JSON model maps toward FHIR rather than replacing FHIR.

## Budget Status

The preferred working Phase I budget is $300,000 total.

The current preferred budget distribution is:

| Category | Amount |
| --- | ---: |
| Founder / PI salary plus fringe and payroll burden | $90,000 |
| Lead developer / technical lead | $125,000 |
| HIPAA and privacy legal consult | $10,000 |
| Security architecture review | $7,500 |
| Clinical and interoperability advisor | $12,500 |
| UX and workflow research | $12,500 |
| Cloud, development tools, and prototype infrastructure | $10,000 |
| Grant administration, accounting, payroll, and insurance | $10,000 |
| Pilot, demo, and user discovery expenses | $7,500 |
| Indirect and operating reserve | $15,000 |
| Total | $300,000 |

The founder originally considered $75,000 to $85,000, then preferred $80,000, then later raised the preferred number to $90,000 while reducing the developer line and reserve.

Budget justification principles:

- Founder salary must be justified as real project labor, not general personal support.
- Developer cost is the largest technical cost because Aim 2 depends on a credible working prototype.
- Legal and security spending are limited in Phase I and full production compliance is deferred to Phase II.
- Full third-party penetration testing should likely happen in Phase II before real PHI pilots unless the grant terms, legal counsel, or pilot partners require it earlier.
- The budget should not treat a reserve as leftover profit.
- Any unused reserve generally remains unobligated unless it is used for allowable project work, carried forward if permitted, or otherwise handled under award terms.
- A separate SBIR fee may be possible if requested correctly, but that is different from direct costs or an informal reserve.

A `.docx` budget proposal was briefly created and committed, then the user changed direction and asked to manage the budget justification in Google Docs first. The `.docx` was deleted from the repo and pushed.

Current state:

- There is no budget proposal file in the repo right now.
- The user was given copy/paste budget justification text in chat.
- If the user later wants the final Google Docs version added to the repo, import or save it intentionally.

## Product And Prototype Plan

The application should keep moving while registration is pending.

Core prototype priorities:

- Production login/auth reliability.
- Provider request creation.
- Patient request review.
- Patient approval, partial approval, denial, revocation, and expiration.
- Consent-scoped package generation.
- Source and provenance labels.
- Audit trail.
- Provider package review.
- Medical questionnaire detail expansion.
- Patient health map and condition list.

Medical questionnaire issue:

The current questionnaire has broad questions such as heart disease, chest pain, or heart attack. ClearPath needs drill-down specificity. Example: if a patient selects heart attack, they should be able to add that it happened in 2020, what provider diagnosed it, what treatments happened, and which medications are connected to it.

The diagnosis model should support:

- Condition name
- Body region when applicable
- Date diagnosed
- Diagnosing provider or office
- Current status: active, resolved, recurring, historical, uncertain
- Treatments completed
- Treatments recommended but not completed
- Related medications
- Notes, documents, imaging
- Source: patient-added, provider-added, imported, provider-verified
- Visibility or sharing status

Data trust model:

- Patients can add information.
- Providers can add and verify information.
- Every item should show source and verification status.
- The app should avoid pretending there is one perfect source of truth.

Recommended labels:

- Patient entered
- Provider entered
- Imported
- Provider verified
- Patient confirmed
- Active
- Resolved
- Historical
- Uncertain

## 3D Body Map Status

The user wanted a polished, clean, anatomically correct, interactive 3D body model in its own tab on mobile and patient-side desktop.

Important design/product decisions:

- The body map should be its own visible tab.
- It should not be the only way to view diagnoses.
- It should support localized conditions through body regions.
- Systemic conditions still need list or timeline views.
- The model should be appropriate for teens and kids.
- The user prefers a neutral gray clinical model.
- The user does not want explicit models.
- The model can be minimally covered or non-explicit, but should still look like a real 3D human model, not abstract body shapes.

The body view should show:

- Current conditions first.
- Resolved conditions lower.
- Complete history expandable.
- Treatments, dates, diagnosing provider, source, and status.

## Legal, HIPAA, And Security Plan

Phase I should likely use synthetic or de-identified data.

Phase I should include:

- HIPAA and privacy legal consult.
- Consent workflow review.
- Patient authorization language review.
- Synthetic data posture.
- Future BAA planning.
- Security architecture review.
- Threat model.
- Access control review.
- Audit logging review.
- Data flow review.
- Remediation plan.

Phase II should include:

- Formal HIPAA security risk analysis.
- HIPAA privacy and security policies.
- Business associate agreement templates.
- Third-party penetration test.
- Production security monitoring.
- Incident response plan.
- Pilot agreements.
- Real PHI readiness before live deployment.

The user asked whether HIPAA fees coming in under budget means money must be returned. Guidance given:

- Not automatically.
- Grant money must be spent on real, allowable, documented project work.
- It may be possible to rebudget within award rules.
- It is not acceptable to invent a fake role or payment just to use up the budget.
- A person overseeing legal costs can be paid only if they have a real scope, rate, invoice, deliverables, and project connection.

## Funding Path Research Completed

Research folders exist for:

- NLM
- NIBIB
- AHRQ
- NSF Seed Fund
- ARPA-H
- ASTP/ONC
- HRSA
- CDC
- VA
- DoD
- NIA
- PCORI
- NIMHD
- NIDILRR
- Texas HHSC
- USDA DLT

NLM remains the primary route. AHRQ was examined deeply but is not currently the primary path because many AHRQ routes are more academic, partnership-heavy, or not well suited to the current small-business Phase I plan. NIBIB may be relevant but NLM is stronger because the project is fundamentally biomedical informatics and health information exchange.

Alternate options folder exists for investor planning, valuation, dilution, outreach, and due diligence.

## Visual Planning Artifacts

The user wanted visually appealing planning maps, not coding-style dependency charts.

Created:

- Master grant readiness checklist.
- Grant application to-do tree.
- Locked doors board.
- Master mission tree styled like a visual skill tree.

The master mission tree shows workstreams for:

- Company and federal access
- Grant and research application
- App and prototype
- People and budget
- Legal and security
- Commercialization and alternate funding

The user wants planning artifacts to be easy to read for humans, not like code diagrams.

## Repo And Git Notes

Workspace path:

`/Users/josephslaughter13/Desktop/ClearPath Care`

Remote:

`git@github.com:josephslaughter808/treatment-planner.git`

The repo uses SSH successfully after earlier credential issues were fixed.

Project rule from user:

Every time anything is changed in the project, commit and push it.

Important:

- Do not commit sensitive credentials or private account details.
- Do not accidentally commit `docs/Specific Aims.docx` unless the user asks.
- The current branch is `main`.

Recent relevant commits:

- `db5eabd Update Phase I budget justification`
- `846365a Convert Phase I budget proposal to DOCX`
- `56082c4 Remove draft budget proposal file`

The `.docx` budget file was intentionally removed after the user decided to manage it in Google Docs first.

## Immediate Next Steps For New Chat

Start by asking what the user wants to work on now, but useful next options are:

1. Check whether Texas accepted or rejected the LLC filing.
2. If accepted, guide the user through the IRS EIN application.
3. If rejected, help choose the smallest acceptable name change while preserving the ClearPath Care brand.
4. Continue grant document drafting in the user's voice.
5. Create or refine the Budget Justification in Google Docs text.
6. Draft Biosketch guidance for the founder.
7. Draft Facilities and Other Resources.
8. Draft Project Narrative and Project Summary if not finalized.
9. Build advisor outreach messages.
10. Build clinic partner outreach messages.
11. Create a September submission sprint checklist.
12. Continue app prototype work, especially login, request workflow, questionnaire specificity, source labels, and 3D health map.

## Tone And Collaboration Preferences

The user is new to business formation and grant writing and wants clear, simple explanations. They are capable and motivated but often wants things broken down into what each term means and why it matters.

The user wants:

- Plain language.
- Concrete next steps.
- Guidance, not legal overconfidence.
- Rough drafts they can rewrite in their own voice.
- Help making sure documents hit NIH expectations.
- No overly AI-sounding prose.
- Visual planning tools when planning gets complex.

For grant documents from this point forward:

- The user wants to handwrite or personally rewrite documents.
- The assistant can provide structure, rough drafts, point checks, and edits.
- Keep the user's voice direct and human.
- Avoid over-polished corporate language.

