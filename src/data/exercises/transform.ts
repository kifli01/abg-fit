import type { CanonicalExercise, Exercise } from './types';

/**
 * Transforms a canonical exercise record into the Firestore document shape.
 *
 * - Strips `hasMedia` (not stored in Firestore)
 * - Adds `image: null` (populated later via iteration 7)
 */
export function canonicalToFirestoreDoc(canonical: CanonicalExercise): Exercise {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hasMedia: _hasMedia, ...rest } = canonical;
  return {
    ...rest,
    image: null,
  };
}
