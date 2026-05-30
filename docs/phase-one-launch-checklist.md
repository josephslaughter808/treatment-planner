# Phase One Pilot Launch Checklist

## Scope Lock

Phase one is limited to a single-office pilot for:

- Patient medical history
- Medications
- Allergies
- Emergency contact
- Insurance
- Provider patient selection
- Provider check-in review
- Saved check-in history

Anything outside this list should be hidden, redirected, or postponed unless it directly supports the check-in workflow.

## Hidden Until Later

- Diagnosis pages
- Treatment pages
- Patient timeline
- Page editor
- Emergency card
- Team directory
- Dental software integration
- Payments
- Multi-office self-serve setup

## Provider Flow

1. Provider signs in on desktop.
2. Provider lands on the check-in dashboard.
3. Provider selects a patient through the patient finder.
4. Provider reviews medical history, medications, allergies, emergency contact, and insurance.
5. Provider marks whether insurance, medical history, and medications were confirmed.
6. Provider saves the office check-in.
7. Provider can see recent saved check-ins for the selected patient.

## Patient Flow

1. Patient signs in on mobile.
2. Patient lands on the health profile.
3. Patient updates profile details, conditions, medications, allergies, insurance, and emergency contact.
4. Patient saves the health profile.
5. The office can review the updated information during check-in.

## Day One Completion Criteria

- Production navigation only exposes phase-one surfaces.
- Out-of-scope routes redirect to `/` or `/vault`.
- The provider check-in page includes saved check-in history.
- The patient side focuses on health profile and account only.
- This checklist exists and becomes the source of truth for the week.

## Day Two Completion Criteria

- Supabase Auth is required for production patient and provider access.
- Patient/provider roles are separated before protected data is read or written.
- Patient vaults, office check-ins, and share links are persisted in Supabase.
- Sensitive vault snapshots and check-in notes are encrypted before database storage.
- Phase-two APIs stay locked behind server-side access checks.

## Day Three Completion Criteria

- Provider patient selection loads connected patients from the signed-in practice.
- Provider check-in history loads from the practice record, not only browser storage.
- Patient health-profile save/load language is patient-ready and free of prototype wording.
- Profile settings language is pilot-ready for both patient and provider accounts.
- Visible production flows do not mention local fallback, server jargon, diagnosis, treatment, or timeline features.

## Day Four Completion Criteria

- Patient health-profile reads and updates write audit events.
- Provider patient-list reads write audit events.
- Office check-in saves and history reads write audit events.
- Audit events include actor, practice, patient, resource, and non-sensitive metadata when available.
- Pilot verification confirms protected production endpoints still enforce authentication after audit logging.

## Day Five Completion Criteria

- Provider dashboard includes a pilot patient invite workflow.
- Creating an invite prepares the patient identity, practice connection, access code, and patient placeholder record.
- Office users can copy a ready-to-send invite message for text or email.
- Empty patient-finder states explain how to invite the first patient.
- Invite creation is protected by provider/practice access checks and writes an audit event.

## Day Six Completion Criteria

- `/signup` opens a patient account setup flow instead of redirecting to login.
- Patient signup language matches the invite workflow and sends patients to the health profile.
- Email-confirmation signup states are handled without breaking later patient login.
- Patient health profile includes a mobile-friendly pre-visit checklist.
- Out-of-scope patient panels are removed from the phase-one health profile.
- Patient/provider route guards and production auth still protect the correct surfaces.

## Day Seven Completion Criteria

- Production build, lint, and smoke checks pass immediately before pilot use.
- Public pilot pages are marked no-index while the single-office pilot is private.
- `/api/health` reports the phase-one pilot status without exposing secrets or patient data.
- Out-of-scope pages and APIs remain redirected or locked.
- The pilot runbook documents the exact office workflow, patient workflow, verification checks, and support escalation path.
- No new feature work is added unless it directly supports the phase-one check-in launch.
