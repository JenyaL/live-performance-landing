# Live Performance Landing

A musician landing page with an admin panel for content management.

## What's Included

- Landing page:
  - Header with navigation
  - Hero section
  - Music section (YouTube previews)
  - Photo gallery section
  - Footer with contacts and copyright
- Admin panel (`/admin`):
  - Hero content editing
  - Track management (YouTube links)
  - Photo uploads to Cloudinary
  - Contact data editing

## Tech Stack

- React + TypeScript + Vite
- React Router
- Firebase Firestore (content)
- Cloudinary (images)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file based on `.env.example`.

3. Fill in Firebase and Cloudinary variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

4. Start development server:

```bash
npm run dev
```

5. Production build:

```bash
npm run build
```

## Firestore Data Structure

Document: `landing/main`

Includes:
- artistName
- heroTitle
- heroSubtitle
- heroImageUrl
- heroImagePositionX
- heroImagePositionY
- navItems[]
- tracks[]
- gallery[]
- contacts

Additional collections used for admin security and auditing:
- `admin_users/{uid}`: admin allowlist entry. Create documents manually in Firestore for users who can access `/admin` and save changes.
- `admin_logs/{autoId}`: immutable audit log entries created on each save from admin panel.

Audit log document fields:
- `createdAt` (server timestamp)
- `actorEmail`
- `actorUid`
- `action` (`save_landing_content`)
- `targetPath` (`landing/main`)
- `savedSummary` (what was saved: artist, hero text, counts, contacts)

## Deploy to Firebase Hosting via GitHub Actions

Workflow: `.github/workflows/firebase-hosting-deploy.yml`

Deployment runs:
- on `push` to branch `main_git`
- manually via `workflow_dispatch`

Required GitHub Secrets:

- `FIREBASE_SERVICE_ACCOUNT_MY_DIGITAL_PROFILE_E9F92`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

The Firebase project is set in `.firebaserc` as `my-digital-profile-e9f92`.
