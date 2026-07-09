import React, { useState, useMemo } from 'react';
import { Text, Input, Spacer } from '@geist-ui/core';
import { searchExercises } from '../data/exercises';
import type { Exercise } from '../data/exercises';

/**
 * Exercise Library page scaffold.
 *
 * This is a minimal scaffold for Iteration 3.
 * It wires up the canonical exercise dataset and provides:
 * - A page title and description
 * - A search input backed by the existing searchExercises() utility
 * - A placeholder exercise list with a basic count and empty state
 *
 * Full exercise card UI, filters, and detail views are deferred to the next iteration.
 */
const ExerciseLibrary: React.FC = () => {
  const [query, setQuery] = useState('');

  const results: Exercise[] = useMemo(
    () => searchExercises(query),
    [query]
  );

  return (
    <div className="exercise-library">
      {/* Page header */}
      <div className="exercise-library__header">
        <Text h2 className="exercise-library__title">
          Exercise Library
        </Text>
        <Text p className="exercise-library__subtitle">
          Browse and search the full abgFit exercise catalog.
        </Text>
      </div>

      {/* Search */}
      <div className="exercise-library__search">
        <Input
          placeholder="Search exercises…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          width="100%"
          clearable
          aria-label="Search exercises"
          crossOrigin={undefined}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
        />
      </div>

      <Spacer h={1} />

      {/* Results area */}
      {results.length === 0 ? (
        <div className="exercise-library__empty">
          <EmptyIcon />
          <Text p className="exercise-library__empty-text">
            No exercises found for &ldquo;{query}&rdquo;
          </Text>
        </div>
      ) : (
        <div className="exercise-library__list-area">
          <Text small className="exercise-library__count">
            {results.length} exercise{results.length !== 1 ? 's' : ''}
            {query ? ` matching "${query}"` : ' in catalog'}
          </Text>
          <Spacer h={0.5} />
          {/* Placeholder list — full card UI comes in the next iteration */}
          <ul className="exercise-library__list" role="list">
            {results.slice(0, 30).map((exercise) => (
              <li key={exercise.id} className="exercise-library__list-item">
                <div className="exercise-library__item-name">{exercise.name}</div>
                <div className="exercise-library__item-meta">
                  <span className="exercise-library__item-tag">
                    {exercise.category}
                  </span>
                  {exercise.equipment && (
                    <span className="exercise-library__item-tag">
                      {exercise.equipment}
                    </span>
                  )}
                  <span
                    className={`exercise-library__item-level exercise-library__item-level--${exercise.level}`}
                  >
                    {exercise.level}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {results.length > 30 && (
            <Text small className="exercise-library__more">
              Showing first 30 of {results.length} results.
              Full list and filtering coming in the next iteration.
            </Text>
          )}
        </div>
      )}
    </div>
  );
};

function EmptyIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="exercise-library__empty-icon"
    >
      <circle cx="22" cy="22" r="14" stroke="currentColor" strokeWidth="2.5" />
      <line x1="32" y1="32" x2="43" y2="43" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="17" y1="22" x2="27" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default ExerciseLibrary;
