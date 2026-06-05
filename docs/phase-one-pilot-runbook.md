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
2. If the person is new to the practice, provider opens New Patient and scans the patient's QR code or enters the access code to add the patient to the practice database.
3. For each returning visit, provider opens Patient Check-In and scans the patient QR code, enters the access code, or searches for the patient manually.
4. Provider reviews medical history, medications, allergies, emergency contact, and insurance in the patient history panel.
5. Provider reviews the since-last-visit update callout before seating the patient.
6. Provider saves today's verification with an optional office note.
7. Provider confirms the saved check-in appears in recent history.

## Patient Workflow

1. Patient opens the invite or goes to `/signup`.
2. Patient creates a ClearPath patient account.
3. If email confirmation is required, patient confirms the email and logs in.
4. Patient opens the health profile on mobile.
5. Patient updates profile details, medical conditions, medications, allergies, insurance, and emergency contact.
6. Patient opens the Share tab to show their QR check-in pass when the office needs to connect or verify the record.

## Dependent and Wallet Pass Notes

Dependents need their own scannable identity, even when a parent or guardian manages the profile from the same account. If a parent is checking in a child, the office should scan the child's QR code, not the parent's QR code. That QR should resolve to the child's medical history, medications, allergies, emergency contact, insurance, and saved check-in history.

For phase one, dependent profiles can stay under the Family tab, but future share/wallet work should include a separate QR/access code for each dependent vault. Children and legal dependents are editable by the parent or guardian. Adult family members remain view-only unless authorization or legal authority allows management.

Future mobile wallet behavior should feel like multiple concert tickets in one wallet. Double tap opens the primary patient pass first, then the patient can swipe horizontally to the right to show each dependent's pass. Each card should clearly show the person's name, relationship, and QR/access code so the office scans the correct record.

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
