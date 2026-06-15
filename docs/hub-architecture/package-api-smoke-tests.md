# ClearPath Package API Smoke Tests

## Purpose

These smoke tests verify the Day 2 package API until the repo has a formal automated test runner.

## Preconditions

- Supabase environment variables are configured.
- The signed-in user has a valid bearer token.
- The patient vault exists for the email being tested.

## Generate ClearPath JSON

```bash
curl -s \
  -H "Authorization: Bearer $CLEARPATH_ACCESS_TOKEN" \
  "https://clearpath-care.vercel.app/api/packages?email=patient@example.com&format=clearpath-json"
```

Expected:

- `format` is `clearpath-json`
- `package.packageVersion` is `1.0.0`
- `validation.valid` is `true`
- `checksumSha256` is present
- `storedPackage.packageId` is present

## Generate CSV

```bash
curl -s \
  -H "Authorization: Bearer $CLEARPATH_ACCESS_TOKEN" \
  "https://clearpath-care.vercel.app/api/packages?email=patient@example.com&format=csv"
```

Expected:

- `format` is `csv`
- `translated.mimeType` is `text/csv`
- `translated.payload` starts with `section,id,name,details`

## Generate PDF Source

```bash
curl -s \
  -H "Authorization: Bearer $CLEARPATH_ACCESS_TOKEN" \
  "https://clearpath-care.vercel.app/api/packages?email=patient@example.com&format=pdf-text"
```

Expected:

- `format` is `pdf-text`
- `translated.format` is `human-readable-pdf`
- `translated.payload` contains `ClearPath Patient Summary`

## Generate Open Dental Preview

```bash
curl -s \
  -H "Authorization: Bearer $CLEARPATH_ACCESS_TOKEN" \
  "https://clearpath-care.vercel.app/api/packages?email=patient@example.com&format=open-dental-preview"
```

Expected:

- `format` is `open-dental-preview`
- `translated.format` is `open-dental-preview`
- `translated.warnings` says this is preview-only
- The payload can be reviewed before any chart write occurs

## Revoke A Package

```bash
curl -s \
  -X PATCH \
  -H "Authorization: Bearer $CLEARPATH_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"packageId":"pkg-example","reason":"Patient revoked access."}' \
  "https://clearpath-care.vercel.app/api/packages"
```

Expected:

- Response includes `message: "ClearPath package revoked."`
- `clearpath_packages.status` becomes `revoked`
- `audit_logs` includes `clearpath_package_revoked`

## Negative Checks

- Missing bearer token returns `401` when Supabase is configured.
- Wrong patient email returns `403`.
- Missing patient vault returns `404`.
- Malformed or incomplete package returns `422`.

