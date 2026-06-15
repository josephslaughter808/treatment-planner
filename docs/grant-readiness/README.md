# Grant Readiness

This folder collects the technical foundation for positioning ClearPath as a patient-controlled health data hub, not only a medical check-in form.

## Documents

- [Canonical Health Record Model](./canonical-health-record-model.md)
- [Consent Package Spec](./consent-package-spec.md)
- [Patient Health Information Software Market Map](./patient-health-information-software-map.md)
- [Patient Health Information Software Exchange Matrix](./patient-health-information-software-exchange-matrix.md)

## Immediate Build Priorities

1. Convert the current patient vault into a normalized person-centered record model.
2. Promote share links into first-class consent packages.
3. Add audit events around profile edits, package creation, provider views, and provider review acknowledgement.
4. Generate provider check-in snapshots from consent packages.
5. Compare repeat-patient snapshots and display grouped change alerts.
6. Use the software market map to choose the first connector targets after the pilot workflow is stable.
7. Use the exchange matrix to prioritize API, FHIR, HL7, CSV, PDF, and manual reviewed-import research.
