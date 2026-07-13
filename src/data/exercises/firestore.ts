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
 * Maps a raw Firestore document payload to the Exercise runtime type.
 * Safely handles missing or null image fields and optional thumbnail fields.
 */
function toExercise(data: DocumentData): Exercise {
  const raw = data.image ?? null;
  const image: ExerciseImage | null = raw
    ? {
        imageUrl: raw.imageUrl ?? '',
        imagePath: raw.imagePath ?? '',
        imageUpdatedAt: raw.imageUpdatedAt ?? '',
        ...(raw.imageThumbUrl ? { imageThumbUrl: raw.imageThumbUrl } : {}),
        ...(raw.imageThumbPath ? { imageThumbPath: raw.imageThumbPath } : {}),
      }
    : null;

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
