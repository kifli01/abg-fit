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
 * Nested image metadata stored on a Firestore exercise document.
 *
 * Shape (new format):
 *   image: null | {
 *     url:       string | null,   // full-resolution CDN URL
 *     path:      string | null,   // Blob storage path for the original
 *     updatedAt: string | null,   // ISO-8601 timestamp of the last upload
 *     thumbUrl:  string | null,   // thumbnail CDN URL (uploaded 128x128; displayed 64x64 in UI)
 *     thumbPath: string | null,   // Blob storage path for the thumbnail
 *   }
 *
 * Backward compatibility:
 *   Older Firestore documents store image data as flat top-level fields
 *   (imageUrl, imagePath, imageUpdatedAt, imageThumbUrl, imageThumbPath).
 *   The Firestore read layer maps both formats into this type so all
 *   application code works with the nested shape only.
 *   New writes must use the nested object format.
 */
export interface ExerciseImage {
  url: string | null;
  path: string | null;
  updatedAt: string | null;
  thumbUrl: string | null;
  thumbPath: string | null;
}

/**
 * The runtime exercise shape — loaded from Firestore.
 * `hasMedia` is excluded; `image` is a nested optional object or null.
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
  /**
   * Optional nested image object. null means the exercise has no image.
   * Access patterns:
   *   - collapsed/list view : exercise.image?.thumbUrl
   *   - expanded view       : exercise.image?.url
   *   - no-image guard      : exercise.image === null
   */
  image: ExerciseImage | null;
}
