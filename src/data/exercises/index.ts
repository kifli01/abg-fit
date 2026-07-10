/**
 * Exercise data layer for abgFit.
 *
 * Runtime source: Firestore (`exercises` collection)
 * Seed source:    abgfit-exercises.canonical.json (import/admin use only)
 *
 * The canonical JSON is no longer the active runtime source.
 * It is kept in the repository as the seed/import reference for the
 * admin exercise import flow.
 */

export { getExercisesFromFirestore as getExercises } from './firestore';
export { getExerciseByIdFromFirestore as getExerciseById } from './firestore';
export { searchExercisesFromFirestore as searchExercises } from './firestore';
export { canonicalToFirestoreDoc } from './transform';
export type { Exercise, CanonicalExercise, ExerciseImage } from './types';

/**
 * Seed catalog — for admin import use only.
 * This import must NOT be used in any runtime feature code path.
 */
export { default as canonicalExerciseSeed } from './abgfit-exercises.canonical.json';
