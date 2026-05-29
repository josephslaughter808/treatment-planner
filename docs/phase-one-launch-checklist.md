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
