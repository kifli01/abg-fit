/**
 * Canonical exercise type definitions for abgFit.
 * Aligned with the structure of abgfit-exercises.canonical.json.
 */

export type ExerciseForce = 'push' | 'pull' | 'static';
export type ExerciseLevel = 'beginner' | 'intermediate' | 'expert';
export type ExerciseMechanic = 'isolation' | 'compound';

export interface ExerciseSource {
  name: 'free-exercise-db';
  license: 'Unlicense';
  sourceId: string;
}

/**
 * The canonical shape as it exists in the JSON seed file.
 * Contains `hasMedia` which is excluded from Firestore documents.
 */
export interface CanonicalExercise {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  force: ExerciseForce | null;
  level: ExerciseLevel;
  mechanic: ExerciseMechanic | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  searchTerms: string[];
  hasMedia: boolean;
  source: ExerciseSource;
}

/**
 * Image metadata stored on a Firestore exercise document.
 * Initially null; populated after iteration 7 (exercise image upload).
 */
export interface ExerciseImage {
  url: string;
  path: string;
  updatedAt: string;
}

/**
 * The runtime exercise shape — loaded from Firestore.
 * `hasMedia` is excluded; `image` replaces it.
 */
export interface Exercise {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  force: ExerciseForce | null;
  level: ExerciseLevel;
  mechanic: ExerciseMechanic | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  searchTerms: string[];
  source: ExerciseSource;
  image: ExerciseImage | null;
}
