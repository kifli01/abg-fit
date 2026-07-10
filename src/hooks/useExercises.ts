import { useState, useEffect, useCallback } from 'react';
import { getExercises } from '../data/exercises';
import type { Exercise } from '../data/exercises';

interface UseExercisesResult {
  exercises: Exercise[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => void;
  query: string;
}

/**
 * Loads exercises from Firestore and provides a client-side search interface.
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

  return { exercises, isLoading, error, search, query };
}
