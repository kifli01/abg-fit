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

### 4. ✅ UI cleanup

Remove all visible `abgFit` text from the user-facing interface.

This change is presentation-only. It should not change routing, authentication, or feature behavior.

### 5. ✅ Exercise data migration

Move `abgfit-exercises.canonical.json` from static runtime usage into Firebase Firestore.

The JSON file should become a seed/import source only. The application should load exercises from Firestore so exercise fields can be updated later without changing the codebase.

### 6. ✅ Image prompt action

Add an admin-only `Img Prompt` button to the expanded exercise card.

The button should generate and copy an English prompt based on the exercise name and description. The generated prompt should instruct an external image AI tool to create a square 1:1 exercise image suitable for a workout application.

## 7. Exercise image upload

Break this task into small, independent implementation steps. Each sub-task must be delivered in its own branch and its own pull request.

### 7.1 Admin role exposure

**Goal**
Expose a dedicated role-based `isAdmin` flag in the existing auth flow.

**Area**
- `src/features/auth/AuthProvider.tsx`
- `src/features/auth/types.ts`
- Firestore allowlist access logic

**Expected outcome**
- The auth layer reads the existing allowlist role from `allowedAccounts/{email}.role`.
- The app exposes a separate `isAdmin` flag instead of treating all allowed users as admins.
- No image upload logic is introduced in this step.

**PR scope**
- This sub-task must be implemented and reviewed as a standalone PR.
- Do not combine it with image model, UI, or upload pipeline work.

### 7.2 Exercise image metadata model

**Goal**
Define a nested, optional image object on exercises to avoid flat-field duplication and simplify null-handling.

**Area**
- `src/data/exercises/types.ts` — `ExerciseImage` interface and `Exercise` interface
- `src/data/exercises/firestore.ts` — Firestore read/parse layer
- `src/hooks/useExercises.ts` — JSDoc on the returned exercise shape

**Expected outcome**

Each exercise optionally includes a single nested image object:

```ts
image: null | {
  url:       string | null;   // full-resolution CDN URL
  path:      string | null;   // Blob storage path for the original
  updatedAt: string | null;   // ISO-8601 timestamp of the last upload
  thumbUrl:  string | null;   // 128×128 thumbnail CDN URL
  thumbPath: string | null;   // Blob storage path for the thumbnail
}
```

`image === null` means the exercise has no image at all. The individual sub-fields (`url`, `thumbUrl`, etc.) may also be `null` within a non-null image object when a particular asset is not yet available.

**Backward compatibility**

Existing Firestore documents that still store image data as flat top-level fields (`imageUrl`, `imagePath`, `imageUpdatedAt`, `imageThumbUrl`, `imageThumbPath`) must continue to load correctly. The Firestore read layer implements a migration-mapping step (`parseExerciseImage`) that transparently converts both formats into the `ExerciseImage` shape:

- If `doc.image` is an object → use the nested format directly.
- Else if any of the flat fields (`imageUrl`, `imagePath`, etc.) are present → construct an `ExerciseImage` from them.
- Otherwise → `image = null`.

New writes must store the nested object format only. No client-side behavior changes if an exercise has no image; `image` may be `null` or missing.

**Testing**

- Add unit tests for `parseExerciseImage` covering: (1) nested → nested, (2) flat → nested, (3) missing → null.
- Tests live in `src/data/exercises/__tests__/parseExerciseImage.test.ts`.

**PR scope**
- This sub-task must be implemented and reviewed as a standalone PR.
- Do not combine it with rendering or upload actions.

### 7.3 Read-only image rendering

**Goal**
Render exercise images in the UI using the nested image object.

**Area**
- `src/pages/ExerciseLibrary.tsx`
- related shared styles, if needed
- collapsed/list card and expanded card rendering

**Expected outcome**

Image rendering rules based on the nested `image` shape:

| Context | Source field | Fallback |
|---|---|---|
| Collapsed / list card thumbnail | `exercise.image?.thumbUrl` | placeholder icon |
| Expanded card (full-width) | `exercise.image?.url` | placeholder icon |
| No image at all | `exercise.image === null` | placeholder icon |

