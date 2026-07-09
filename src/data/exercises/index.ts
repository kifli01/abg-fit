import type { Exercise } from './types';
import rawCatalog from './abgfit-exercises.canonical.json';

/**
 * The full canonical exercise catalog.
 * This is the single source of truth for exercise master data in abgFit.
 */
export const exercises: Exercise[] = rawCatalog as Exercise[];

/**
 * Returns all exercises in the catalog.
 */
export function getExercises(): Exercise[] {
  return exercises;
}

/**
 * Finds an exercise by its unique id.
 */
export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id);
}

/**
 * Finds an exercise by its URL-friendly slug.
 */
export function getExerciseBySlug(slug: string): Exercise | undefined {
  return exercises.find((e) => e.slug === slug);
}

/**
 * Searches exercises by a free-text query against the searchTerms field.
 * The comparison is case-insensitive.
 */
export function searchExercises(query: string): Exercise[] {
  const q = query.trim().toLowerCase();
  if (!q) return exercises;
  return exercises.filter((e) =>
    e.searchTerms.some((term) => term.toLowerCase().includes(q))
  );
}

export type { Exercise } from './types';
