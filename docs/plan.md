# abgFit — Product Plan

## Vision

abgFit is a workout planning PWA. Users can build their own training programs from a curated, research-backed exercise library, then track their progress across multi-day programs. The app also includes AI: the user describes their goals, preferences, and schedule, and the AI assembles a personalised program — which can then be refined through chat.

---

## Stack

- **Frontend**: React PWA (Create React App or Vite-based setup)
- **Hosting**: Vercel
- **Backend / DB**: Firebase (Auth + Firestore)
- **AI**: Server-side API integration (provider TBD)
- No framework (e.g. Next.js) is assumed unless explicitly approved for a given iteration

---

## Conventions

- **Language — implementation**: All code, documentation, UI copy, branch names, commit messages, and PR descriptions must be in **English**
- **Language — conversation**: Direct conversation with the project owner may be in Hungarian
- **Naming**: Keep names clear, consistent, and brand-appropriate for abgFit
- **Secrets**: No secrets, API keys, or credentials in the repository — Vercel environment variables only

---

## Iterations

### 1. ✅ Foundation — Hello World PWA

Goal: A working, deployed React PWA shell that meets modern standards.

- React app initialisation, Vercel deploy
- PWA configuration: manifest, service worker, installability
- Basic navigation and layout shell
- Design system and brand foundations (abgFit visual identity)
- Success criterion: installable, publicly accessible app with an empty but correct shell

### 2. ✅ Firebase Integration

Goal: User management and data storage foundation.

- Firebase Auth: Google / email sign-in
- Firestore data model design and setup
- Basic user profile
- All secrets in Vercel environment variables only
- Success criterion: sign in, sign out, read and write own data

### 3. ✅ Exercise Library — Research and Data

Goal: The content foundation of the app.

**Approach — canonical static dataset:**

- A curated, research-backed exercise dataset is stored as a canonical JSON file inside the repository (`src/data/exercises/abgfit-exercises.canonical.json`)
- This file is the single source of truth for exercise master data — versioned alongside the app code
- TypeScript types and helper functions (`src/data/exercises/`) provide typed access to the catalog
- The dataset is imported directly via Vite's native JSON import — no runtime fetch, no separate build step
- The same source is used for both the app UX (listing, filtering, search) and later AI features (prompt preparation, context injection)
- Firestore is intentionally **not** used for exercise master data at this stage; it may be introduced later only if admin editing or dynamic update workflows justify it
- Images and media are out of scope for now

**Remaining work for this iteration:**

- Exercise listing and filtering UI — browsable, searchable exercise library in the app
- Each exercise: name, muscles, equipment, difficulty displayed in the UI

- Success criterion: browsable, filterable exercise library in the app backed by the canonical dataset

### 4. UI cleanup

Remove all visible `abgFit` text from the user-facing interface.

This change is presentation-only. It should not change routing, authentication, or feature behavior.

### 5. Exercise data migration

Move `abgfit-exercises.canonical.json` from static runtime usage into Firebase Firestore.

The JSON file should become a seed/import source only. The application should load exercises from Firestore so exercise fields can be updated later without changing the codebase.

### 6. Image prompt action

Add an admin-only `Img Prompt` button to the expanded exercise card.

The button should generate and copy an English prompt based on the exercise name and description. The generated prompt should instruct an external image AI tool to create a square 1:1 exercise image suitable for a workout application.

### 7. Exercise image upload

Add an admin-only `Upload Image` / `Change Image` action to the expanded exercise card.

Uploaded exercise images should be stored in Vercel Blob public storage. Related metadata should be stored on the corresponding Firestore exercise document, including:

- `imageUrl`
- `imagePath`
- `imageUpdatedAt`

The application should load and render the stored exercise image from this persisted data source.

### 8. Manual Workout Builder

Goal: Users can build and follow their own programs.

- Program builder UI: select and order exercises
- Multi-day program structure (e.g. 5-day split)
- Workout tracking: active session view, progress saving
- Training log — current position within the program
- Success criterion: create a program, start it, track daily progress

### 9. AI Integration

Goal: Secure AI backend connection.

- Select and integrate an AI provider (API key server-side only, never in the client)
- Chat interface in the app
- System prompt: abgFit context, exercise library awareness
- Success criterion: secure AI chat works in the app and knows the exercise library

### 10. AI Features

Goal: Personalised program generation and iteration via AI.

- Program generation from chat: user describes preferences, AI assembles a program
- Iteration: modify an existing program through chat (e.g. "swap out squats")
- Save and apply AI suggestions to the program builder
- Longer-term: AI aware of the user's history and training log
- Success criterion: full AI-driven program creation and editing

---

## Principles

- **Iterative**: every iteration delivers a deployable, self-contained increment of value
- **PWA-first**: offline capability and installability are top priorities
- **Security**: secrets never go into the repo; all sensitive config lives in Vercel env vars
- **Simplicity**: details are worked out iteration by iteration; the plan sets direction, not specification
- **Quality**: frontend and UX quality is a concern at every step
