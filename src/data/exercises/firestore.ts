import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Exercise, ExerciseImage } from './types';

const EXERCISES_COLLECTION = 'exercises';

/**
 * Maps a raw Firestore document's image data to the nested ExerciseImage shape.
 *
 * Supports two source formats for backward compatibility:
 *
 *   (a) New nested format — the document has an `image` field that is an object:
 *         { url, path, updatedAt, thumbUrl, thumbPath }
 *
 *   (b) Legacy flat format — the document has top-level flat fields:
 *         imageUrl, imagePath, imageUpdatedAt, imageThumbUrl, imageThumbPath
 *
 *   (c) No image — neither format is present; returns null.
 *
 * New writes should always use the nested object format (a).
 *
 * This function is exported so it can be unit-tested independently.
 */
export function parseExerciseImage(data: DocumentData): ExerciseImage | null {
  // (a) New nested format
  if (data.image !== null && data.image !== undefined && typeof data.image === 'object') {
    const img = data.image as Record<string, unknown>;
    return {
      url:       typeof img.url       === 'string' ? img.url       : null,
      path:      typeof img.path      === 'string' ? img.path      : null,
      updatedAt: typeof img.updatedAt === 'string' ? img.updatedAt : null,
      thumbUrl:  typeof img.thumbUrl  === 'string' ? img.thumbUrl  : null,
      thumbPath: typeof img.thumbPath === 'string' ? img.thumbPath : null,
    };
  }

  // (b) Legacy flat format
  const hasFlat =
    data.imageUrl ||
    data.imagePath ||
    data.imageUpdatedAt ||
    data.imageThumbUrl ||
    data.imageThumbPath;

  if (hasFlat) {
    return {
      url:       typeof data.imageUrl       === 'string' ? data.imageUrl       : null,
      path:      typeof data.imagePath      === 'string' ? data.imagePath      : null,
      updatedAt: typeof data.imageUpdatedAt === 'string' ? data.imageUpdatedAt : null,
      thumbUrl:  typeof data.imageThumbUrl  === 'string' ? data.imageThumbUrl  : null,
      thumbPath: typeof data.imageThumbPath === 'string' ? data.imageThumbPath : null,
    };
  }

  // (c) No image
  return null;
}

/**
 * Maps a raw Firestore document payload to the Exercise runtime type.
 * Delegates image parsing to parseExerciseImage() for format-agnostic mapping.
 */
function toExercise(data: DocumentData): Exercise {
  const image: ExerciseImage | null = parseExerciseImage(data);
  return { ...(data as Omit<Exercise, 'image'>), image };
}

/**
 * Loads all exercises from Firestore, ordered by name.
 */
export async function getExercisesFromFirestore(): Promise<Exercise[]> {
  const q = query(
    collection(db, EXERCISES_COLLECTION),
    orderBy('name')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toExercise(d.data()));
}

/**
 * Loads a single exercise by ID from Firestore.
 */
export async function getExerciseByIdFromFirestore(
  id: string
): Promise<Exercise | undefined> {
  const ref = doc(db, EXERCISES_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return undefined;
  return toExercise(snap.data());
}

/**
 * Searches exercises in Firestore by free-text query against searchTerms.
 * Loads all documents and filters client-side (suitable for the current dataset size).
 */
export async function searchExercisesFromFirestore(
  rawQuery: string
): Promise<Exercise[]> {
  const all = await getExercisesFromFirestore();
  const q = rawQuery.trim().toLowerCase();
  if (!q) return all;
  return all.filter((e) =>
    e.searchTerms.some((term) => term.toLowerCase().includes(q))
  );
}
