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
  hasMedia: boolean;
  source: ExerciseSource;
}
