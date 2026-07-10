import React, { useState } from 'react';
import { Text, Button, Spacer } from '@geist-ui/core';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { canonicalToFirestoreDoc } from '../../data/exercises/transform';
import type { CanonicalExercise } from '../../data/exercises/types';
import rawCatalog from '../../data/exercises/abgfit-exercises.canonical.json';

const COLLECTION = 'exercises';
const CHUNK_SIZE = 50;

type ImportStatus = 'idle' | 'checking' | 'ready' | 'running' | 'done' | 'error';

interface ImportState {
  status: ImportStatus;
  total: number;
  imported: number;
  existingCount: number;
  errorMessage: string | null;
}

/**
 * Admin-only exercise import page.
 *
 * Reads the canonical exercise dataset from the repository,
 * transforms each record into the Firestore document shape,
 * and writes them to the `exercises` Firestore collection.
 *
 * Writes are idempotent: re-running the import is safe and will overwrite
 * existing documents with the current canonical data.
 *
 * Requires the user to be signed in and authorized (enforced by the router).
 */
const ExerciseImport: React.FC = () => {
  const catalog = rawCatalog as CanonicalExercise[];
  const total = catalog.length;

  const [state, setState] = useState<ImportState>({
    status: 'idle',
    total,
    imported: 0,
    existingCount: 0,
    errorMessage: null,
  });

  async function checkExisting(): Promise<number> {
    // Spot-check the first 3 exercise IDs to estimate how many already exist.
    const sampleIds = catalog.slice(0, 3).map((e) => e.id);
    let count = 0;
    for (const id of sampleIds) {
      const snap = await getDoc(doc(db, COLLECTION, id));
      if (snap.exists()) count++;
    }
    // If all 3 samples exist, report the full total as the estimate.
    return count === 3 ? total : count;
  }

  async function handleCheck() {
    setState((s) => ({ ...s, status: 'checking', errorMessage: null }));
    try {
      const existingCount = await checkExisting();
      setState((s) => ({ ...s, status: 'ready', existingCount }));
    } catch (err) {
      console.error('Firestore check failed:', err);
      setState((s) => ({
        ...s,
        status: 'error',
        errorMessage: 'Failed to check Firestore. Check console for details.',
      }));
    }
  }

  async function handleImport() {
    setState((s) => ({ ...s, status: 'running', imported: 0, errorMessage: null }));

    try {
      const docs = catalog.map(canonicalToFirestoreDoc);

      for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const chunk = docs.slice(i, i + CHUNK_SIZE);

        await Promise.all(
          chunk.map((exercise) =>
            setDoc(doc(db, COLLECTION, exercise.id), exercise)
          )
        );

        setState((s) => ({
          ...s,
          imported: Math.min(i + CHUNK_SIZE, docs.length),
        }));
      }

      setState((s) => ({ ...s, status: 'done', imported: docs.length }));
    } catch (err) {
      console.error('Exercise import failed:', err);
      setState((s) => ({
        ...s,
        status: 'error',
        errorMessage:
          'Import failed. Check console for details. Documents written so far are already in Firestore.',
      }));
    }
  }

  const progressPct =
    state.total > 0 ? Math.round((state.imported / state.total) * 100) : 0;

  return (
    <div className="exercise-import">
      <div className="exercise-import__header">
        <Text h2 className="exercise-import__title">
          Exercise Import
        </Text>
        <Text p className="exercise-import__subtitle">
          Import the canonical exercise dataset into Firestore.
          This is an admin-only, one-time (idempotent) operation.
        </Text>
      </div>

      <Spacer h={1} />

      {/* Dataset summary */}
      <div className="exercise-import__info-card">
        <div className="exercise-import__info-row">
          <span className="exercise-import__info-label">Source</span>
          <span className="exercise-import__info-value">
            abgfit-exercises.canonical.json
          </span>
        </div>
        <div className="exercise-import__info-row">
          <span className="exercise-import__info-label">Exercises</span>
          <span className="exercise-import__info-value">{total}</span>
        </div>
        <div className="exercise-import__info-row">
          <span className="exercise-import__info-label">Target collection</span>
          <span className="exercise-import__info-value">{COLLECTION}</span>
        </div>
        <div className="exercise-import__info-row">
          <span className="exercise-import__info-label">Chunk size</span>
          <span className="exercise-import__info-value">{CHUNK_SIZE} documents / batch</span>
        </div>
      </div>

      <Spacer h={1} />

      {/* Warning */}
      {state.status === 'ready' && state.existingCount > 0 && (
        <div className="exercise-import__warning">
          <WarningIcon />
          <Text p className="exercise-import__warning-text">
            <strong>Warning:</strong> {state.existingCount === total
              ? 'All'
              : state.existingCount}{' '}
            exercise document{state.existingCount !== 1 ? 's' : ''} already
            exist in Firestore. Running the import will overwrite them with the
            current canonical data.
          </Text>
        </div>
      )}

      {/* Progress bar */}
      {(state.status === 'running' || state.status === 'done') && (
        <div className="exercise-import__progress">
          <div className="exercise-import__progress-bar-track">
            <div
              className="exercise-import__progress-bar-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <Text small className="exercise-import__progress-text">
            {state.imported} / {state.total} ({progressPct}%)
          </Text>
        </div>
      )}

      {/* Success state */}
      {state.status === 'done' && (
        <div className="exercise-import__success">
          <SuccessIcon />
          <Text p className="exercise-import__success-text">
            Import complete — {state.imported} exercise documents written to
            Firestore.
          </Text>
        </div>
      )}

      {/* Error state */}
      {state.status === 'error' && state.errorMessage && (
        <div className="exercise-import__error">
          <ErrorIcon />
          <Text p className="exercise-import__error-text">
            {state.errorMessage}
          </Text>
        </div>
      )}

      <Spacer h={1} />

      {/* Actions */}
      <div className="exercise-import__actions">
        {state.status === 'idle' && (
          <Button
            type="default"
            onClick={handleCheck}
            loading={false}
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            Check existing data
          </Button>
        )}

        {state.status === 'checking' && (
          <Button
            type="default"
            loading
            disabled
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            Checking Firestore…
          </Button>
        )}

        {state.status === 'ready' && (
          <Button
            type="success"
            onClick={handleImport}
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            {state.existingCount > 0
              ? `Overwrite and import ${total} exercises`
              : `Import ${total} exercises`}
          </Button>
        )}

        {state.status === 'running' && (
          <Button
            type="success"
            loading
            disabled
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            Importing…
          </Button>
        )}

        {(state.status === 'done' || state.status === 'error') && (
          <Button
            type="default"
            onClick={() =>
              setState({
                status: 'idle',
                total,
                imported: 0,
                existingCount: 0,
                errorMessage: null,
              })
            }
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            Reset
          </Button>
        )}
      </div>

      <Spacer h={2} />

      {/* Firestore document shape reference */}
      <details className="exercise-import__schema">
        <summary className="exercise-import__schema-summary">
          Firestore document shape
        </summary>
        <pre className="exercise-import__schema-pre">{JSON.stringify(
          {
            id: 'Ab_Roller',
            slug: 'ab-roller',
            name: 'Ab Roller',
            aliases: ['Ab Roller'],
            force: 'pull',
            level: 'intermediate',
            mechanic: 'compound',
            equipment: 'Other',
            primaryMuscles: ['Abdominals'],
            secondaryMuscles: ['Shoulders'],
            instructions: ['Hold the Ab Roller with both hands and kneel on the floor.'],
            category: 'Strength',
            searchTerms: ['ab-roller', 'ab roller', 'abdominals', 'shoulders', 'other', 'strength', 'pull', 'compound'],
            source: { name: 'free-exercise-db', license: 'Unlicense', sourceId: 'Ab_Roller' },
            image: null,
          },
          null,
          2
        )}</pre>
      </details>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function WarningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <polyline points="9 12 11 14 15 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <line x1="12" y1="8" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default ExerciseImport;
