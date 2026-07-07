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

### 1. Foundation — Hello World PWA

Goal: A working, deployed React PWA shell that meets modern standards.

- React app initialisation, Vercel deploy
- PWA configuration: manifest, service worker, installability
- Basic navigation and layout shell
- Design system and brand foundations (abgFit visual identity)
- Success criterion: installable, publicly accessible app with an empty but correct shell

### 2. Firebase Integration

Goal: User management and data storage foundation.

- Firebase Auth: Google / email sign-in
- Firestore data model design and setup
- Basic user profile
- All secrets in Vercel environment variables only
- Success criterion: sign in, sign out, read and write own data

### 3. Exercise Library — Research and Data

Goal: The content foundation of the app.

- Define muscle groups, movement patterns, and categories
- Compile a broad exercise list (research-based)
- Each exercise: name, description, muscles, equipment, difficulty, video/image reference
- Load exercises into Firestore via admin UI or script
- Success criterion: browsable, filterable exercise library in the app

### 4. Manual Workout Builder

Goal: Users can build and follow their own programs.

- Program builder UI: select and order exercises
- Multi-day program structure (e.g. 5-day split)
- Workout tracking: active session view, progress saving
- Training log — current position within the program
- Success criterion: create a program, start it, track daily progress

### 5. AI Integration

Goal: Secure AI backend connection.

- Select and integrate an AI provider (API key server-side only, never in the client)
- Chat interface in the app
- System prompt: abgFit context, exercise library awareness
- Success criterion: secure AI chat works in the app and knows the exercise library

### 6. AI Features

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
