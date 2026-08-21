# ClearPath Care

ClearPath Care is a secure patient intake and health information platform designed to reduce repeated medical paperwork and give patients greater control over how their information is shared with care teams.

**Live application:** [clearpath-care.vercel.app](https://clearpath-care.vercel.app)

> ClearPath Care is an active prototype and is not intended for production use with real patient information.

## Product vision

Patients are frequently asked to repeat the same medical history, medication, allergy, insurance, and consent information. ClearPath Care explores a reusable patient profile that can support office check in, structured provider review, and controlled information sharing.

## Current capabilities

- Patient account creation and authenticated sessions
- Structured medical history, medication, allergy, insurance, and profile workflows
- Reusable patient vault and office check in records
- Provider patient database and new patient intake views
- Patient controlled sharing links and package previews
- Family, emergency card, document, timeline, and care team experiences
- Health map and diagnosis detail interfaces
- Practice settings, integration hub, and team directory views
- Application level encryption for sensitive vault snapshots and check in notes

## Architecture and security work

- Next.js App Router with server side API routes
- Supabase authentication, database services, row level security, and private storage
- AES 256 GCM field encryption for sensitive stored snapshots
- Request authentication and session cookie handling
- Structured database schema for practices, users, patients, vaults, check ins, share links, case files, and audit records
- React Three Fiber and Three.js for interactive health visualization work

## Technology

- Next.js 16 and React 19
- TypeScript
- Supabase
- React Three Fiber, Drei, and Three.js
- Vercel

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Local development can display setup guidance when required Supabase or encryption credentials are missing. Never use real patient information in an unreviewed development environment.

## Development status

The hosted application demonstrates the current product direction and interface. Work remains on pilot quality assurance, audit logging, patient invitations, provider workflows, security review, and production compliance before real clinical use.

## Author

Designed and developed by [Joseph Slaughter](https://github.com/josephslaughter808) as an independent healthcare software project.
