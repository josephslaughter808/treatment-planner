# Compliance And Security Roadmap

## Purpose

ClearPath will handle sensitive health information if it moves beyond synthetic or de-identified prototypes. The compliance and security plan should be phased so Phase I proves feasibility while Phase II prepares for real PHI and production pilots.

This document is planning guidance, not legal advice.

## Core Principle

Phase I should demonstrate that ClearPath is designed with privacy and security in mind. Phase II should fund the deeper production compliance program needed before broad real-world PHI use.

## Phase I Compliance Position

Recommended Phase I posture:

- Use synthetic or de-identified records for prototype development and usability testing.
- Avoid production use with real PHI unless legal, security, and award conditions are satisfied.
- Build consent, audit, access control, and package scoping into the prototype from the beginning.
- Document security and privacy risks for Phase II.

## Phase I Compliance Work

### HIPAA And Privacy Legal Consult

Budget target: $10,000

Scope:

- Review whether and when ClearPath is acting as a business associate.
- Review consent and authorization workflow assumptions.
- Review patient approval and revocation language.
- Identify BAA needs for future pilots.
- Advise on synthetic/de-identified data boundaries.
- Flag Phase II legal requirements.

Deliverables:

- Legal issue memo or notes
- Consent workflow recommendations
- BAA template direction
- Phase II legal/compliance checklist

### Security Architecture Review

Budget target: $7,500

Scope:

- Threat model for patient, provider, and package access.
- Review authentication and role boundaries.
- Review audit event design.
- Review package generation and section scoping.
- Review data storage and encryption assumptions.
- Recommend Phase I remediations and Phase II testing scope.

Deliverables:

- Threat model
- Security findings summary
- Remediation list
- Phase II penetration test scope

## Phase I Security Requirements

Even with synthetic data, the prototype should be built with these patterns:

- Role-based access controls
- Least-privilege database access
- Server-side authorization checks
- Clear separation between patient and provider views
- Audit logs for sensitive actions
- No PHI in logs, screenshots, support notes, or grant materials
- Secure environment variable handling
- No hardcoded secrets
- HTTPS-only hosted environments
- Data minimization by default

## Phase II Compliance Work

Phase II should fund production-grade security and compliance work before real PHI pilots.

Recommended Phase II items:

- Formal HIPAA security risk analysis
- HIPAA privacy and security policies
- Incident response plan
- Workforce training materials
- BAA templates and vendor management
- Third-party penetration test
- Vulnerability remediation
- Production monitoring and alerting
- Access review process
- Backup and disaster recovery plan
- Data retention and deletion policies
- Breach response workflow

## Penetration Testing Timing

Recommended position:

Full third-party penetration testing should happen in Phase II before ClearPath handles real PHI at pilot scale.

Reason:

Phase I should focus on feasibility and architecture using synthetic or de-identified data. A security architecture review in Phase I is enough to show responsible planning without consuming budget needed for prototype development.

Exception:

If the grant manager, award terms, pilot partner, or legal counsel requires real PHI during Phase I, then penetration testing, risk analysis, BAAs, and production security work must move earlier.

## Data Strategy

Phase I:

- Synthetic patient records
- De-identified workflow examples
- No real PHI in grant documents
- No real PHI in public demos

Phase II:

- Real PHI only after legal and security controls are in place
- BAAs with covered entities or relevant partners
- Secure pilot agreements
- Documented risk analysis
- Controlled access and audit logs

## Audit Strategy

ClearPath should audit:

- Record request created
- Patient viewed request
- Patient approved request
- Patient denied request
- Patient limited request
- Patient revoked access
- Package generated
- Provider viewed package
- Provider downloaded package
- Source office responded
- Request completed or expired

Audit events should include non-sensitive metadata where possible:

- Actor
- Role
- Practice or organization
- Patient identity reference
- Resource type
- Resource ID
- Action
- Timestamp
- Request status

## Security Roadmap Summary

Phase I:

- Design securely.
- Use synthetic or de-identified records.
- Get HIPAA/privacy guidance.
- Complete security architecture review.
- Document Phase II remediation.

Phase II:

- Prepare for real PHI.
- Complete formal risk analysis.
- Run third-party penetration test.
- Implement production security operations.
- Launch controlled pilots.
