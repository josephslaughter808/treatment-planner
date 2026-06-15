# ClearPath Consent Package Spec

## Purpose

A consent package is the core unit of permissioned sharing in ClearPath. It answers one question:

What information did this patient or authorized caregiver allow this specific person, office, or system to access, for what purpose, and for how long?

This is the foundation for the future ClearPath hub. Instead of giving offices broad access to an account, ClearPath should generate scoped packages that can be viewed, reviewed, exported, imported, revoked, and audited.

## Why This Matters For The Grant

Most healthcare data sharing is either too closed, too manual, or too broad. ClearPath's technical opportunity is to create a patient-controlled exchange layer where health data can move between systems without giving every system permanent unrestricted access.

The consent package is the technical object that makes that possible.

## Consent Package Entity

Required fields:

- `consentPackageId`
- `packageType`: `check-in`, `new-patient-intake`, `emergency-release`, `caregiver-access`, `provider-import`, `record-request`
- `personId`
- `createdByAccountId`
- `recipientType`: `practice`, `provider`, `caregiver`, `emergency-contact`, `external-system`
- `recipientId`
- `recipientName`
- `purposeOfUse`: `treatment`, `payment`, `operations`, `emergency`, `caregiving`, `patient-request`
- `status`: `draft`, `active`, `used`, `expired`, `revoked`
- `createdAt`
- `expiresAt`
- `revokedAt`
- `revokedByAccountId`
- `revocationReason`

Important rules:

- A consent package should never grant more access than the patient selected.
- A revoked package should stop future access immediately.
- Expired packages should not be usable for new access.
- Previously completed audit records should remain available even after revocation.

## Included Sections

Each package should explicitly list what is included.

Supported sections:

- `demographics`
- `medical-conditions`
- `medications`
- `allergies`
- `surgeries-hospitalizations`
- `pregnancy-nursing`
- `procedure-concerns`
- `bleeding-healing`
- `current-symptoms`
- `care-team`
- `accessibility-needs`
- `emergency-contact`
- `insurance`
- `documents`
- `dependent-summary`
- `provider-confirmed-history`
- `check-in-history`

Each section should include:

- `sectionKey`
- `accessLevel`: `hidden`, `view`, `download`, `import`
- `includedItemIds`
- `excludedItemIds`
- `redactionNotes`

Example:

```json
{
  "sectionKey": "allergies",
  "accessLevel": "import",
  "includedItemIds": ["allergy-penicillin", "allergy-latex"],
  "excludedItemIds": [],
  "redactionNotes": ""
}
```

## Package Payload

The payload is the actual data released under the consent package.

Recommended fields:

- `payloadId`
- `consentPackageId`
- `profileVersionId`
- `generatedAt`
- `format`: `clearpath-json`, `human-readable`, `pdf`, `fhir-bundle`, `open-dental-mapped`
- `checksum`
- `encryptedStoragePath`
- `expiresAt`

Important rules:

- Payloads should be generated from a specific profile version.
- Payloads should be encrypted at rest.
- Payloads should not be regenerated silently after patient edits unless the consent package allows live updates.
- A provider should know whether they are seeing a frozen snapshot or the latest patient profile.

## Live Package Versus Snapshot Package

ClearPath should support two package modes.

### Snapshot Package

A snapshot package freezes the data at the moment of sharing.

Good for:

- Office check-in
- Legal documentation
- Auditability
- Export/import into another system

### Live Package

A live package points to the current patient profile until revoked or expired.

Good for:

- Long-term caregiver access
- Active practice relationships
- Emergency profile access

Important rule:

The UI must clearly show whether the recipient is viewing a snapshot or live profile data.

## Access Codes And QR Codes

Each package can have a human-entered code and QR code.

Required fields:

- `accessCodeId`
- `consentPackageId`
- `codeHash`
- `qrPayload`
- `createdAt`
- `expiresAt`
- `maxUses`
- `useCount`
- `status`: `active`, `used`, `expired`, `revoked`

Security requirements:

- Store only a hash of the human-entered access code.
- Rate limit lookup attempts.
- Expire unused codes.
- Log every successful and failed lookup attempt.
- Do not reveal whether a patient exists through error wording.

