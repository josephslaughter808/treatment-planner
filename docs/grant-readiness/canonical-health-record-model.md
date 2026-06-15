# ClearPath Canonical Health Record Model

## Purpose

ClearPath should not be treated as a collection of forms. The long-term product is a patient-controlled health data hub that can collect, normalize, permission, and transfer health information between patients, caregivers, offices, and clinical systems.

The canonical health record model is the internal ClearPath structure that all imports, patient updates, office reviews, and future exports map into. This lets ClearPath speak one internal language even when outside systems use different formats.

## Design Principles

- Patient ownership comes first. The patient or authorized guardian controls who can see, edit, or share the record.
- Every person has their own record, even when one account manages multiple people.
- Every sensitive access should be explainable later through an audit event.
- Patient-entered information and provider-confirmed information must not be silently mixed.
- Data should be structured enough for importing and comparison, but readable enough for human review.
- The model should be able to map toward FHIR, Open Dental, ePCR, and other clinical systems later.

## Core Entities

### Account

An account represents a login identity. One account may manage one or more person records.

Required fields:

- `accountId`
- `authUserId`
- `email`
- `role`: `patient`, `provider`, `admin`
- `createdAt`
- `lastLoginAt`
- `status`: `active`, `locked`, `archived`

Important rules:

- A patient account can manage its own person record.
- A parent or legal guardian account can manage dependent person records.
- A provider account must belong to a verified practice.
- Provider accounts should not be self-created without a verification or payment-controlled provisioning process.

### Person Record

A person record is the health identity being shared. This is separate from the login account.

Required fields:

- `personId`
- `owningAccountId`
- `displayName`
- `dateOfBirth`
- `phone`
- `email`
- `memberId`
- `walletCode`
- `status`: `active`, `archived`, `deceased`, `restricted`
- `createdAt`
- `updatedAt`

Relationship fields:

- `isPrimaryForAccount`
- `relationshipToAccount`: `self`, `child`, `legal-dependent`, `spouse`, `adult-care-recipient`, `other`
- `managementMode`: `editable`, `view-only`, `emergency-only`
- `authorityStatus`: `self`, `parent-guardian`, `legal-guardian`, `authorized-adult`, `pending`, `none`

Important rules:

- Children and legal dependents can be editable by the authorized guardian.
- Spouses and unrelated adults are view-only unless explicit permission is granted.
- Legal dependents may be editable when authority documentation or practice-verified authority exists.
- Each person record needs its own QR code/share code.

### Health Profile

The health profile stores the current patient-facing medical history.

Sections:

- Demographics
- Medical conditions
- Medications
- Allergies
- Surgeries and hospitalizations
- Pregnancy or nursing status
- Anesthesia, sedation, or procedure concerns
- Bleeding or healing concerns
- Current symptoms or recent health changes
- Doctors, specialists, or care team members
- Mobility, communication, or accessibility needs
- Emergency contact
- Insurance
- Documents

Important rules:

- Each section should support `lastUpdatedAt`, `lastUpdatedBy`, and `source`.
- Structured repeatable items should be arrays, not long free-text blobs.
- Free-text notes are allowed, but should not replace structured fields where structured fields matter.

### Medical Condition

Required fields:

- `conditionId`
- `name`
- `status`: `active`, `resolved`, `inactive`, `unknown`
- `diagnosedYear`
- `notes`
- `source`: `patient-entered`, `provider-entered`, `imported`, `caregiver-entered`
- `sourceOrganizationId`
- `lastUpdatedAt`

Future mapping targets:

- FHIR `Condition`
- SNOMED CT or ICD-10 codes when available

### Medication

Required fields:

- `medicationId`
- `name`
- `dose`
- `route`
- `frequency`
- `reason`
- `status`: `active`, `stopped`, `as-needed`, `unknown`
- `prescribingProvider`
- `source`
- `lastUpdatedAt`

Future mapping targets:

- FHIR `MedicationStatement`
- RxNorm when available

### Allergy

Required fields:

- `allergyId`
- `allergen`
- `reaction`
- `severity`: `mild`, `moderate`, `severe`, `life-threatening`, `unknown`
- `status`: `active`, `inactive`, `entered-in-error`
- `source`
- `lastUpdatedAt`

Future mapping targets:

- FHIR `AllergyIntolerance`

### Surgery Or Hospitalization

Required fields:

