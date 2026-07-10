import React, { useRef, useState } from 'react';
import { Text, Input, Spacer, Loading } from '@geist-ui/core';
import { useExercises } from '../hooks/useExercises';
import { updateExerciseImage } from '../data/exercises';
import type { Exercise, ExerciseImage } from '../data/exercises';
import { useAuth } from '../features/auth/useAuth';

/**
 * Exercise Library page.
 *
 * Loads exercises from Firestore via useExercises hook.
 * Renders exercise results as full-width expandable cards.
 */
const ExerciseLibrary: React.FC = () => {
  const { exercises, isLoading, error, search, query, updateLocalExerciseImage } =
    useExercises();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  function toggleCard(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
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

  const results = exercises;

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
                isAdmin={isAdmin}
                onToggle={() => toggleCard(exercise.id)}
                onImageUploaded={(image) =>
                  updateLocalExerciseImage(exercise.id, image)
                }
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
  isAdmin: boolean;
  onToggle: () => void;
  onImageUploaded: (image: ExerciseImage) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  isExpanded,
  isAdmin,
  onToggle,
  onImageUploaded,
}) => {
  const instructionPreview = exercise.instructions.slice(0, 3);
  const thumbUrl = exercise.image?.imageThumbUrl ?? exercise.image?.imageUrl ?? null;

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
        {/* Left: thumbnail or placeholder */}
        <div className="exercise-card__thumb" aria-hidden="true">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt=""
              className="exercise-card__thumb-img"
              width={64}
              height={64}
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
          {/* Full-width original image at the top of the expanded section */}
          {exercise.image?.imageUrl && (
            <div className="exercise-card__image-full">
              <img
                src={exercise.image.imageUrl}
                alt={`${exercise.name} exercise`}
                className="exercise-card__image-full-img"
              />
            </div>
          )}

          {/* Admin: upload / change image */}
          {isAdmin && (
            <ExerciseImageUploader
              exercise={exercise}
              onUploaded={onImageUploaded}
            />
          )}

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
// ExerciseImageUploader (admin only)
// ---------------------------------------------------------------------------

interface ExerciseImageUploaderProps {
  exercise: Exercise;
  onUploaded: (image: ExerciseImage) => void;
}

const ExerciseImageUploader: React.FC<ExerciseImageUploaderProps> = ({
  exercise,
  onUploaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const hasImage = !!exercise.image?.imageUrl;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Only jpeg, png, and webp images are supported.');
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('exerciseId', exercise.id);

      const response = await fetch('/api/upload-exercise-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? 'Upload failed');
      }

      const data = (await response.json()) as {
        imageUrl: string;
        imagePath: string;
        imageThumbUrl: string;
        imageThumbPath: string;
        imageUpdatedAt: string;
      };

      const image: ExerciseImage = {
        imageUrl: data.imageUrl,
        imagePath: data.imagePath,
        imageThumbUrl: data.imageThumbUrl,
        imageThumbPath: data.imageThumbPath,
        imageUpdatedAt: data.imageUpdatedAt,
      };

      // Persist to Firestore.
      await updateExerciseImage(exercise.id, image);

      // Refresh local UI immediately.
      onUploaded(image);
    } catch (err: unknown) {
      console.error('Image upload error:', err);
      setUploadError(
        err instanceof Error ? err.message : 'Upload failed. Please try again.'
      );
    } finally {
      setUploading(false);
      // Reset so the same file can be re-selected if needed.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="exercise-card__image-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="exercise-card__image-upload-input"
        aria-label={hasImage ? 'Change exercise image' : 'Upload exercise image'}
        disabled={uploading}
        onChange={handleFileChange}
      />
      <button
        className="exercise-card__image-upload-btn"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        type="button"
      >
        {uploading ? (
          <span className="exercise-card__image-upload-spinner" aria-hidden="true" />
        ) : (
          <UploadIcon />
        )}
        <span>
          {uploading
            ? 'Uploading…'
            : hasImage
            ? 'Change Image'
            : 'Upload Image'}
        </span>
      </button>
      {uploadError && (
        <span className="exercise-card__image-upload-error" role="alert">
          {uploadError}
        </span>
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

function UploadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="8 2 8 10" />
      <polyline points="4 6 8 2 12 6" />
      <path d="M2 13h12" />
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

export default ExerciseLibrary;
