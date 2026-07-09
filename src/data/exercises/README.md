# Exercise Data

This folder contains the canonical exercise dataset for abgFit.

## Source of truth

`abgfit-exercises.canonical.json` is the authoritative master dataset for exercise data.
It is versioned alongside the application code and serves as the single source of truth
for exercise master data in both the app and any future AI features.

## What is here

| File | Purpose |
|---|---|
| `abgfit-exercises.canonical.json` | Canonical exercise catalog (source of truth) |
| `types.ts` | TypeScript model for a single exercise entry |
| `index.ts` | Typed catalog export + helper functions |

## Usage

```ts
import { getExercises, getExerciseById, getExerciseBySlug, searchExercises } from '@/data/exercises';

// All exercises
const all = getExercises();

// By ID or slug
const squat = getExerciseBySlug('barbell-squat');

// Free-text search
const results = searchExercises('chest compound');
```

## Design decisions

- The JSON is imported directly via Vite's native JSON import — no runtime fetch, no separate build step.
- Firestore is intentionally **not** used for exercise master data at this stage.
  The static dataset is sufficient for listing, filtering, and AI prompt preparation.
  Firestore may be introduced later if admin editing or workflow needs justify it.
- Images and media are out of scope for now (`hasMedia` flags entries that have media in the upstream source).

## Data source

Derived from [free-exercise-db](https://github.com/yuhonas/free-exercise-db), licensed under the Unlicense.
