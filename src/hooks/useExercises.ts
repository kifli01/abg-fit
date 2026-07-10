import { useState, useEffect, useCallback } from 'react';
import { getExercises } from '../data/exercises';
import type { Exercise, ExerciseImage } from '../data/exercises';

interface UseExercisesResult {
  exercises: Exercise[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => void;
  query: string;
  updateLocalExerciseImage: (exerciseId: string, image: ExerciseImage) => void;
}

/**
 * Loads exercises from Firestore and provides a client-side search interface.
 * Also exposes updateLocalExerciseImage to optimistically update card state
 * immediately after an image upload without re-fetching Firestore.
 */
export function useExercises(): UseExercisesResult {
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getExercises()
      .then((data) => {
        if (cancelled) return;
        setAllExercises(data);
        setExercises(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load exercises from Firestore:', err);
        setError('Failed to load exercises. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const search = useCallback(
    (q: string) => {
      setQuery(q);
      const trimmed = q.trim().toLowerCase();
      if (!trimmed) {
        setExercises(allExercises);
        return;
      }
      setExercises(
        allExercises.filter((e) =>
          e.searchTerms.some((term) => term.toLowerCase().includes(trimmed))
        )
      );
    },
    [allExercises]
  );

  /**
   * Optimistically patches the in-memory exercise list with new image metadata
   * after a successful upload — no Firestore re-fetch required.
   */
  const updateLocalExerciseImage = useCallback(
    (exerciseId: string, image: ExerciseImage) => {
      const patch = (list: Exercise[]): Exercise[] =>
        list.map((e) => (e.id === exerciseId ? { ...e, image } : e));
      setAllExercises((prev) => patch(prev));
      setExercises((prev) => patch(prev));
    },
    []
  );

  return { exercises, isLoading, error, search, query, updateLocalExerciseImage };
}