- Show a 64×64 thumbnail in the list or collapsed card UI using `exercise.image?.thumbUrl`.
- Show the full-resolution image at the top of the expanded section using `exercise.image?.url`.
- Do not upscale images.
- Use stable layout behavior and sensible `object-fit` rules.
- Fall back to the placeholder icon whenever `image` is `null` or the specific URL field is `null`.

**PR scope**
- This sub-task must be implemented and reviewed as a standalone PR.
- Do not combine it with upload, Blob, or Firestore write logic.

### 7.4 Admin-only upload action

**Goal**
Add the admin-only image upload entry point to the expanded exercise card.

**Area**
- `src/pages/ExerciseLibrary.tsx`
- auth-based conditional UI around admin actions

**Expected outcome**
- Add an admin-only `Upload Image` / `Change Image` action to the expanded exercise card.
- Hide this action for non-admin users.
- Keep the implementation aligned with the current auth system and the exposed `isAdmin` state.

**PR scope**
- This sub-task must be implemented and reviewed as a standalone PR.
- Do not combine it with client-side image processing or persistence.

### 7.5 Client-side image validation and processing

**Goal**
Validate the selected image file and prepare the original plus thumbnail assets before upload.

**Area**
- upload-related client helper logic
- expanded exercise card upload flow

**Expected outcome**
- Restrict selection to image files only.
- Prefer jpeg, png, and webp.
- Add basic loading and error states.
- Generate exactly two assets during the client upload flow:
  1. original image
  2. 128x128 thumbnail
- The thumbnail must be square and center-cropped.
- The thumbnail is intended for 64x64 UI display.
- Do not generate a separate preview variant.
- Do not upscale the original image.

**PR scope**
- This sub-task must be implemented and reviewed as a standalone PR.
- Do not combine it with Blob upload or Firestore document updates.

### 7.6 Vercel Blob upload integration

**Goal**
Upload the processed exercise images to the connected Vercel Blob store.

**Area**
- Vercel Blob integration
- upload pipeline
- any required API or helper layer already present in the repository

**Expected outcome**
- Add the minimal required `@vercel/blob` integration.
- Upload the original image to the connected Blob store `abg-fit-blob`.
- Upload the generated thumbnail as a separate Blob object.
- Store and return the uploaded Blob URLs and paths needed by the app.

**PR scope**
- This sub-task must be implemented and reviewed as a standalone PR.
- Do not combine it with Firestore metadata persistence.

**Notes**
- Do not assume extra manual Blob token setup is needed unless the actual repository/runtime proves otherwise.

### 7.7 Firestore image metadata persistence

**Goal**
Persist uploaded image metadata on the related Firestore exercise document using the nested image object format.

**Area**
- Firestore exercise write path
- exercise document update logic

**Expected outcome**
- Save the upload metadata on the related Firestore exercise document as a single nested `image` object:
  ```ts
  image: {
    url:       string;   // full-resolution CDN URL
    path:      string;   // Blob storage path for the original
    updatedAt: string;   // ISO-8601 timestamp
    thumbUrl:  string;   // thumbnail CDN URL
    thumbPath: string;   // Blob storage path for the thumbnail
  }
  ```
- Do not write the old flat fields (`imageUrl`, `imagePath`, etc.).
- Keep the write path minimal and aligned with the current exercise data model.

**PR scope**
- This sub-task must be implemented and reviewed as a standalone PR.
- Do not combine it with rendering refinements or broader refactors.

### 7.8 Immediate UI refresh after upload

**Goal**
Refresh local UI state so the uploaded image appears immediately after a successful update.

**Area**
- local exercise state management
- exercise upload success flow

**Expected outcome**
- After a successful upload and Firestore update, the new thumbnail and original image appear immediately in the UI.
- Avoid requiring a full manual page refresh.
- Keep the state update minimal and consistent with the existing hook and page structure.

**PR scope**
- This sub-task must be implemented and reviewed as a standalone PR.
- Do not combine it with unrelated state management refactors.

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