- `eventId`
- `eventType`: `surgery`, `hospitalization`, `major-illness`, `emergency-visit`, `other`
- `description`
- `year`
- `facility`
- `notes`
- `source`
- `lastUpdatedAt`

Important rules:

- Each surgery or hospital stay should be its own item.
- This section should not be stored as one multiline text field.
- The provider check-in comparison should group these under hospital stays/surgeries.

### Insurance

Required fields:

- `insuranceId`
- `payerName`
- `memberId`
- `groupNumber`
- `subscriberName`
- `subscriberRelationship`
- `planType`
- `effectiveDate`
- `cardFrontDocumentId`
- `cardBackDocumentId`
- `lastUpdatedAt`

Important rules:

- Insurance changes should be highlighted clearly at check-in.
- Card images should be separate document records linked to the insurance entry.

### Emergency Contact

Required fields:

- `contactId`
- `name`
- `relationship`
- `phone`
- `email`
- `releaseAllowed`
- `releaseScope`
- `lastUpdatedAt`

Important rules:

- Emergency contact is not automatically a caregiver.
- Release of information should be explicit and separately auditable.

### Document

Required fields:

- `documentId`
- `personId`
- `documentType`: `drivers-license`, `insurance-card-front`, `insurance-card-back`, `release-of-information`, `guardianship-document`, `medical-record`, `clearance`, `other`
- `title`
- `storagePath`
- `mimeType`
- `uploadedByAccountId`
- `uploadedAt`
- `status`: `active`, `archived`, `revoked`

Important rules:

- Documents should not be directly exposed by public URLs.
- Access should be controlled by the same consent package rules as profile data.
- Legal authority documents require special audit logging.

### Practice

Required fields:

- `practiceId`
- `name`
- `type`: `dental`, `medical`, `dermatology`, `specialty`, `ems`, `other`
- `verifiedStatus`: `pending`, `verified`, `suspended`, `cancelled`
- `subscriptionStatus`: `trial`, `active`, `past-due`, `cancelled`, `locked`
- `createdAt`

Important rules:

- Providers should only access person records through an active practice relationship or active consent package.
- Cancelled practices should not retain active patient lookup privileges.

### Provider Check-In Snapshot

A snapshot freezes what the office reviewed at a specific visit.

Required fields:

- `snapshotId`
- `personId`
- `practiceId`
- `createdAt`
- `createdByProviderId`
- `sourceConsentPackageId`
- `profileVersion`
- `sectionsIncluded`
- `snapshotData`
- `reviewStatus`: `pending`, `reviewed`, `imported`, `discarded`
- `reviewedAt`

Important rules:

- First-time patients should not show a "changed since last visit" alert.
- Returning patients should compare the current profile against the last practice snapshot.
- Providers should be able to acknowledge review of changes.

### Audit Event

Every sensitive action creates an audit event.

Required fields:

- `auditEventId`
- `actorAccountId`
- `actorRole`
- `personId`
- `practiceId`
- `eventType`
- `resourceType`
- `resourceId`
- `occurredAt`
- `ipAddress`
- `userAgent`
- `metadata`

Examples:

- `profile.updated`
- `consent.created`
- `consent.revoked`
- `provider.profile.viewed`
- `provider.checkin.reviewed`
- `document.uploaded`
- `document.viewed`
- `caregiver.requested_access`
- `caregiver.access_approved`

## Data Source And Provenance

Every clinically meaningful item should carry source information.

Recommended source fields:

- `sourceType`: `patient-entered`, `caregiver-entered`, `provider-entered`, `imported`, `system-generated`
- `sourceOrganizationId`
- `sourceSystem`
- `sourceRecordId`
- `enteredByAccountId`
- `enteredAt`
- `verifiedByPracticeId`
- `verifiedAt`

This matters because ClearPath should eventually tell offices not just what the data says, but where it came from and whether another office confirmed it.

## Versioning

Every person record should have profile versions.

Recommended version fields:

- `profileVersionId`
- `personId`
- `versionNumber`
- `createdAt`
- `createdByAccountId`
- `changeSummary`
- `sectionsChanged`

This allows ClearPath to:

- Compare current profile to last check-in
- Show providers clear change alerts
- Restore or audit previous patient-entered information
- Build defensible clinical review history

## Current Implementation Gap

The current app already has early versions of these concepts in `PatientVault`, `DependentProfile`, `CheckInRecord`, and share links. The next engineering step is to split the current broad patient vault into normalized entities that match this model while preserving the working pilot flow.

