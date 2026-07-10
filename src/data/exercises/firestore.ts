import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Exercise, ExerciseImage } from './types';

const EXERCISES_COLLECTION = 'exercises';

/**
 * Loads all exercises from Firestore, ordered by name.
 */
export async function getExercisesFromFirestore(): Promise<Exercise[]> {
  const q = query(
    collection(db, EXERCISES_COLLECTION),
    orderBy('name')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as Exercise);
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
  return snap.data() as Exercise;
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

/**
 * Updates the image metadata on a Firestore exercise document.
 * Called after a successful Vercel Blob upload.
 */
export async function updateExerciseImageInFirestore(
  exerciseId: string,
  image: ExerciseImage
): Promise<void> {
  const ref = doc(db, EXERCISES_COLLECTION, exerciseId);
  await updateDoc(ref, { image });
}
