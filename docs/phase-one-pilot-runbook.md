# Phase One Pilot Runbook

## Pilot Scope

ClearPath Care phase one is a single-office medical check-in pilot. The product should only support:

- Patient medical history
- Medications
- Allergies
- Emergency contact
- Insurance
- Provider patient lookup
- Provider check-in review
- Saved check-in history

Diagnosis, treatment education, timeline, page editing, integrations, payments, team management, and multi-office setup stay out of production navigation until a later phase.

## Office Workflow

1. Provider signs in on a desktop or laptop.
2. Provider opens the medical check-in dashboard.
3. Provider creates or copies a patient invite when needed.
4. Provider selects a patient from the patient finder.
5. Provider reviews medical history, medications, allergies, emergency contact, and insurance.
6. Provider marks medical history, medication, and insurance confirmation.
7. Provider saves the office check-in.
8. Provider confirms the saved check-in appears in recent history.

## Patient Workflow

1. Patient opens the invite or goes to `/signup`.
2. Patient creates a ClearPath patient account.
3. If email confirmation is required, patient confirms the email and logs in.
4. Patient opens the health profile on mobile.
5. Patient updates profile details, medical conditions, medications, allergies, insurance, and emergency contact.
6. Patient saves the health profile before the visit.

## Launch Verification

Run these checks before each pilot day:

- `npm run lint`
- `npm run build`
- Confirm `/signup` returns `HTTP 200`.
- Confirm `/api/health` returns `status: "ok"` in production.
- Confirm unauthenticated `/api/patient-vault` requests return an auth error.
- Confirm unauthenticated `/api/patients` requests return an auth error.
- Confirm `/diagnoses`, `/treatments`, `/timeline`, `/team`, `/settings`, and `/integrations` do not expose phase-two screens.

## Support Escalation

If a patient cannot sign in, first check whether they need to confirm their email. If a provider cannot find a patient, create a new invite and confirm the patient used the same email address. If saved data does not appear for the office, stop using the record for clinical decisions until the provider confirms the information directly with the patient.

Do not paste patient health details into support chat, GitHub issues, screenshots, or design notes. Use patient initials, timestamps, and non-sensitive descriptions only.