## Recipient Capabilities

A package should define what the recipient may do.

Capabilities:

- `view`
- `download-pdf`
- `download-json`
- `import-to-practice`
- `acknowledge-review`
- `request-more-access`
- `message-patient`
- `delegate-within-practice`

Examples:

- A dental office check-in package may allow `view`, `download-pdf`, `import-to-practice`, and `acknowledge-review`.
- An emergency contact package may allow only `view` of emergency contact, medications, conditions, and allergies.
- A spouse package may allow `view` only after explicit approval.
- A child/dependent package may allow the guardian to `view`, `edit`, and `share`.

## Caregiver And Family Consent

Consent packages need to support family relationships without accidentally exposing adult records.

Relationship modes:

- `self`
- `child-dependent`
- `legal-dependent`
- `adult-view-only`
- `adult-authorized-manager`
- `emergency-release-only`

Rules:

- A parent or legal guardian can create packages for a child or legal dependent.
- An adult spouse cannot create or edit another adult's package unless permission has been granted.
- A caregiver may request access, but the patient or authorized legal representative must approve it.
- Legal authority should be documentable and auditable.

## Provider Check-In Flow

The provider check-in flow should use consent packages like this:

1. Patient opens their own QR code or the QR code for a dependent.
2. Provider scans the QR code or enters the access code.
3. ClearPath validates the package status, recipient, expiration, and allowed sections.
4. ClearPath creates or updates the practice connection if this is a new patient.
5. ClearPath generates a check-in snapshot for that practice.
6. If this is a returning patient, ClearPath compares the current snapshot with the last practice snapshot.
7. New changes appear in a high-visibility alert grouped by category.
8. Provider acknowledges the review.
9. ClearPath writes audit events for scan, view, comparison, and acknowledgement.

## Import And Export Modes

Consent packages should eventually support multiple output formats.

### Human-Readable Package

Used by staff for quick review.

Includes:

- Patient summary
- Allergies
- Medications
- Conditions
- Surgeries/hospitalizations
- Insurance
- Emergency contact
- Change alerts

### Structured ClearPath JSON

Used by ClearPath offices and internal APIs.

Includes:

- Stable IDs
- Source metadata
- Version metadata
- Consent package metadata
- Audit references

### FHIR Bundle

Used for future medical interoperability.

Likely resources:

- Patient
- Condition
- MedicationStatement
- AllergyIntolerance
- RelatedPerson
- Coverage
- DocumentReference
- Consent
- Provenance
- AuditEvent

### Open Dental Mapping

Used for the first dental pilot path.

Initial likely scope:

- Patient demographics
- Medical history notes
- Allergies
- Medications
- Insurance fields
- Attached document references

Important rule:

Open Dental mapping should start as a reviewed import workflow, not a silent automatic write into the chart.

## Audit Events

Consent packages should write audit events for:

- `consent.created`
- `consent.activated`
- `consent.viewed`
- `consent.payload_generated`
- `consent.imported`
- `consent.expired`
- `consent.revoked`
- `consent.lookup_failed`
- `consent.lookup_succeeded`
- `provider.review_acknowledged`
- `caregiver.access_requested`
- `caregiver.access_approved`
- `caregiver.access_rejected`

Audit metadata should include:

- Actor account
- Recipient
- Practice
- Person record
- Package ID
- Sections accessed
- IP address
- User agent
- Timestamp

## Minimum Pilot Version

For the current phase-one pilot, the first real version can be smaller:

- One active check-in package per patient or dependent
- QR/access code lookup
- Included sections: demographics, conditions, medications, allergies, surgeries/hospitalizations, insurance, emergency contact
- Provider view access
- Check-in snapshot generation
- Repeat-patient change detection
- Provider acknowledgement
- Audit events

This minimum version is enough to demonstrate the larger hub concept without overbuilding the first pilot.

## Current Implementation Gap

The current app has share links, QR-style access codes, provider lookup, patient vaults, and check-in snapshots. The next engineering step is to promote share links into first-class consent packages with scoped sections, explicit recipient capabilities, expiration, revocation, and audit events.

