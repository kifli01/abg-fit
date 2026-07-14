import React, { useEffect, useRef, useState } from 'react';
import { Text, Input, Spacer, Loading } from '@geist-ui/core';
import { useExercises } from '../hooks/useExercises';
import { useAuth } from '../features/auth/useAuth';
import type { Exercise } from '../data/exercises';
import { buildExerciseImageMetadata, isSupportedImageFile, processExerciseImage, uploadExerciseImageAssets } from './exerciseImageUpload';
import { saveExerciseImageMetadata } from '../data/exercises/firestore';

/**
 * Exercise Library page.
 *
 * Loads exercises from Firestore via useExercises hook.
 * Renders exercise results as full-width expandable cards.
 *
 * Image rendering rules (exercise.image shape):
 *   - exercise.image === null         → no image; show placeholder icon
 *   - exercise.image?.thumbUrl        → use in collapsed / list card thumbnail
 *   - exercise.image?.url             → use in expanded card (full-resolution)
 *   Both thumbUrl and url may themselves be null within a non-null image object;
 *   always fall back to the placeholder icon when the URL value is null.
 */
const ExerciseLibrary: React.FC = () => {
  const { exercises, isLoading, error, search, query } = useExercises();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localExercises, setLocalExercises] = useState<Exercise[]>(exercises);

  useEffect(() => {
    setLocalExercises(exercises);
  }, [exercises]);

  function toggleCard(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleImageUploaded(exerciseId: string, nextImage: Exercise['image']) {
    setLocalExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, image: nextImage } : exercise
      )
    );
  }

  if (isLoading) {
    return (
      <div className="exercise-library exercise-library--loading">
        <Loading>Loading exercises…</Loading>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exercise-library exercise-library--error">
        <ErrorIcon />
        <Text p className="exercise-library__error-text">
          {error}
        </Text>
      </div>
    );
  }

  const results = localExercises;

  return (
    <div className="exercise-library">
      {/* Page header */}
      <div className="exercise-library__header">
        <Text h2 className="exercise-library__title">
          Exercise Library
        </Text>
        <Text p className="exercise-library__subtitle">
          Browse and search the full exercise catalog.
        </Text>
      </div>

      {/* Search */}
      <div className="exercise-library__search">
        <Input
          placeholder="Search exercises…"
          value={query}
          onChange={(e) => search(e.target.value)}
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
                onImageUploaded={handleImageUploaded}
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
  onImageUploaded?: (exerciseId: string, nextImage: Exercise['image']) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  isExpanded,
  onToggle,
  onImageUploaded,
}) => {
  const { isAuthorized, isAdmin } = useAuth();
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
        {/* Left: thumbnail — uses exercise.image?.thumbUrl; falls back to placeholder */}
        <div className="exercise-card__thumb" aria-hidden="true">
          {exercise.image?.thumbUrl ? (
            <img
              src={exercise.image.thumbUrl}
              alt={`${exercise.name} thumbnail`}
              className="exercise-card__thumb-image"
              loading="lazy"
            />
          ) : (
            <ImagePlaceholderIcon />
          )}
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
          {exercise.image?.url ? (
            <div className="exercise-card__hero-image">
              <img
                src={exercise.image.url}
                alt={`${exercise.name} exercise`}
                className="exercise-card__hero-image-element"
              />
            </div>
          ) : null}

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

          {/* Admin-only actions */}
          {isAuthorized && (
            <div className="exercise-card__admin-actions">
              <ImgPromptButton exercise={exercise} />
              {isAdmin && (
                <UploadImageButton
                  exercise={exercise}
                  onImageUploaded={onImageUploaded}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// UploadImageButton
// ---------------------------------------------------------------------------

/**
 * Admin-only button that opens the native file picker for image selection.
 * Renders as "Upload Image" (primary style) when exercise has no image,
 * and "Change Image" (secondary style) when an image URL already exists.
 *
 * File reading, processing, and uploading are intentionally out of scope
 * for this iteration (7.4). The button wires a hidden <input type="file">
 * to trigger the picker only.
 */
const UploadImageButton: React.FC<{
  exercise: Exercise;
  onImageUploaded?: (exerciseId: string, nextImage: Exercise['image']) => void;
}> = ({ exercise, onImageUploaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const hasImage = exercise.image != null && exercise.image.url != null;

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    if (!isSupportedImageFile(selectedFile)) {
      setStatusMessage('Please choose a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    setStatusMessage('Processing image…');

    try {
      const { original, thumbnail } = await processExerciseImage(selectedFile);
      const uploaded = await uploadExerciseImageAssets(original, thumbnail);
      const imagePayload = buildExerciseImageMetadata(uploaded);
      const nextImage = {
        url: imagePayload.url,
        path: imagePayload.path,
        updatedAt: imagePayload.updatedAt,
        thumbUrl: imagePayload.thumbUrl,
        thumbPath: imagePayload.thumbPath,
      } satisfies Exercise['image'];
      await saveExerciseImageMetadata(exercise.id, imagePayload);
      onImageUploaded?.(exercise.id, nextImage);
      console.info('Uploaded image assets', uploaded);
      setStatusMessage('Image uploaded.');
    } catch (error) {
      console.error('Failed to process image', error);
      setStatusMessage(error instanceof Error ? error.message : 'Unable to process image.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-hidden="true"
        tabIndex={-1}
        className="exercise-card__upload-input"
        onChange={handleFileChange}
      />
      <button
        className={`exercise-card__admin-btn${
          hasImage
            ? ' exercise-card__admin-btn--secondary'
            : ' exercise-card__admin-btn--primary'
        }`}
        onClick={handleClick}
        type="button"
        disabled={isUploading}
        aria-label={
          hasImage
            ? `Change image for ${exercise.name}`
            : `Upload image for ${exercise.name}`
        }
      >
        <UploadIcon />
        <span>{isUploading ? 'Processing…' : hasImage ? 'Change Image' : 'Upload Image'}</span>
      </button>
      {statusMessage && (
        <span className="exercise-card__upload-status">{statusMessage}</span>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// ImgPromptButton
// ---------------------------------------------------------------------------

/**
 * Builds a structured image-generation prompt from the exercise data,
 * copies it to the clipboard, and shows success/failure feedback.
 */
function buildImgPrompt(exercise: Exercise): string {
  const equipment = exercise.equipment
    ? normalizeEquipment(exercise.equipment)
    : 'no equipment';

  const primaryMuscles =
    exercise.primaryMuscles.length > 0
      ? exercise.primaryMuscles.join(', ')
      : 'not specified';

  const secondaryMuscles =
    exercise.secondaryMuscles.length > 0
      ? exercise.secondaryMuscles.join(', ')
      : 'none';

  const movementSummary = buildMovementSummary(exercise.instructions);

  return `Based on the attached reference images, generate a square 1:1 exercise image for a modern workout app.

Important:
- The attached character reference images must be treated as the primary source for the athlete's face, body type, hairstyle, clothing, and overall identity.
- The attached background and visual reference images must be treated as the primary source for composition, lighting, camera angle, color mood, and environment styling.
- Follow the attached references closely and keep the result consistent with them.
- Do not redesign the character or invent a different visual style.

Exercise: ${exercise.name}
Category: ${exercise.category}
Difficulty: ${exercise.level}
Equipment: ${equipment}
Primary muscles: ${primaryMuscles}
Secondary muscles: ${secondaryMuscles}

Exercise description:
${movementSummary}

Image requirements:
- One single athlete only
- Correct exercise form must be clearly visible
- Square 1:1 composition
- Clean, high-quality fitness app visual
- Minimal background clutter
- No text, no labels, no watermark, no UI
- Keep the character identity and visual style aligned with the attached references`;
}

/**
 * Converts an instructions array into a short, readable movement summary.
 * Uses the first 2–3 steps and synthesizes them into flowing prose.
 */
function buildMovementSummary(instructions: string[]): string {
  if (instructions.length === 0) return 'Perform the exercise with proper form.';
  // Take up to 3 steps, strip trailing periods for joining, then reassemble.
  const steps = instructions
    .slice(0, 3)
    .map((s) => s.trim().replace(/\.+$/, ''));
  if (steps.length === 1) return steps[0] + '.';
  if (steps.length === 2) return `${steps[0]}. ${steps[1]}.`;
  return `${steps[0]}. ${steps[1]}. ${steps[2]}.`;
}

/**
 * Normalizes common equipment values so they read naturally in a prompt.
 */
function normalizeEquipment(equipment: string): string {
  const map: Record<string, string> = {
    'body only': 'bodyweight only',
    'other': 'standard gym equipment',
    'machine': 'cable/machine',
    'e-z curl bar': 'EZ curl bar',
    'foam roll': 'foam roller',
  };
  const key = equipment.toLowerCase();
  return map[key] ?? equipment;
}

type CopyState = 'idle' | 'copied' | 'error';

const ImgPromptButton: React.FC<{ exercise: Exercise }> = ({ exercise }) => {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const handleClick = async () => {
    const prompt = buildImgPrompt(exercise);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2500);
    } catch {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 3000);
    }
  };

  return (
    <button
      className={`exercise-card__admin-btn exercise-card__admin-btn--img-prompt${
        copyState === 'copied' ? ' exercise-card__admin-btn--success' : ''
      }${
        copyState === 'error' ? ' exercise-card__admin-btn--error' : ''
      }`}
      onClick={handleClick}
      type="button"
      aria-label={`Copy image prompt for ${exercise.name}`}
    >
      {copyState === 'idle' && (
        <>
          <ImgPromptIcon />
          <span>Img Prompt</span>
        </>
      )}
      {copyState === 'copied' && (
        <>
          <CheckIcon />
          <span>Prompt copied</span>
        </>
      )}
      {copyState === 'error' && (
        <>
          <ErrorSmallIcon />
          <span>Copy failed</span>
        </>
      )}
    </button>
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

function ErrorIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="exercise-library__error-icon"
    >
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" />
      <line x1="24" y1="14" x2="24" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="33" r="1.5" fill="currentColor" />
    </svg>
  );
}

function ImgPromptIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <line x1="14" y1="5" x2="18" y2="5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ErrorSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export default ExerciseLibrary;
