import React, { useState, useMemo } from 'react';
import { Text, Input, Spacer } from '@geist-ui/core';
import { searchExercises } from '../data/exercises';
import type { Exercise } from '../data/exercises';

/**
 * Exercise Library page — Iteration 3 refined scaffold.
 *
 * Renders exercise results as full-width expandable cards.
 * Each card has:
 *   - A square image placeholder on the left
 *   - Exercise name + compact metadata in the middle
 *   - An expand/collapse chevron on the right
 * Expanded content shows category, equipment, level, muscles, and instructions preview.
 *
 * Media fetching and final polished detail experience are deferred.
 */
const ExerciseLibrary: React.FC = () => {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const results: Exercise[] = useMemo(
    () => searchExercises(query),
    [query]
  );

  function toggleCard(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

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

          <div className="exercise-cards" role="list">
            {results.slice(0, 30).map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                isExpanded={expandedId === exercise.id}
                onToggle={() => toggleCard(exercise.id)}
              />
            ))}
          </div>

          {results.length > 30 && (
            <Text small className="exercise-library__more">
              Showing first 30 of {results.length} results.
            </Text>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ExerciseCard
// ---------------------------------------------------------------------------

interface ExerciseCardProps {
  exercise: Exercise;
  isExpanded: boolean;
  onToggle: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  isExpanded,
  onToggle,
}) => {
  const instructionPreview = exercise.instructions.slice(0, 3);

  return (
    <div
      className={`exercise-card${
        isExpanded ? ' exercise-card--expanded' : ''
      }`}
      role="listitem"
    >
      {/* Card header row — always visible */}
      <button
        className="exercise-card__header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={`${
          isExpanded ? 'Collapse' : 'Expand'
        } details for ${exercise.name}`}
      >
        {/* Left: image placeholder */}
        <div className="exercise-card__thumb" aria-hidden="true">
          <ImagePlaceholderIcon />
        </div>

        {/* Middle: name + meta */}
        <div className="exercise-card__info">
          <span className="exercise-card__name">{exercise.name}</span>
          <div className="exercise-card__meta">
            <span className="exercise-card__tag">{exercise.category}</span>
            {exercise.equipment && (
              <span className="exercise-card__tag">{exercise.equipment}</span>
            )}
            <span
              className={`exercise-card__level exercise-card__level--${
                exercise.level
              }`}
            >
              {exercise.level}
            </span>
          </div>
        </div>

        {/* Right: chevron */}
        <span
          className={`exercise-card__chevron${
            isExpanded ? ' exercise-card__chevron--open' : ''
          }`}
          aria-hidden="true"
        >
          <ChevronIcon />
        </span>
      </button>

      {/* Expanded detail area */}
      {isExpanded && (
        <div className="exercise-card__body">
          <div className="exercise-card__detail-grid">
            <DetailRow label="Category" value={exercise.category} />
            {exercise.equipment && (
              <DetailRow label="Equipment" value={exercise.equipment} />
            )}
            <DetailRow label="Level" value={exercise.level} />
            {exercise.force && (
              <DetailRow label="Force" value={exercise.force} />
            )}
            {exercise.mechanic && (
              <DetailRow label="Mechanic" value={exercise.mechanic} />
            )}
            {exercise.primaryMuscles.length > 0 && (
              <DetailRow
                label="Primary muscles"
                value={exercise.primaryMuscles.join(', ')}
              />
            )}
            {exercise.secondaryMuscles.length > 0 && (
              <DetailRow
                label="Secondary muscles"
                value={exercise.secondaryMuscles.join(', ')}
              />
            )}
          </div>

          {instructionPreview.length > 0 && (
            <div className="exercise-card__instructions">
              <span className="exercise-card__instructions-label">
                Instructions
              </span>
              <ol className="exercise-card__instructions-list">
                {instructionPreview.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              {exercise.instructions.length > 3 && (
                <span className="exercise-card__instructions-more">
                  +{exercise.instructions.length - 3} more steps
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// DetailRow helper
// ---------------------------------------------------------------------------

const DetailRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="exercise-card__detail-row">
    <span className="exercise-card__detail-label">{label}</span>
    <span className="exercise-card__detail-value">{value}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 6 8 10 12 6" />
    </svg>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

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
      <line
        x1="32"
        y1="32"
        x2="43"
        y2="43"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="17"
        y1="22"
        x2="27"
        y2="22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default ExerciseLibrary;
