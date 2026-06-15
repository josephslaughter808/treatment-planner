# Day One Translator Hub Architecture

## Goal

Day one locks the pattern for the ClearPath translating hub. The goal is not to build every translator. The goal is to make every future translator map through one canonical package so ClearPath does not become hundreds of one-off integrations.

## Core Decision

ClearPath will use a versioned ClearPath JSON package as the internal exchange language.

Storage can remain relational for accounts, practices, permissions, consent packages, and audit logs. Versioned medical-history snapshots can use encrypted JSONB. Translators should not read random UI state directly; they should receive a `ClearPathPackage`.

## Translation Flow

```text
Patient profile or outside file
  -> input translator
  -> ClearPath canonical model
  -> consent package
  -> output translator
  -> receiving office/system
```

## Package Version

Current package version:

```text
1.0.0
```

The version is defined in:

```text
lib/clearpath-package.ts
```

Formal schema and sample package:

```text
docs/hub-architecture/clearpath-package.schema.json
docs/hub-architecture/sample-clearpath-package.json
```

## Initial Translator Targets

Phase-one translator targets:

- PDF summary source
- CSV export
- Open Dental reviewed-import preview

These are intentionally practical. They let a pilot office use ClearPath before we promise direct EHR writes.

## Folder Structure

```text
lib/clearpath-package.ts
lib/translators/index.ts
lib/translators/to-pdf.ts
lib/translators/to-csv.ts
lib/translators/to-open-dental.ts
```

## First Implementation Rule

All translators should accept a `ClearPathPackage` and return a `ClearPathTranslatorResult`.

This keeps the architecture stable:

```text
ClearPathPackage -> translator -> payload + warnings + format metadata
```

## Open Dental Rule

The first Open Dental target is a reviewed-import preview, not a direct database write.

Reasons:

- It is safer for a pilot.
- It lets staff review before charting.
- It avoids silent clinical overwrites.
- Open Dental write actions should use an approved API workflow, not direct database writes.

## Day Two Ready State

Day two can now build on this by wiring the current patient profile into `buildClearPathPackage()` and exposing a provider-side package preview/download flow.

## Day Two Completion Notes

Day two adds `/api/packages`, package validation, SHA-256 checksums, Supabase package storage, package revocation support, and smoke-test steps in:

```text
docs/hub-architecture/package-api-smoke-tests.md
```
